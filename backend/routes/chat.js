import express from 'express';
import { protect } from '../middleware/auth.js';
import Groq from 'groq-sdk';
import yahooFinance from '../lib/yahooFinance.js';
import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';
import Wishlist from '../models/Wishlist.js';

const router = express.Router();

// @route   POST /api/chat
router.post('/', protect, async (req, res) => {
  const { message, history, currency, exchangeRate = 83.5 } = req.body;
  const userCurrency = currency || 'USD';
  
  // Response cleaning utility
  const cleanAIResponse = (text) => {
    if (!text) return "";
    return text
      .replace(/<function[\s\S]*?<\/function>/gi, '')
      .replace(/<tool[\s\S]*?<\/tool>/gi, '')
      .replace(/get_stock_quote\(.*?\)|get_stock_history\(.*?\)|buy_stock\(.*?\)|sell_stock\(.*?\)|search_stocks\(.*?\)|add_to_wishlist\(.*?\)/gi, '')
      .replace(/\[\s*\]/gi, '')
      .replace(/\{"symbol":[\s\S]*?\}/gi, '')
      .trim();
  };
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GROQ_API_KEY is missing in backend .env',
      reply: 'I am currently in maintenance mode because the Groq API key is missing. Please ask the developer to add the GROQ_API_KEY to the backend .env file!'
    });
  }

  const groq = new Groq({ apiKey });

  try {
    let refreshRequired = false;
    // 1. Fetch User Context (Portfolio & Wallet & Wishlist)
    const user = await User.findById(req.user.id);
    console.log(`💬 [AI CHAT] Request from: ${user?.email} (ID: ${req.user.id}) | Balance: $${user?.walletBalance}`);
    const portfolio = await Portfolio.find({ user: req.user.id });
    const wishlist = await Wishlist.find({ user: req.user.id });
    
    // Personality Injection: Friendly, Expert, Opinionated Advisor
    const contextPrompt = `You are StockPilot AI, a **very friendly, expert financial advisor and research assistant**. 

Current User Context:
- Name: ${user?.name || 'Guest'}
- Terminal Currency: ${userCurrency || 'USD'}
- Wallet: $${user?.walletBalance?.toFixed(2) || '0.00'} (Note: Wallet is stored in USD internally)
- Portfolio: ${portfolio.length > 0 ? portfolio.map(p => `${p.sym} (${p.quantity} @ $${p.avgPrice})`).join(', ') : 'Empty'}
- Wishlist: ${wishlist.length > 0 ? wishlist.map(w => w.sym).join(', ') : 'Empty'}

Stock Ticker Cheat Sheet (IMPORTANT):
- Indian Stocks MUST have .NS suffix: RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS, ICICIBANK.NS, BHARTIARTL.NS, SBIN.NS.
- US Stocks: AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, META.
- Crypto: BTC-USD, ETH-USD, SOL-USD.

Tone & Voice:
- Be **extremely friendly** and warm (use emojis! 👋🚀📈).
- **CRITICAL: Keep your messages EXTREMELY concise and punchy.**
- **MAX 2-3 short sentences per response.**
- Use bullet points for data. Avoid long paragraphs at all costs.
- **NEVER be neutral**. Give clear **YES** or **NO** opinions after analysis.
- **Standardized Math**: 1 USD = ${exchangeRate} INR. ALWAYS use this conversion factor. 
- If Terminal Currency is INR, ALWAYS multiply the USD wallet/portfolio values by ${exchangeRate} to get the ₹ value. Do not guess.
- **Accuracy**: Your wallet is $${user?.walletBalance}, which is ₹${(user?.walletBalance * exchangeRate).toLocaleString()} at the current rate.
- **Hybrid Currency Model**: ALWAYS report individual stock prices in their **native** exchange currency (e.g., $ for US, ₹ for India). However, ALWAYS report **Account Totals** (Wallet, Portfolio Value, P&L) in the user's **Terminal Currency** (${userCurrency || 'USD'}).
- Use Hindi/Hinglish if the user does (e.g., "sell kardo", "buy karle").`;

    const messages = [{ role: 'system', content: contextPrompt }];

    // Filter and map history to ensure alternating roles and avoid doubles
    if (history && history.length > 0) {
      history.forEach((h) => {
        const lastMsg = messages[messages.length - 1];
        const role = h.role === 'user' ? 'user' : 'assistant';
        // Only push if role alternates, otherwise it breaks LLM APIs
        if (lastMsg.role !== role) {
          messages.push({ role, content: h.content });
        }
      });
    }

    // Final user message
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'user') {
      // If history ended in user, update it with current message instead of pushing new one
      lastMsg.content = message;
    } else {
      messages.push({ role: 'user', content: message });
    }

    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_stock_quote',
          description: 'Get the current price and market data for a stock symbol',
          parameters: {
            type: 'object',
            properties: {
              symbol: { type: 'string', description: 'The stock symbol, e.g. AAPL or HDFCBANK.NS' }
            },
            required: ['symbol']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_stock_history',
          description: 'Get historical price data for a stock symbol over a range (required for research/opinions)',
          parameters: {
            type: 'object',
            properties: {
              symbol: { type: 'string', description: 'The stock symbol' },
              range: { 
                type: 'string', 
                enum: ['1d', '5d', '1mo', '3mo', '6mo', '1y'],
                description: 'The time range for history'
              }
            },
            required: ['symbol']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'add_to_wishlist',
          description: 'Adds a stock symbol to the user\'s personal wishlist',
          parameters: {
            type: 'object',
            properties: {
              symbol: { type: 'string', description: 'The stock symbol, e.g. MSFT' },
              name: { type: 'string', description: 'The display name of the stock, e.g. Microsoft' }
            },
            required: ['symbol', 'name']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'buy_stock',
          description: 'Execute a BUY order for a stock symbol with a specific quantity',
          parameters: {
            type: 'object',
            properties: {
              symbol: { type: 'string', description: 'The stock symbol, e.g. AAPL' },
              quantity: { type: 'string', description: 'Number of shares to buy (numeric string)' },
              name: { type: 'string', description: 'Display name of the stock' }
            },
            required: ['symbol', 'quantity']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'sell_stock',
          description: 'Execute a SELL order for a stock symbol with a specific quantity',
          parameters: {
            type: 'object',
            properties: {
              symbol: { type: 'string', description: 'The stock symbol, e.g. TSLA' },
              quantity: { type: 'string', description: 'Number of shares to sell (use -1 for ALL)' }
            },
            required: ['symbol', 'quantity']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_stocks',
          description: 'Search for stock symbols, names, and exchanges',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The search term, e.g. "Reliance", "Apple", "Bitcoin"' }
            },
            required: ['query']
          }
        }
      }
    ];

    // Initial completion call
    let response;
    try {
      response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 256
      });
    } catch (e) {
      console.error('❌ [GROQ FIRST CALL ERROR]:', e);
      throw e; // Bubble up to main catch
    }

    let responseMessage = response.choices[0].message;

    // Tool execution loop
    if (responseMessage.tool_calls) {
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        let fnResponse = '';
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          console.error(`❌ [AI JSON PARSE ERROR] Malformed arguments from LLM:`, toolCall.function.arguments);
          fnResponse = `Faulty tool call: Arguments must be valid JSON. Please retry.`;
        }

        if (fnResponse === '') {
          console.log(`🚀 [AI TOOL] Calling ${functionName} with:`, args);

        if (functionName === 'get_stock_quote') {
          try {
            let sym = args.symbol.toUpperCase();
            if (!sym.includes('.') && sym.length >= 4 && sym.length <= 9 && !['BTC', 'ETH', 'SOL'].includes(sym)) {
              sym += '.NS';
            }
            const quote = await yahooFinance.quote(sym, {}, { validateResult: false, validateOptions: false });
            fnResponse = JSON.stringify({
              symbol: quote.symbol,
              price: quote.regularMarketPrice,
              change: quote.regularMarketChangePercent,
              currency: quote.currency,
              name: quote.shortName || quote.longName
            });
          } catch (e) {
            fnResponse = `Error fetching quote: ${e.message}`;
          }
        } else if (functionName === 'get_stock_history') {
          try {
            let sym = args.symbol.toUpperCase();
            if (!sym.includes('.') && sym.length >= 4 && sym.length <= 9 && !['BTC', 'ETH', 'SOL'].includes(sym)) {
              sym += '.NS';
            }
            const range = args.range || '1mo';
            const queryOptions = { period1: '2024-01-01', interval: '1d' };
            const now = new Date();
            if (range === '1d') now.setDate(now.getDate() - 1);
            else if (range === '5d') now.setDate(now.getDate() - 5);
            else if (range === '1mo') now.setMonth(now.getMonth() - 1);
            else if (range === '3mo') now.setMonth(now.getMonth() - 3);
            else if (range === '6mo') now.setMonth(now.getMonth() - 6);
            else if (range === '1y') now.setFullYear(now.getFullYear() - 1);
            
            queryOptions.period1 = now.toISOString().split('T')[0];
            
            const result = await yahooFinance.chart(sym, queryOptions, { validateResult: false, validateOptions: false });
            const prices = result.quotes.filter(q => q && q.close).map(q => ({
              date: q.date,
              close: q.close?.toFixed(2)
            }));
            
            fnResponse = JSON.stringify({
              symbol: args.symbol,
              range,
              data: prices.slice(-15)
            });
          } catch (e) {
            fnResponse = `Error fetching history: ${e.message}`;
          }
        } else if (functionName === 'add_to_wishlist') {
          try {
            // Check if already in wishlist
            const exists = await Wishlist.findOne({ user: req.user.id, sym: args.symbol });
            if (exists) {
              fnResponse = `I checked, and ${args.symbol} is already in your wishlist! No worries.`;
            } else {
              await Wishlist.create({ user: req.user.id, sym: args.symbol, name: args.name });
              fnResponse = `Successfully added ${args.symbol} (${args.name}) to your wishlist! Done.`;
            }
          } catch (e) {
            fnResponse = `Failed to add to wishlist: ${e.message}`;
          }
        } else if (functionName === 'buy_stock') {
          try {
            const qty = Number(args.quantity);
            let sym = args.symbol.toUpperCase();
            if (!sym.includes('.') && sym.length >= 4 && sym.length <= 9 && !['BTC', 'ETH', 'SOL'].includes(sym)) {
              sym += '.NS';
            }

            const quote = await yahooFinance.quote(sym, {}, { validateResult: false, validateOptions: false });
            const price = quote.regularMarketPrice;
            if (!price) {
              fnResponse = `Transaction failed: Could not fetch a valid price for ${sym}. Please check the symbol.`;
            } else {
              const totalCostUSD = price * qty;
              const userDoc = await User.findById(req.user.id);
              
              if (userDoc.walletBalance < totalCostUSD) {
                // Report in user's display currency
                const costDisp = totalCostUSD * exchangeRate;
                const balanceDisp = userDoc.walletBalance * exchangeRate;
                const cs = currencySymbol(userCurrency);
                fnResponse = `Transaction failed: Insufficient funds. You need ${cs}${costDisp.toLocaleString(undefined, { minimumFractionDigits: 2 })} but your balance is ${cs}${balanceDisp.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`;
              } else {
                userDoc.walletBalance -= totalCostUSD;
                await userDoc.save();
                
                let portfolioItem = await Portfolio.findOne({ user: req.user.id, sym });
                if (portfolioItem) {
                  const totalOldCost = portfolioItem.avgPrice * portfolioItem.quantity;
                  portfolioItem.quantity += qty;
                  portfolioItem.avgPrice = (totalOldCost + totalCostUSD) / portfolioItem.quantity;
                  await portfolioItem.save();
                } else {
                  await Portfolio.create({
                    user: req.user.id,
                    sym,
                    name: args.name || sym,
                    quantity: qty,
                    avgPrice: price,
                  });
                }
                refreshRequired = true;
                const newBalanceDisp = userDoc.walletBalance * exchangeRate;
                const cs = currencySymbol(userCurrency);
                fnResponse = `SUCCESS! Buy order executed for ${qty} shares of ${sym} at ${getNativeCurrency(sym) === 'INR' ? '₹' : '$'}${price.toFixed(2)}. New wallet balance: ${cs}${newBalanceDisp.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`;
              }
            }
          } catch (e) {
            console.error(`❌ [AI BUY ERROR] ${e.message}`);
            fnResponse = `Failed to execute buy order: ${e.message}`;
          }
        } else if (functionName === 'sell_stock') {
          try {
            let sym = args.symbol.toUpperCase();
            if (!sym.includes('.') && sym.length >= 4 && sym.length <= 9 && !['BTC', 'ETH', 'SOL'].includes(sym)) {
              sym += '.NS';
            }

            const portfolioItem = await Portfolio.findOne({ user: req.user.id, sym });
            
            if (!portfolioItem) {
              fnResponse = `Transaction failed: You do not own any shares of ${sym}.`;
            } else {
              let qty = Number(args.quantity);
              if (qty <= 0 || isNaN(qty)) qty = portfolioItem.quantity; // Sell ALL if invalid/all
              
              if (portfolioItem.quantity < qty) {
                fnResponse = `Transaction failed: You only have ${portfolioItem.quantity} shares of ${sym}, cannot sell ${qty}.`;
              } else {
                const quote = await yahooFinance.quote(sym, {}, { validateResult: false, validateOptions: false });
                const price = quote.regularMarketPrice || portfolioItem.avgPrice;
                if (!price) {
                   fnResponse = `Transaction failed: Could not fetch a price for ${sym}.`;
                } else {
                  const totalRevenueUSD = price * qty;
                  const userDoc = await User.findById(req.user.id);
                  userDoc.walletBalance += totalRevenueUSD;
                  await userDoc.save();
                  
                  portfolioItem.quantity -= qty;
                  if (portfolioItem.quantity === 0) {
                    await Portfolio.deleteOne({ _id: portfolioItem._id });
                  } else {
                    await portfolioItem.save();
                  }
                  refreshRequired = true;
                  const newBalanceDisp = userDoc.walletBalance * exchangeRate;
                  const cs = currencySymbol(userCurrency);
                  fnResponse = `SUCCESS! Sell order executed for ${qty} shares of ${sym} at ${getNativeCurrency(sym) === 'INR' ? '₹' : '$'}${price.toFixed(2)}. New wallet balance: ${cs}${newBalanceDisp.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`;
                }
              }
            }
          } catch (e) {
            console.error(`❌ [AI SELL ERROR] ${e.message}`);
            fnResponse = `Failed to execute sell order: ${e.message}`;
          }
        } else if (functionName === 'search_stocks') {
          try {
            const results = await yahooFinance.search(args.query, {}, { validateResult: false, validateOptions: false });
            fnResponse = JSON.stringify((results.quotes || []).map(r => ({
              symbol: r.symbol,
              name: r.shortname || r.longname || r.symbol,
              exch: r.exchange
            })).slice(0, 5));
          } catch (e) {
             fnResponse = `Search failed: ${e.message}`;
          }
        } else {
          // Safety catch for unknown tools
          fnResponse = `I attempted an action (${functionName}) that isn't fully configured. My apologies! 😅`;
        }
        } // Closing the 'if (fnResponse === "")' block

        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: fnResponse
        });
      }

      let secondResponse;
      try {
        secondResponse = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages,
          max_tokens: 256
        });
      } catch (e) {
        console.error('❌ [GROQ SECOND CALL ERROR]:', e);
        throw e; // Bubble up to main catch
      }

      const cleanReply = cleanAIResponse(secondResponse.choices[0].message.content) || "Trade executed! Check your portfolio for updates. 🚀";
  
      console.log(`✅ [AI REPLY] ${cleanReply.substring(0, 50)}... (Refresh: ${refreshRequired})`);
      return res.json({ reply: cleanReply, refreshRequired });
    }

      const finalReply = cleanAIResponse(responseMessage.content) || "I've updated the terminal for you! 🚀";
  
      return res.json({ 
        reply: finalReply,
        refreshRequired 
      });

  } catch (error) {
    console.error('❌ [GROQ CHAT CRITICAL ERROR]:', error);
    if (error.response?.data) {
        console.error('API Response Error Details:', JSON.stringify(error.response.data, null, 2));
    }
    res.status(500).json({ 
      error: 'Failed to generate response', 
      details: error.message,
      reply: "I'm temporarily disconnected from the terminal. 🔌 Let's try again in a moment!"
    });
  }
});

export default router;
