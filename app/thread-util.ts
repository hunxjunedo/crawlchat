import type { ScrapeLink, Thread } from "@prisma/client";

export function getThreadName(thread: Thread, maxLength = 18) {
  const title =
    (thread.messages[0]?.llmMessage as { content: string })?.content ??
    "Untitled";
  if (title.length > maxLength) {
    return title.slice(0, maxLength) + "...";
  }
  return title;
}

export function getLinkTitle(link: ScrapeLink) {
  const title = link.metaTags?.find((tag) => tag.key.match(/.*:title/))?.value;
  if (title) {
    return title;
  }
  return link.url;
}
