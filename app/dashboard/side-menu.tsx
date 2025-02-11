import {
  Group,
  Heading,
  IconButton,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  TbChevronRight,
  TbForms,
  TbHome,
  TbLogout,
  TbRobotFace,
} from "react-icons/tb";
import { Link, NavLink } from "react-router";
import { Avatar } from "~/components/ui/avatar";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "~/components/ui/menu";
import { RiChatVoiceAiFill } from "react-icons/ri";
import type { User } from "@prisma/client";
import { useRef } from "react";

const links = [
  { label: "Home", to: "/dashboard/home", icon: <TbHome /> },
  { label: "Buddies", to: "/dashboard/buddies", icon: <TbRobotFace /> },
  { label: "Submissions", to: "/dashboard/submissions", icon: <TbForms /> },
];

export function SideMenu({
  fixed,
  width,
  user,
  contentRef,
}: {
  fixed: boolean;
  width: number;
  user: User;
  contentRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Stack
      h="100dvh"
      w={fixed ? [0, 0, width] : "full"}
      borderRight="1px solid"
      borderColor="brand.outline"
      bg="brand.gray"
      gap={0}
      justify="space-between"
      position={fixed ? "fixed" : undefined}
      left={0}
      top={0}
      overflow="hidden"
    >
      <Stack py={4} gap={4}>
        <Stack px={6}>
          <Heading
            display="flex"
            alignItems="center"
            gap={2}
            color="brand.fg"
            asChild
          >
            <Link to="/dashboard/home">
              <RiChatVoiceAiFill />
              VocalForm
            </Link>
          </Heading>
        </Stack>

        <Stack gap={1} w="full" px={3}>
          {links.map((link, index) => (
            <NavLink to={link.to} key={index}>
              {({ isPending, isActive }) => (
                <Group
                  px={3}
                  py={2}
                  w="full"
                  bg={isActive ? "brand.fg" : undefined}
                  color={isActive ? "brand.contrast" : undefined}
                  borderRadius={"md"}
                  transition={"all 100ms ease"}
                  _hover={{ bg: !isActive ? "brand.gray.100" : undefined }}
                >
                  {link.icon}
                  <Text>{link.label}</Text>
                  {isPending && <Spinner size="xs" />}
                </Group>
              )}
            </NavLink>
          ))}
        </Stack>
      </Stack>

      <Stack p={4}>
        <Group
          rounded="md"
          transition={"all 100ms ease"}
          justify="space-between"
        >
          <Group flex={1} maxW="80%">
            <Avatar name={user.email} size={"sm"} />
            <Text truncate>{user.email}</Text>
          </Group>

          <MenuRoot positioning={{ placement: "right-end" }}>
            <MenuTrigger asChild>
              <IconButton size="xs" variant={"ghost"} colorPalette={"brand"}>
                <TbChevronRight />
              </IconButton>
            </MenuTrigger>
            <MenuContent portalRef={contentRef as React.RefObject<HTMLElement>}>
              {/* <MenuItem value="billing" asChild>
                    <Link to="/dashboard/billing">
                      <TbCreditCard />
                      Billing
                    </Link>
                  </MenuItem> */}
              <MenuItem value="logout" asChild>
                <Link to="/dashboard/logout">
                  <TbLogout />
                  Logout
                </Link>
              </MenuItem>
            </MenuContent>
          </MenuRoot>
        </Group>
      </Stack>
    </Stack>
  );
}
