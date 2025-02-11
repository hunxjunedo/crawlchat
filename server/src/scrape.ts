import * as cheerio from "cheerio";
import TurndownService from "turndown";
import fs from "fs/promises";
import { OrderedSet } from "./ordered-set";

export type ScrapeStore = {
  urls: Record<string, { markdown: string } | undefined | null>;
  urlSet: OrderedSet<string>;
};

export async function scrape(url: string) {
  console.log("Scraping", url);
  const response = await fetch(url);
  const html = await response.text();

  const $ = cheerio.load(html);

  const links = $("a")
    .map((_, link) => ({
      text: $(link).text().trim(),
      href: $(link).attr("href"),
    }))
    .toArray()
    .filter((link) => link.href);

  $("script").remove();
  $("style").remove();
  $("nav").remove();
  $("footer").remove();

  const turndownService = new TurndownService();
  turndownService.addRule("headings", {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    replacement: function (content, node) {
      const level = Number(node.nodeName.charAt(1));
      return "\n" + "#".repeat(level) + " " + content + "\n\n";
    },
  });

  const markdown = turndownService.turndown($("body").html()!);

  return {
    markdown,
    links,
  };
}

export async function scrapeWithLinks(
  url: string,
  store: ScrapeStore,
  baseUrl: string,
  options?: {
    skipRegex?: RegExp[];
    onPreScrape?: (url: string) => Promise<void>;
  }
) {
  if (options?.onPreScrape) {
    options.onPreScrape(url);
  }
  const { markdown: linkMarkdown, links: linkLinks } = await scrape(url);
  store.urls[url] = {
    markdown: linkMarkdown,
  };
  for (const link of linkLinks) {
    if (!link.href) continue;

    const linkUrl = new URL(link.href, url);

    if (baseUrl !== linkUrl.origin) continue;

    let linkUrlStr = linkUrl.toString();
    linkUrlStr = linkUrlStr.split("#")[0];

    if (options?.skipRegex?.some((regex) => regex.test(linkUrlStr))) {
      console.log("Skipping", linkUrlStr);
      continue;
    }

    store.urlSet.add(linkUrlStr);
  }
}

export function urlsNotFetched(store: ScrapeStore) {
  return store.urlSet.values().filter((url) => store.urls[url] === undefined);
}

export async function scrapeLoop(
  store: ScrapeStore,
  baseUrl: string,
  options?: {
    limit?: number;
    skipRegex?: RegExp[];
    onPreScrape?: (url: string) => Promise<void>;
    onComplete?: () => Promise<void>;
  }
) {
  const { limit = 10000 } = options ?? {};

  while (urlsNotFetched(store).length > 0) {
    await scrapeWithLinks(urlsNotFetched(store)[0], store, baseUrl, options);

    if (Object.keys(store.urls).length > limit) {
      console.log("Reached limit", limit);
      break;
    }
  }

  if (options?.onComplete) {
    options.onComplete();
  }
}

export async function saveStore(baseUrl: string, store: ScrapeStore) {
  const urlObj = new URL(baseUrl);
  const dirPath = `./data/${urlObj.hostname}`;
  await fs.mkdir(dirPath, { recursive: true });

  for (let i = 0; i < store.urlSet.size(); i++) {
    const url = store.urlSet.get(i);
    const markdown = store.urls[url!]?.markdown;
    await fs.writeFile(`${dirPath}/${i}.md`, markdown ?? "");
  }

  await fs.writeFile(
    `${dirPath}/store.json`,
    JSON.stringify({
      urlSet: store.urlSet.values(),
    })
  );
}

export async function loadStore(baseUrl: string): Promise<ScrapeStore> {
  const urlObj = new URL(baseUrl);

  const storeText = await fs.readFile(
    `./data/${urlObj.hostname}/store.json`,
    "utf-8"
  );
  const storeJson = JSON.parse(storeText);
  const store: ScrapeStore = { urlSet: new OrderedSet(), urls: {} };
  store.urlSet.fill(storeJson.urlSet);

  for (let i = 0; i < store.urlSet.size(); i++) {
    const url = store.urlSet.get(i);
    const markdown = await fs.readFile(
      `./data/${urlObj.hostname}/${i}.md`,
      "utf-8"
    );
    store.urls[url!] = { markdown };
  }
  return store;
}
