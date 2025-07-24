interface MessageCreateParamsBase {
  model: string;
  messages: any[];
  system?: any;
  temperature?: number;
  tools?: any[];
  stream?: boolean;
}


/**
 * Validates OpenAI format messages to ensure complete tool_calls/tool message pairing.
 * Requires tool messages to immediately follow assistant messages with tool_calls.
 * Enforces strict immediate following sequence between tool_calls and tool messages.
 */
function validateOpenAIToolCalls(messages: any[]): any[] {
  const validatedMessages: any[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    const currentMessage = { ...messages[i] };
    
    // Process assistant messages with tool_calls
    if (currentMessage.role === "assistant" && currentMessage.tool_calls) {
      const validToolCalls: any[] = [];
      const removedToolCallIds: string[] = [];
      
      // Collect all immediately following tool messages
      const immediateToolMessages: any[] = [];
      let j = i + 1;
      while (j < messages.length && messages[j].role === "tool") {
        immediateToolMessages.push(messages[j]);
        j++;
      }
      
      // For each tool_call, check if there's an immediately following tool message
      currentMessage.tool_calls.forEach((toolCall: any) => {
        const hasImmediateToolMessage = immediateToolMessages.some(toolMsg => 
          toolMsg.tool_call_id === toolCall.id
        );
        
        if (hasImmediateToolMessage) {
          validToolCalls.push(toolCall);
        } else {
          removedToolCallIds.push(toolCall.id);
        }
      });
      
      // Update the assistant message
      if (validToolCalls.length > 0) {
        currentMessage.tool_calls = validToolCalls;
      } else {
        delete currentMessage.tool_calls;
      }
      
      
      // Only include message if it has content or valid tool_calls
      if (currentMessage.content || currentMessage.tool_calls) {
        validatedMessages.push(currentMessage);
      }
    }
    
    // Process tool messages
    else if (currentMessage.role === "tool") {
      let hasImmediateToolCall = false;
      
      // Check if the immediately preceding assistant message has matching tool_call
      if (i > 0) {
        const prevMessage = messages[i - 1];
        if (prevMessage.role === "assistant" && prevMessage.tool_calls) {
          hasImmediateToolCall = prevMessage.tool_calls.some((toolCall: any) => 
            toolCall.id === currentMessage.tool_call_id
          );
        } else if (prevMessage.role === "tool") {
          // Check for assistant message before the sequence of tool messages
          for (let k = i - 1; k >= 0; k--) {
            if (messages[k].role === "tool") continue;
            if (messages[k].role === "assistant" && messages[k].tool_calls) {
              hasImmediateToolCall = messages[k].tool_calls.some((toolCall: any) => 
                toolCall.id === currentMessage.tool_call_id
              );
            }
            break;
          }
        }
      }
      
      if (hasImmediateToolCall) {
        validatedMessages.push(currentMessage);
      }
    }
    
    // For all other message types, include as-is
    else {
      validatedMessages.push(currentMessage);
    }
  }
  
  return validatedMessages;
}

export function mapModel(anthropicModel: string): string {
  // If model already contains '/', it's an OpenRouter model ID - return as-is
  if (anthropicModel.includes('/')) {
    return anthropicModel;
  }
  
  if (anthropicModel.includes('haiku')) {
    return 'anthropic/claude-3.5-haiku';
  } else if (anthropicModel.includes('sonnet')) {
    return 'anthropic/claude-sonnet-4';
  } else if (anthropicModel.includes('opus')) {
    return 'anthropic/claude-opus-4';
  }
  return anthropicModel;
}

// Function to detect if messages contain images
function hasImageContent(messages: any[]): boolean {
  return messages.some(message => {
    if (!Array.isArray(message.content)) return false;
    return message.content.some((content: any) => content.type === 'image');
  });
}

// Function to auto-select model based on content and environment variables
function autoSelectModel(originalModel: string, messages: any[], env?: any): string {
  // If user explicitly specified a full model path, respect it
  if (originalModel.includes('/')) {
    return originalModel;
  }
  
  // Get models from environment variables (for Node.js server)
  // Default to kimi-k2 for text (economic) unless overridden
  const defaultModel = 'moonshotai/kimi-k2';
  // Allow override of vision model via env var, default to claude-3.5-sonnet
  const visionModel = process.env.ANTHROPIC_VISION_MODEL || env?.ANTHROPIC_VISION_MODEL || 'anthropic/claude-3.5-sonnet';
  const fastModel = defaultModel; // For now, use same as default
  
  // Auto-switch based on content
  if (hasImageContent(messages)) {
    // Use vision-capable model for images
    return visionModel;
  } else {
    // Use default economic model for text-only
    return defaultModel;
  }
}

export function formatAnthropicToOpenAI(body: MessageCreateParamsBase, env?: any): any {
  const { model, messages, system = [], temperature, tools, stream } = body;
  
  // Auto-select the best model based on content
  const selectedModel = autoSelectModel(model, messages, env);
  
  // Log model selection for debugging
  const hasImages = hasImageContent(messages);
  console.log(`📊 Model Selection:
    - Content type: ${hasImages ? '🖼️  Has images' : '📝 Text only'}
    - Selected model: ${selectedModel}
    - Vision override: ${process.env.ANTHROPIC_VISION_MODEL || env?.ANTHROPIC_VISION_MODEL || 'none (using default)'}
  `);
  
  if (selectedModel !== model) {
    console.log(`🔄 Auto-switched model: ${model} → ${selectedModel} (${hasImages ? 'images detected' : 'text only'})`);
  }

  const openAIMessages = Array.isArray(messages)
    ? messages.flatMap((anthropicMessage) => {
        const openAiMessagesFromThisAnthropicMessage: any[] = [];

        if (!Array.isArray(anthropicMessage.content)) {
          if (typeof anthropicMessage.content === "string") {
            openAiMessagesFromThisAnthropicMessage.push({
              role: anthropicMessage.role,
              content: anthropicMessage.content,
            });
          }
          return openAiMessagesFromThisAnthropicMessage;
        }

        if (anthropicMessage.role === "assistant") {
          const assistantMessage: any = {
            role: "assistant",
            content: null,
          };
          let textContent = "";
          const toolCalls: any[] = [];

          anthropicMessage.content.forEach((contentPart: any) => {
            if (contentPart.type === "text") {
              textContent += (typeof contentPart.text === "string"
                ? contentPart.text
                : JSON.stringify(contentPart.text)) + "\n";
            } else if (contentPart.type === "tool_use") {
              toolCalls.push({
                id: contentPart.id,
                type: "function",
                function: {
                  name: contentPart.name,
                  arguments: JSON.stringify(contentPart.input),
                },
              });
            }
          });

          const trimmedTextContent = textContent.trim();
          if (trimmedTextContent.length > 0) {
            assistantMessage.content = trimmedTextContent;
          }
          if (toolCalls.length > 0) {
            assistantMessage.tool_calls = toolCalls;
          }
          if (assistantMessage.content || (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0)) {
            openAiMessagesFromThisAnthropicMessage.push(assistantMessage);
          }
        } else if (anthropicMessage.role === "user") {
          let userTextMessageContent = "";
          const subsequentToolMessages: any[] = [];
          const contentParts: any[] = [];

          anthropicMessage.content.forEach((contentPart: any) => {
            if (contentPart.type === "text") {
              userTextMessageContent += (typeof contentPart.text === "string"
                ? contentPart.text
                : JSON.stringify(contentPart.text)) + "\n";
              contentParts.push({
                type: "text",
                text: typeof contentPart.text === "string"
                  ? contentPart.text
                  : JSON.stringify(contentPart.text)
              });
            } else if (contentPart.type === "image") {
              // Convert Anthropic image format to OpenAI format
              contentParts.push({
                type: "image_url",
                image_url: {
                  url: `data:${contentPart.source.media_type};base64,${contentPart.source.data}`
                }
              });
            } else if (contentPart.type === "tool_result") {
              subsequentToolMessages.push({
                role: "tool",
                tool_call_id: contentPart.tool_use_id,
                content: typeof contentPart.content === "string"
                  ? contentPart.content
                  : JSON.stringify(contentPart.content),
              });
            }
          });

          // Use structured content if we have images, otherwise use simple text
          if (contentParts.some(part => part.type === "image_url")) {
            openAiMessagesFromThisAnthropicMessage.push({
              role: "user",
              content: contentParts,
            });
          } else {
            const trimmedUserText = userTextMessageContent.trim();
            if (trimmedUserText.length > 0) {
              openAiMessagesFromThisAnthropicMessage.push({
                role: "user",
                content: trimmedUserText,
              });
            }
          }
          openAiMessagesFromThisAnthropicMessage.push(...subsequentToolMessages);
        }
        return openAiMessagesFromThisAnthropicMessage;
      })
    : [];

  const systemMessages = Array.isArray(system)
    ? system.map((item) => {
        const content: any = {
          type: "text",
          text: item.text
        };
        if (model.includes('claude')) {
          content.cache_control = {"type": "ephemeral"};
        }
        return {
          role: "system",
          content: [content]
        };
      })
    : [{
        role: "system",
        content: [{
          type: "text",
          text: system,
          ...(model.includes('claude') ? { cache_control: {"type": "ephemeral"} } : {})
        }]
      }];

  const data: any = {
    model: mapModel(selectedModel),
    messages: [...systemMessages, ...openAIMessages],
    temperature,
    stream,
  };

  if (tools) {
    data.tools = tools.map((item: any) => ({
      type: "function",
      function: {
        name: item.name,
        description: item.description,
        parameters: item.input_schema,
      },
    }));
  }

  // Validate OpenAI messages to ensure complete tool_calls/tool message pairing
  data.messages = [...systemMessages, ...validateOpenAIToolCalls(openAIMessages)];

  return data;
}