import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getLinks, searchInIndex } from "./vector";
import faiss from "faiss-node";
import type { ScrapeStore } from "./scrape/crawl";
import type { Message } from "@prisma/client";

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
        content: prompt,
      },
    ],
    max_tokens: 20,
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}

export async function makeContext(
  query: string,
  index: faiss.IndexFlatL2,
  store: ScrapeStore
) {
  const result = await searchInIndex(
    query,
    index,
    Math.min(10, store.urlSet.size())
  );
  if (result) {
    const links = await getLinks(store, result);
    const content = links.map((link) => link.content).join("\n\n");
    return { content, links };
  }
}

export async function askLLM(
  query: string,
  messages: Message[],
  options?: {
    url?: string;
    context?: string;
  }
) {
  return await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      ...messages.map((message) => message.llmMessage as any),
      {
        role: "user",
        content: `${query}\n\nContext:\n${options?.context ?? ""}`,
      },
    ],
    stream: true,
  });
}
