import { Box, Group, IconButton, Stack } from "@chakra-ui/react";
import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { AppContext, useApp } from "./context";
import { getAuthUser } from "~/auth/middleware";
import { Toaster } from "~/components/ui/toaster";
import { SideMenu } from "./side-menu";
import {
  DrawerBackdrop,
  DrawerContent,
  DrawerRoot,
} from "~/components/ui/drawer";
import { useRef, useState } from "react";
import { TbMenu } from "react-icons/tb";

export function meta() {
  return [
    {
      title: "VocalForm",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getAuthUser(request, { redirectTo: "/login" });

  return { user: user! };
}

const drawerWidth = 260;

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const app = useApp(user);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <AppContext.Provider value={app}>
      <Group align="start" gap={0} w="full">
        <SideMenu width={drawerWidth} user={user} fixed={true} />

        <DrawerRoot
          open={app.menuOpen}
          size={"xs"}
          placement={"start"}
          onOpenChange={(e) => !e.open && app.setMenuOpen(false)}
        >
          <DrawerBackdrop />
          <DrawerContent ref={contentRef}>
            <SideMenu
              width={drawerWidth}
              user={user}
              fixed={false}
              contentRef={contentRef}
            />
          </DrawerContent>
        </DrawerRoot>

        <Stack flex={1} alignSelf={"stretch"} ml={[0, 0, drawerWidth]}>
          <Outlet />
        </Stack>
      </Group>
      <Toaster />
    </AppContext.Provider>
  );
}
