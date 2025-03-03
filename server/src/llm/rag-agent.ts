import { z } from "zod";
import { Agent } from "./agentic";
import { multiLinePrompt } from "./agentic";
import { Indexer } from "../indexer/indexer";
import { Pinecone } from "@pinecone-database/pinecone";

export type RAGAgentCustomMessage = {
  result?: { content: string; url: string; score: number }[];
};

export class RAGAgent extends Agent<{}, RAGAgentCustomMessage> {
  private indexer: Indexer;
  private scrapeId: string;

  constructor(indexer: Indexer, scrapeId: string) {
    super();
    this.indexer = indexer;
    this.scrapeId = scrapeId;
  }

  async getSystemPrompt() {
    return multiLinePrompt([
      "You are a helpful assistant that can answer questions about the context provided.",
      "Use the search_data tool to search the vector database for the relavent information.",
      "You can run search_data tool multiple times to get more information.",
      "Don't hallucinate. You cannot add new topics to the query. It should be inside the context of the query.",
    ]);
  }

  getTools() {
    return {
      search_data: {
        description: multiLinePrompt([
          "Search the vector database for the most relevant documents.",
          "The query should be very short and should not be complex.",
          "Break the complex queries into smaller queries.",
          "Example: If the query is 'How to build a site and deploy it on Vercel?', break it into 'How to build a site' and 'Deploy it on Vercel'.",
          "Example: If the topic is about a tool called 'Remotion', turn the query 'What is it?' into 'What is Remotion?'",
          "These queries are for a vector database. Don't use extra words that do not add any value in vectorisation.",
          "Example: If the query is 'How to make a composition?', better you use 'make a composition'",
          "The query should not be more than 3 words. Keep only the most important words.",
        ]),
        schema: z.object({
          query: z.string({
            description: "The query to search the vector database with",
          }),
        }),
        execute: async ({ query }: { query: string }) => {
          console.log("Searching RAG for", query);
          const result = await this.indexer.search(this.scrapeId, query, {
            topK: 20,
          });

          const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
          const rerank = await pc.inference.rerank(
            "bge-reranker-v2-m3",
            query,
            result.matches.map((m) => ({
              id: m.id,
              text: m.metadata!.content as string,
              url: m.metadata!.url as string,
            })),
            {
              topN: 4,
              returnDocuments: true,
              parameters: {
                truncate: "END",
              },
            }
          );

          return {
            content: rerank.data.map((r) => r.document!.text).join("\n\n"),
            customMessage: {
              result: rerank.data.map((r) => ({
                content: r.document!.text,
                url: r.document!.url,
                score: r.score,
              })),
            },
          };
        },
      },
    };
  }
}

export class ContextCheckerAgent extends Agent<{}, RAGAgentCustomMessage> {
  async getSystemPrompt() {
    return multiLinePrompt([
      "You need to check if the context provided is relavent and enough to answer the above query.",
    ]);
  }

  getResponseSchema() {
    return z.object({
      enough: z.boolean(),
    });
  }
}
