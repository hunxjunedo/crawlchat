import OpenAI from "openai";
import { getFAISSLinks, searchFAISSRemote } from "./vector";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSearchQuery(userQuery: string) {
  const prompt = `
    The user has asked a descriptive query. Convert it into a short, optimal search query for FAISS.
    
    Example:
    User Query: "Tell me about the best practices for FAISS in retrieval-augmented generation."
    Optimized Query: "FAISS best practices RAG"

    User Query: "${userQuery}"
    Optimized Query:
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 20,
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}

export async function getLLMResponse(baseUrl: string, query: string) {
  const result = await searchFAISSRemote(baseUrl, query, 2);
  if (!result) {
    return null;
  }
  const links = await getFAISSLinks(baseUrl, result);
  const context = links.map((link) => link.content).join("\n\n");

  const prompt = `You are an AI assistant. Use the following context to answer the user's query.\n\nContext:\n${context}\n\nUser Query: ${query}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an AI assistant that helps answer questions based on provided context."
      },
      {
        role: "user", 
        content: prompt
      }
    ]
  });

  return { llmResponse: response.choices[0].message.content, links };
}
