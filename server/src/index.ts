import express from "express";
import type { Express, Request, Response } from "express";
import dotenv from "dotenv";
import ws from "express-ws";
import { saveStore, scrapeLoop, type ScrapeStore } from "./scrape";
import { OrderedSet } from "./ordered-set";
import { storeEmbeddingsInFAISS } from "./vector";
import cors from "cors";

dotenv.config();

const app: Express = express();
const expressWs = ws(app);
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

function makeMessage(type: string, data: any) {
  return JSON.stringify({ type, data });
}

function broadcast(message: string) {
  expressWs.getWss().clients.forEach((client) => {
    client.send(message);
  });
}

app.get("/", function (req: Request, res: Response) {
  res.json({ message: "ok" });
});

app.post("/scrape", function (req: Request, res: Response) {
  const url = req.body.url;
  const store: ScrapeStore = {
    urls: {},
    urlSet: new OrderedSet(),
  };
  store.urlSet.add(url);
  (async function () {
    await scrapeLoop(store, req.body.url, {
      onPreScrape: async (url) => {
        broadcast(makeMessage("scrape-pre", { url }));
      },
      onComplete: async () => {
        broadcast(makeMessage("scrape-complete", { url }));
      },
    });
    await saveStore(url, store);
    await storeEmbeddingsInFAISS(url, store);
    broadcast(makeMessage("saved", { url }));
  })();

  res.json({ message: "ok" });
});

expressWs.app.ws("/", function (ws, req) {
  ws.send(makeMessage("ping", "pong"));
  ws.on("message", function (msg) {
    console.log(msg);
  });
});

app.listen(port, () => {
  console.log(`Running on port ${port}`);
});
