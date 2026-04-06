import axios from 'axios';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Extracts or Generates full article content for StockPilot.
 * Fulfills the "Stay in App" requirement by using AI to reconstruct 
 * stories if scraping is blocked.
 */
export async function extractArticleContent(url, title, summary) {
  try {
    // 1. Attempt to fetch raw HTML (Best case)
    const response = await axios.get(url, {
      timeout: 6000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    const html = response.data;
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/\s+/g, ' ')
      .substring(0, 10000);

    // 2. Extract with AI
    const extraction = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert financial journalist. Extract the full news content from the provided HTML. Format it in clean Markdown. If the HTML is blocked or empty, use the provided Title and Summary to 'Write' a comprehensive 4-5 paragraph detailed report for a trading dashboard. Never include external links."
        },
        {
          role: "user",
          content: `Title: ${title}\nContext: ${summary}\nHTML Snippet: ${cleanHtml}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
    });

    return {
      success: true,
      content: extraction.choices[0]?.message?.content || summary,
      isAiReconstructed: !html
    };
  } catch (error) {
    // 3. Fallback: Generate article purely from Title/Summary (Fulfills In-App requirement when site is blocked)
    const generation = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are the StockPilot AI Investigative Journalist. I have the title and snippet of a breaking financial story. Write the ENTIRE detailed article (500+ words) based on this context. Maintain a highly professional, terminal-style tone. Include sections like 'Market Impact' and 'Technical Outlook'. Ensure 100% of the content is in-app."
        },
        {
          role: "user",
          content: `Reconstruct the full intelligence report for this story:\nTitle: ${title}\nSnippet: ${summary}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    });

    return {
      success: true,
      content: generation.choices[0]?.message?.content || summary,
      isAiReconstructed: true
    };
  }
}
