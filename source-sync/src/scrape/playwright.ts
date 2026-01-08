import { chromium, Browser, BrowserContext, Page } from "playwright";

let browser: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;
let cleanupTimeout: NodeJS.Timeout | null = null;

const IDLE_TIMEOUT_MS = 30000;

async function getBrowser(): Promise<Browser> {
  if (browser) {
    return browser;
  }

  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
    }).then((b) => {
      browser = b;
      browser.on("disconnected", () => {
        browser = null;
        browserPromise = null;
        cancelCleanup();
      });
      return b;
    });
  }

  return browserPromise;
}

function scheduleCleanup() {
  cancelCleanup();
  
  cleanupTimeout = setTimeout(async () => {
    if (!browser) {
      return;
    }

    if (browser.contexts().length === 0) {
      console.log("No active contexts, closing browser to save CPU");
      await browser.close();
      browser = null;
      browserPromise = null;
      cleanupTimeout = null;
    }
  }, IDLE_TIMEOUT_MS);
}

function cancelCleanup() {
  if (cleanupTimeout) {
    clearTimeout(cleanupTimeout);
    cleanupTimeout = null;
  }
}

async function getPage(): Promise<{ page: Page; context: BrowserContext }> {
  const browserInstance = await getBrowser();
  const context = await browserInstance.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  context.on("close", () => {
    scheduleCleanup();
  });
  
  cancelCleanup();
  const page = await context.newPage();
  return { page, context };
}

export async function scrapePw(
  url: string,
  options?: { scrollSelector?: string; maxWait?: number }
) {
  const { page, context } = await getPage();
  console.log("Playwright scraping", url);
  
  const response = await page.goto(url);

  if (options?.maxWait) {
    await page.waitForTimeout(options.maxWait);
  } else {
    await page.waitForLoadState("networkidle");
  }

  await page.waitForTimeout(5000);

  const scrollSelector = options?.scrollSelector;

  let previousHeight = 0;
  for (let i = 0; i < 10; i++) {
    console.log(`Scroll iteration ${i + 1}/10`);

    if (!scrollSelector) {
      break;
    }

    const currentHeight = await page.evaluate(
      (selector) => document.querySelector(selector)?.scrollHeight ?? 0,
      scrollSelector
    );

    if (i > 0 && currentHeight === previousHeight) {
      console.log("No new content loaded, stopping scroll");
      break;
    }

    previousHeight = currentHeight;
    await page.evaluate((selector) => {
      const scrollElement = document.querySelector(selector);
      if (!scrollElement) {
        return;
      }
      scrollElement.scrollTo(0, scrollElement.scrollHeight);
    }, scrollSelector);

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  }

  const html = await page.content();
  await page.close();
  await context.close();
  
  if (browser && browser.contexts().length === 0) {
    scheduleCleanup();
  }
  
  return { text: html, statusCode: response?.status() ?? -1 };
}

process.on("SIGTERM", async () => {
  cancelCleanup();
  if (browser) {
    await browser.close();
    browser = null;
    browserPromise = null;
  }
});

process.on("SIGINT", async () => {
  cancelCleanup();
  if (browser) {
    await browser.close();
    browser = null;
    browserPromise = null;
  }
});
