export function streamOpenAIToAnthropic(openaiStream: ReadableStream, model: string): ReadableStream {
  const messageId = "msg_" + Date.now();
  
  const enqueueSSE = (controller: ReadableStreamDefaultController, eventType: string, data: any) => {
    const sseMessage = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(sseMessage));
  };
  
  return new ReadableStream({
    async start(controller) {
      // Send message_start event
      const messageStart = {
        type: "message_start",
        message: {
          id: messageId,
          type: "message",
          role: "assistant",
          content: [],
          model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 1, output_tokens: 1 },
        },
      };
      enqueueSSE(controller, "message_start", messageStart);

      let contentBlockIndex = 0;
      let hasStartedTextBlock = false;
      let isToolUse = false;
      let currentToolCallId: string | null = null;
      let toolCallJsonMap = new Map<string, string>();

      const reader = openaiStream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Process any remaining data in buffer
            if (buffer.trim()) {
              const lines = buffer.split('\n');
              for (const line of lines) {
                if (line.trim() && line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta;
                    if (delta) {
                      processStreamDelta(delta);
                    }
                  } catch (e) {
                    // Parse error - ignore malformed chunks
                  }
                }
              }
            }
            break;
          }
          
          // Decode chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process complete lines from buffer
          const lines = buffer.split('\n');
          // Keep the last potentially incomplete line in buffer
          buffer = lines.pop() || '';
          
          // Process complete lines in order
          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;
                
                if (!delta) continue;
                processStreamDelta(delta);
              } catch (e) {
                // Parse error - ignore malformed chunks
                continue;
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Stream processing error:', streamError);
      } finally {
        try {
          reader.releaseLock();
        } catch (e) {
          // Reader might already be released
        }
      }

      function processStreamDelta(delta: any) {

        // Handle tool calls
        if (delta.tool_calls?.length > 0) {
          // Existing tool call logic
          for (const toolCall of delta.tool_calls) {
            const toolCallId = toolCall.id;

            if (toolCallId && toolCallId !== currentToolCallId) {
              if (isToolUse || hasStartedTextBlock) {
                enqueueSSE(controller, "content_block_stop", {
                  type: "content_block_stop",
                  index: contentBlockIndex,
                });
              }

              isToolUse = true;
              hasStartedTextBlock = false; // Reset text block flag
              currentToolCallId = toolCallId;
              contentBlockIndex++;
              toolCallJsonMap.set(toolCallId, "");

              const toolBlock = {
                type: "tool_use",
                id: toolCallId,
                name: toolCall.function?.name,
                input: {},
              };

              enqueueSSE(controller, "content_block_start", {
                type: "content_block_start",
                index: contentBlockIndex,
                content_block: toolBlock,
              });
            }

            if (toolCall.function?.arguments && currentToolCallId) {
              const currentJson = toolCallJsonMap.get(currentToolCallId) || "";
              toolCallJsonMap.set(currentToolCallId, currentJson + toolCall.function.arguments);

              enqueueSSE(controller, "content_block_delta", {
                type: "content_block_delta",
                index: contentBlockIndex,
                delta: {
                  type: "input_json_delta",
                  partial_json: toolCall.function.arguments,
                },
              });
            }
          }
        } else if (delta.content) {
          // Filter out reserved tokens and other special tokens that can cause streaming issues
          const cleanContent = delta.content
            .replace(/<\|reserved_token_\d+\|>/g, '')
            .replace(/<\|.*?\|>/g, '') // Filter any other special tokens
            .replace(/\u0000/g, ''); // Filter null bytes
          
          // Skip if content is empty after filtering
          if (!cleanContent) return;
          
          if (isToolUse) {
            enqueueSSE(controller, "content_block_stop", {
              type: "content_block_stop",
              index: contentBlockIndex,
            });
            isToolUse = false; // Reset tool use flag
            currentToolCallId = null;
            contentBlockIndex++; // Increment for new text block
          }

          if (!hasStartedTextBlock) {
            enqueueSSE(controller, "content_block_start", {
              type: "content_block_start",
              index: contentBlockIndex,
              content_block: {
                type: "text",
                text: "",
              },
            });
            hasStartedTextBlock = true;
          }

          enqueueSSE(controller, "content_block_delta", {
            type: "content_block_delta",
            index: contentBlockIndex,
            delta: {
              type: "text_delta",
              text: cleanContent,
            },
          });
        }
      }

      // Close last content block
      if (isToolUse || hasStartedTextBlock) {
        enqueueSSE(controller, "content_block_stop", {
          type: "content_block_stop",
          index: contentBlockIndex,
        });
      }

      // Send message_delta and message_stop
      enqueueSSE(controller, "message_delta", {
        type: "message_delta",
        delta: {
          stop_reason: isToolUse ? "tool_use" : "end_turn",
          stop_sequence: null,
        },
        usage: { input_tokens: 100, output_tokens: 150 },
      });

      enqueueSSE(controller, "message_stop", {
        type: "message_stop",
      });

      // Close the controller properly
      try {
        controller.close();
      } catch (e) {
        // Controller might already be closed
      }
    },
  });
}