import { createParser } from 'eventsource-parser';

export const OPENAI_API_HOST = process.env.OPENAI_API_HOST || "https://api.openai.com";
export const OPENAI_API_TYPE = process.env.OPENAI_API_TYPE || "openai";

export class LLMError extends Error {
  constructor(message, type, param, code) {
    super(message);
    this.name = 'LLMError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

export const LLMStream = async (
  model,
  systemPrompt,
  temperature,
  messages,
  functions
) => {

  let url = `${OPENAI_API_HOST}/v1/chat/completions`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(OPENAI_API_TYPE === 'openai' && {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      })
    },
    method: 'POST',
    body: JSON.stringify({
      ...(OPENAI_API_TYPE === 'openai' && {model: model.id}),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: temperature,
      functions: [functions['googleCustomSearch']['googleCustomSearchSchema']],
      stream: true,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new LLMError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      let func_call = {
        "name": null,
        "arguments": "",
      };
  
      const onParse = async (event) => {
        if (event.type === 'event') {
          const data = event.data;

          try {
            if (data === "[DONE]" || !data) {
              return;
            }
  
            const json = JSON.parse(data);
  
            if (Array.isArray(json.choices) && json.choices.length > 0) {
              const choice = json.choices[0];
              const delta = choice.delta;
  
              if (choice.finish_reason === "stop") {
                controller.close();
                return;
              }
  
              if (delta.hasOwnProperty("function_call")) {
                if (delta.function_call.hasOwnProperty("name")) {
                  func_call["name"] = delta.function_call["name"];
                }
                if (delta.function_call.hasOwnProperty("arguments")) {
                  func_call["arguments"] += delta.function_call["arguments"];
                }
              }
  
              if (choice.finish_reason === "function_call") {
                // function call here using func_call
                const fn = functions[func_call.name][func_call.name];
                const funcResult = await fn(func_call.arguments);
                const serpQueue = encoder.encode(funcResult);
                controller.enqueue(serpQueue);
              }
  
              if (delta && 'content' in delta) {
                const text = delta.content;
                const queue = encoder.encode(text);
                controller.enqueue(queue);
              }
            } else {
              console.error('No choices found in json');
            }
          } catch (e) {
            console.log(e);
            controller.error(e);
          }
        }
      };
  
      const parser = createParser(onParse);
  
      for await (const chunk of res.body) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });
  

  return stream;
};
