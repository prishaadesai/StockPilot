import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import yahooFinance from './lib/yahooFinance.js';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
  const message = "Should I buy AAPL?";
  const history = [];
  
  try {
    const contextPrompt = `You are StockPilot AI. Friendly, expert advisor. Clear YES/NO.`;
    const messages = [
      { role: 'system', content: contextPrompt },
      { role: 'user', content: message }
    ];

    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_stock_quote',
          description: 'Get price',
          parameters: {
            type: 'object',
            properties: { symbol: { type: 'string' } },
            required: ['symbol']
          }
        }
      }
    ];

    console.log("Starting first call...");
    let response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools,
      tool_choice: 'auto'
    });

    const responseMessage = response.choices[0].message;
    console.log("First call response:", JSON.stringify(responseMessage, null, 2));

    if (responseMessage.tool_calls) {
      messages.push(responseMessage);
      for (const toolCall of responseMessage.tool_calls) {
        console.log("Executing tool:", toolCall.function.name);
        const args = JSON.parse(toolCall.function.arguments);
        const quote = await yahooFinance.quote(args.symbol);
        const fnResponse = JSON.stringify({ price: quote.regularMarketPrice });
        
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: fnResponse
        });
      }

      console.log("Starting second call...");
      const secondResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages
      });
      console.log("Final response:", secondResponse.choices[0].message.content);
    } else {
      console.log("Final response (no tools):", responseMessage.content);
    }
  } catch (err) {
    console.error("TEST FAILED:", err);
  }
}

test();
