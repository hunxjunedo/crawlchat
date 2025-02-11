import {
  GridItem,
  Group,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useState } from "react";
import type { Route } from "./+types/page";
import {
  TbArrowRight,
  TbCheck,
  TbCircleCheckFilled,
  TbWorld,
} from "react-icons/tb";
import { Link, redirect, useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { getAuthUser } from "~/auth/middleware";
import { prisma } from "~/prisma";
import moment from "moment";
export async function loader({ request }: Route.LoaderArgs) {
  const user = await getAuthUser(request);
  const scrapes = await prisma.scrape.findMany({
    where: {
      userId: user?.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return {
    user,
    scrapes,
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

  if (response.status === 212) {
    throw redirect(`/chat?url=${url}`);
  }
}

export default function LandingPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
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
    <Stack
      alignItems={"center"}
      justifyContent={"center"}
      height={"100dvh"}
      gap={8}
    >
      <Stack w={"400px"}>
        <scrapeFetcher.Form method="post">
          <Stack>
            <Heading>Chat with any website!</Heading>
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
          </Stack>
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

      <Stack w={"400px"}>
        <SimpleGrid columns={2} gap={4}>
          {loaderData.scrapes.map((scrape) => (
            <GridItem key={scrape.id}>
              <Stack
                bg="brand.gray.100"
                p={4}
                rounded={"lg"}
                h="full"
                className="group"
              >
                <Group h={"30px"}>
                  <Text fontSize={"30px"} _groupHover={{ display: "none" }}>
                    <TbWorld />
                  </Text>
                  <Button
                    size={"xs"}
                    display={"none"}
                    _groupHover={{ display: "flex" }}
                    asChild
                  >
                    <Link to={`/threads/new?id=${scrape.id}`}>
                      Chat now
                      <TbArrowRight />
                    </Link>
                  </Button>
                </Group>

                <Text fontSize={"sm"}>{scrape.url}</Text>
                <Text fontSize={"xs"} opacity={0.5}>
                  {moment(scrape.createdAt).fromNow()}
                </Text>
              </Stack>
            </GridItem>
          ))}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
