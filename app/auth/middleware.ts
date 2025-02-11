import { redirect } from "react-router";
import { prisma } from "~/prisma";
import { getSession } from "~/session";

export async function getAuthUser(
  request: Request,
  options?: { redirectTo?: string; dontRedirect?: boolean, userId?: string }
) {
  const redirectTo = options?.redirectTo ?? "/login";

  const session = await getSession(request.headers.get("cookie"));
  const user = session.get("user");

  if (!user && !options?.dontRedirect) {
    throw redirect(redirectTo);
  }

  if (options?.userId && user?.id !== options.userId) {
    throw redirect(redirectTo, {
      status: 403,
    });
  }

  return user;
}
