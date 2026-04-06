import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import yahooFinance from './lib/yahooFinance.js';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testChat() {
  try {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the price of AAPL?' }
    ];

    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_stock_quote',
          description: 'Get stock price',
          parameters: {
            type: 'object',
            properties: { symbol: { type: 'string' } },
            required: ['symbol']
          }
        }
      }
    ];

    console.log('Sending first request...');
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools,
      tool_choice: 'auto'
    });

    const responseMessage = response.choices[0].message;
    console.log('Response content:', responseMessage.content);
    console.log('Tool calls:', responseMessage.tool_calls);

    if (responseMessage.tool_calls) {
      messages.push(responseMessage);
      for (const toolCall of responseMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        console.log('Fetching quote for:', args.symbol);
        const quote = await yahooFinance.quote(args.symbol);
        const fnResponse = JSON.stringify({ price: quote.regularMarketPrice });
        
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: fnResponse
        });
      }

      console.log('Sending second request...');
      const secondResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages
      });

      const content = secondResponse.choices[0].message.content;
      console.log('Second response content:', content);
      
      const cleanReply = (content || "")
        .replace(/<function[\s\S]*?<\/function>/gi, '')
        .trim();
      console.log('Clean reply:', cleanReply);
    }
  } catch (error) {
    console.error('ERROR:', error);
  }
}

testChat();
