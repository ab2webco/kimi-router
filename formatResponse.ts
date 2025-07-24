export function formatOpenAIToAnthropic(completion: any, model: string): any {
  const messageId = "msg_" + Date.now();

  let content: any = [];
  if (completion.choices[0].message.content) {
    content = [{ text: completion.choices[0].message.content, type: "text" }];
  } else if (completion.choices[0].message.tool_calls) {
    content = completion.choices[0].message.tool_calls.map((item: any) => {
      return {
        type: 'tool_use',
        id: item.id,
        name: item.function?.name,
        input: item.function?.arguments ? JSON.parse(item.function.arguments) : {},
      };
    });
  }

  const result = {
    id: messageId,
    type: "message",
    role: "assistant",
    content: content,
    stop_reason: completion.choices[0].finish_reason === 'tool_calls' ? "tool_use" : "end_turn",
    stop_sequence: null,
    model,
  };
  return result;
}