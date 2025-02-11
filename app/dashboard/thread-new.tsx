import { getAuthUser } from "~/auth/middleware";
import type { Route } from "./+types/thread-new";
import { prisma } from "~/prisma";
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getAuthUser(request);
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get("id");

  if (id) {
    const scrape = await prisma.scrape.findUnique({
      where: { id },
    });
    if (!scrape) {
      throw redirect("/app");
    }
    const thread = await prisma.thread.create({
      data: {
        scrapeId: scrape.id,
        userId: user!.id,
      },
    });
    return redirect(`/threads/${thread.id}`);
  }
}

export default function ThreadNew() {
  return <div>ThreadNew</div>;
}
