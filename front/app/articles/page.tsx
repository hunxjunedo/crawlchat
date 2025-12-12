import { TbBook2, TbCheck } from "react-icons/tb";
import { getAuthUser } from "~/auth/middleware";
import { Page } from "~/components/page";
import { prisma } from "~/prisma";
import { authoriseScrapeUser, getSessionScrapeId } from "~/scrapes/util";
import type { Route } from "./+types/page";
import { ComposerSection, useComposer } from "~/compose";
import { useFetcher } from "react-router";
import { redirect } from "react-router";
import { makeMeta } from "~/meta";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await getAuthUser(request);
  const scrapeId = await getSessionScrapeId(request);
  authoriseScrapeUser(user!.scrapeUsers, scrapeId);

  const article = await prisma.article.findFirstOrThrow({
    where: {
      id: params.id,
      scrapeId,
    },
  });

  return { article };
}

export function meta() {
  return makeMeta({
    title: "Article - CrawlChat",
  });
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await getAuthUser(request);
  const scrapeId = await getSessionScrapeId(request);
  authoriseScrapeUser(user!.scrapeUsers, scrapeId);

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save") {
    const content = formData.get("content") as string;
    const title = formData.get("title") as string;

    await prisma.article.update({
      where: {
        id: params.id,
      },
      data: {
        title: title || undefined,
        content: content,
      },
    });

    throw redirect(`/article/${params.id}`);
  }
}

export default function Article({ loaderData }: Route.ComponentProps) {
  const composer = useComposer({
    scrapeId: loaderData.article.scrapeId,
    init: {
      format: "markdown",
      state: {
        slate: loaderData.article.content,
        messages: [],
        title: loaderData.article.title ?? undefined,
      },
    },
    stateLess: true,
  });

  const saveFetcher = useFetcher();

  return (
    <Page
      title={loaderData.article.title || "Article"}
      icon={<TbBook2 />}
      right={
        <saveFetcher.Form method="post">
          <input type="hidden" name="intent" value="save" />
          <input type="hidden" name="content" value={composer.state.slate} />
          <input
            type="hidden"
            name="title"
            value={composer.state.title ?? ""}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saveFetcher.state !== "idle"}
          >
            {saveFetcher.state !== "idle" && (
              <span className="loading loading-spinner loading-xs" />
            )}
            Save
            <TbCheck />
          </button>
        </saveFetcher.Form>
      }
    >
      <ComposerSection composer={composer} />
    </Page>
  );
}
