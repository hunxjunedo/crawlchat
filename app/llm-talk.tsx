import {
  Center,
  Group,
  Heading,
  Input,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  TbAlertCircle,
  TbCheck,
  TbCircleCheckFilled,
  TbSearch,
} from "react-icons/tb";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/llm-talk";
import { Alert } from "~/components/ui/alert";
import type { LinkResult } from "server/src/vector";
import { getLLMResponse } from "server/src/llm";
import Markdown from "react-markdown";
import { Prose } from "~/components/ui/prose";

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

async function doesUrlContainLLM(url: string) {
  try {
    if (!isValidUrl(url)) {
      return false;
    }
    const res = await fetch(`${url}/faiss.index`);
    if (!res.ok) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

function mockUrl(url: string) {
  if (url === "https://www.motionshot.app") {
    return "https://slickwid-public.s3.us-east-1.amazonaws.com/faiss/motionshot";
  }
  if (url === "https://remotion.dev") {
    return "https://slickwid-public.s3.us-east-1.amazonaws.com/faiss/remotion";
  }
  if (url === "https://justcms.co") {
    return "https://slickwid-public.s3.us-east-1.amazonaws.com/faiss/justcms";
  }
  if (url === "https://youform.com") {
    return "https://slickwid-public.s3.us-east-1.amazonaws.com/faiss/youform";
  }
  if (url === "https://reactrouter.com") {
    return "https://slickwid-public.s3.us-east-1.amazonaws.com/faiss/reactrouter";
  }
  return url;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const url = formData.get("url") as string;

  switch (formData.get("type")) {
    case "proceed":
      if (await doesUrlContainLLM(mockUrl(url))) {
        return Response.json({ url });
      }
      return Response.json(
        { error: "Does not contain LLM file!" },
        { status: 400 }
      );
    case "search":
      // const optimizedQuery = await generateSearchQuery(
      //   formData.get("query") as string
      // );
      const optimizedQuery = formData.get("query") as string;
      if (!optimizedQuery) {
        return Response.json(
          { error: "No optimized query found" },
          { status: 400 }
        );
      }
      const result = await getLLMResponse(mockUrl(url), optimizedQuery);
      if (!result) {
        return Response.json({ error: "No result found" }, { status: 400 });
      }
      return Response.json(result);
  }
}

export default function LLMTalk() {
  const fetcher = useFetcher();
  const searchFetcher = useFetcher();

  function handleProceed() {
    fetcher.submit(null, { method: "post" });
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    searchFetcher.submit(e.currentTarget, { method: "get" });
  }

  return (
    <Center p={8}>
      {!fetcher.data?.url && (
        <fetcher.Form method="post" onSubmit={handleProceed}>
          <input type="hidden" name="type" value="proceed" />
          <Stack w={"500px"}>
            <Group>
              <Input name="url" placeholder="https://example.com" />
              <Button type="submit" loading={fetcher.state !== "idle"}>
                Proceed
                <TbCheck />
              </Button>
            </Group>
            {fetcher.data?.error && (
              <Alert title="Error" status="error" icon={<TbAlertCircle />}>
                {fetcher.data.error}
              </Alert>
            )}
          </Stack>
        </fetcher.Form>
      )}
      {fetcher.data?.url && (
        <Stack w={"500px"}>
          <Heading>
            <Group>
              <Text>{fetcher.data.url}</Text>
              <Text color={"green"}>
                <TbCircleCheckFilled />
              </Text>
            </Group>
          </Heading>
          <searchFetcher.Form method="post" onSubmit={handleSearch}>
            <Stack>
              <input type="hidden" name="type" value="search" />
              <input type="hidden" name="url" value={fetcher.data.url} />
              <Stack w={"500px"}>
                <Group>
                  <Input name="query" placeholder="Ex: pricing" />
                  <Button
                    type="submit"
                    loading={searchFetcher.state !== "idle"}
                  >
                    Search
                    <TbSearch />
                  </Button>
                </Group>
              </Stack>

              {searchFetcher.data?.llmResponse && (
                <Stack>
                  <Prose mx={"auto"}>
                    <Markdown>{searchFetcher.data.llmResponse}</Markdown>
                  </Prose>
                </Stack>
              )}

              {searchFetcher.data?.links && (
                <Stack>
                  {searchFetcher.data.links.map((link: LinkResult) => (
                    <Stack key={link.url} bg={"brand.gray.100"} p={4}>
                      <Link
                        href={link.url}
                        target="_blank"
                        colorPalette={"brand"}
                        lineClamp={2}
                      >
                        [{link.index}] {link.url}
                      </Link>
                      <Text lineClamp={3} fontSize={"xs"}>
                        {link.content}
                      </Text>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </searchFetcher.Form>
        </Stack>
      )}
    </Center>
  );
}
