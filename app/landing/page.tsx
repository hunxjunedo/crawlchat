import { Box, Flex, Group, Input, Stack, Text } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useState } from "react";
import type { Route } from "./+types/page";
import { TbCheck, TbCircleCheckFilled } from "react-icons/tb";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";

export async function loader() {
  return {
    serverHost: process.env.SERVER_WS_URL,
  };
}

export function meta() {
  return [
    {
      title: "LLM Ready",
      description: "Make your website ready for LLMs",
    },
  ];
}

function makeMessage(type: string, data: any) {
  return JSON.stringify({ type, data });
}

export async function clientAction({ request }: { request: Request }) {
  const formData = await request.formData();
  const url = formData.get("url");

  const response = await fetch("http://localhost:3000/scrape", {
    method: "POST",
    body: JSON.stringify({ url }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  return { response };
}

export default function LandingPage({ loaderData }: Route.ComponentProps) {
  const socket = useRef<WebSocket>(null);
  const [scrapingUrl, setScrapingUrl] = useState<string>();
  const [stage, setStage] = useState<"idle" | "scraping" | "scraped" | "saved">(
    "idle"
  );
  const scrapeFetcher = useFetcher();

  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:3000");
    socket.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "scrape-pre") {
        setScrapingUrl(message.data.url);
        setStage("scraping");
      } else if (message.type === "scrape-complete") {
        setStage("scraped");
      } else if (message.type === "saved") {
        setStage("saved");
      }
    };
  }, []);

  const loading =
    scrapeFetcher.state !== "idle" || ["scraping", "scraped"].includes(stage);

  return (
    <Stack alignItems={"center"} justifyContent={"center"} height={"100dvh"}>
      <Stack w={"400px"}>
        <scrapeFetcher.Form method="post">
          <Group w="full">
            <Input
              placeholder="https://example.com"
              flex={1}
              name="url"
              disabled={loading}
            />
            <Button type="submit" loading={loading}>
              Scrape
              <TbCheck />
            </Button>
          </Group>
        </scrapeFetcher.Form>

        <Stack fontSize={"sm"}>
          {stage === "scraping" && <Text truncate>Scraping {scrapingUrl}</Text>}
          {scrapingUrl && stage === "scraped" && <Text>Scraping complete</Text>}
          {scrapingUrl && stage === "saved" && (
            <Group gap={1}>
              <Text>Done</Text>
              <Text color={"brand.fg"}>
                <TbCircleCheckFilled />
              </Text>
            </Group>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
