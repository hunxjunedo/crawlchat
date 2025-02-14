import { Center, Text } from "@chakra-ui/react";
import type { Route } from "./+types/login";
import { getAuthUser } from "./middleware";
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getAuthUser(request, { dontRedirect: true });

  if (user) {
    throw redirect("/app");
  }

  return {};
}

export default async function EmailSent() {
  return (
    <Center h="100vh" w="100vw">
      <Text>Email Sent</Text>
    </Center>
  );
}
