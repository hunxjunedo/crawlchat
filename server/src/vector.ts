import fs from "fs/promises";
import type { ScrapeStore } from "./scrape";
import { pipeline } from "@huggingface/transformers";
import faiss from "faiss-node";

export type LinkResult = {
  url: string;
  index: number;
  content: string;
};

const remoteCache: Record<
  string,
  {
    index: faiss.IndexFlatL2;
    links: { urlSet: string[]; urls: Record<string, { markdown?: string }> };
  }
> = {};

export async function extractMarkdownText(content: string): Promise<string> {
  const { remark } = await import("remark");
  const { default: strip } = await import("strip-markdown");
  const processedContent = await remark().use(strip).process(content);
  return processedContent.toString();
}

export async function generateEmbeddings(
  texts: string[]
): Promise<Float32Array[]> {
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  return Promise.all(
    texts.map(async (text) => {
      const output = await embedder(text, { pooling: "mean", normalize: true });
      return new Float32Array(output.data);
    })
  );
}

export async function storeEmbeddingsInFAISS(
  baseUrl: string,
  store: ScrapeStore
) {
  const texts = [];
  for (const url of store.urlSet.values()) {
    texts.push(store.urls[url!]?.markdown ?? "");
  }
  const embeddings = await generateEmbeddings(texts);
  const dimension = embeddings[0].length;

  // Create FAISS index
  const index = new faiss.IndexFlatL2(dimension);
  // Convert Float32Array[] to number[] for FAISS
  const embeddingsArray = embeddings.flatMap((arr) => Array.from(arr));
  index.add(embeddingsArray);

  // Save index
  const urlObj = new URL(baseUrl);
  const dirPath = `./data/${urlObj.hostname}`;
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(`${dirPath}/faiss.index`, index.toBuffer());
  await fs.writeFile(
    `${dirPath}/faiss.links`,
    JSON.stringify({ urls: store.urls, urlSet: store.urlSet.values() })
  );
  console.log("FAISS index created & saved.");
}

export async function searchFAISS(
  baseUrl: string,
  query: string,
  topK: number = 10
) {
  const urlObj = new URL(baseUrl);
  const dirPath = `./data/${urlObj.hostname}`;
  const index = await faiss.IndexFlatL2.fromBuffer(
    await fs.readFile(`${dirPath}/faiss.index`)
  );
  const queryEmbedding = await generateEmbeddings([query]);
  const queryArray = Array.from(queryEmbedding[0]);
  const result = index.search(queryArray, topK);
  return result.labels;
}

const getRemote = async (baseUrl: string) => {
  if (!remoteCache[baseUrl]?.index) {
    const res = await fetch(`${baseUrl}/faiss.index`);
    if (!res.ok) {
      return null;
    }

    const index = await faiss.IndexFlatL2.fromBuffer(
      Buffer.from(await res.arrayBuffer())
    );

    const linksRes = await fetch(`${baseUrl}/faiss.links`);
    if (!res.ok) {
      return null;
    }
    const links = JSON.parse(await linksRes.text());

    remoteCache[baseUrl] = { index, links };
  }
  return remoteCache[baseUrl];
};

export async function searchFAISSRemote(
  baseUrl: string,
  query: string,
  topK: number = 10
) {
  const remote = await getRemote(baseUrl);
  if (!remote) {
    return null;
  }
  const { index } = remote;

  const queryEmbedding = await generateEmbeddings([query]);
  const queryArray = Array.from(queryEmbedding[0]);
  return index.search(queryArray, topK);
}

export async function getFAISSLinks(
  baseUrl: string,
  result: faiss.SearchResult
): Promise<LinkResult[]> {
  const remote = await getRemote(baseUrl);
  if (!remote) {
    return [];
  }
  const { links } = remote;
  return result.labels.map((label) => ({
    url: links.urlSet[label],
    index: label,
    content: links.urls[links.urlSet[label]]?.markdown ?? "",
  }));
}
