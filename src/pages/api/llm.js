import { GoogleCustomSearch } from "openai-function-calling-tools";
import { LLMError, LLMStream } from './stream';

const handler = async (req, res) => {
  try {
    const googleCustomSearch = new GoogleCustomSearch({
        apiKey: process.env.API_KEY,
        googleCSEId: process.env.CONTEXT_KEY,
    });

    const messages = [
        {
          role: "user",
          content: req.body.question,
        },
      ];
    
    const functions = {
        googleCustomSearch
    };

    const promptToSend = "You are a helpful assistant, a search term is provided and you are given search results to help provide a useful response.";
    const stream = await LLMStream({ id: "gpt-3.5-turbo-0613" }, promptToSend, 0.8, messages, functions);

    let data = "";
    const decoder = new TextDecoder();
    for await (const chunk of stream) {
        let text = decoder.decode(chunk);
 
        if (text !== 'null') {
            data += text;
            res.write(text === 'null' ? 'loading' : data);
        }
    }

    return res.end();

  } catch (error) {
    console.error(error);
    if (error instanceof LLMError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;