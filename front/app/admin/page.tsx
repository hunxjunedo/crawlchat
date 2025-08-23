import { getAuthUser } from "~/auth/middleware";
import type { Route } from "./+types/page";
import { redirect } from "react-router";
import { prisma } from "libs/prisma";
import type {
  User,
  KnowledgeGroup,
  Scrape,
  Message,
  Thread,
} from "libs/prisma";
import { Heading, Popover, Portal, Stack, Table, Text } from "@chakra-ui/react";
import { SingleLineCell } from "~/components/single-line-cell";
import { MarkdownProse } from "~/widget/markdown-prose";

type UserDetail = {
  user: User;
  scrapes: Scrape[];
  groups: KnowledgeGroup[];
};

type MessageDetail = {
  message: Message;
  user: User;
  scrape: Scrape;
  thread: Thread;
};

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getAuthUser(request);

  if (user?.email !== "pramodkumar.damam73@gmail.com") {
    throw redirect("/app");
  }

  const lastUsers = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  const userDetails: UserDetail[] = await Promise.all(
    lastUsers.map(async (user) => {
      const scrapes = await prisma.scrape.findMany({
        where: {
          userId: user.id,
        },
      });

      const groups = await prisma.knowledgeGroup.findMany({
        where: {
          userId: user.id,
        },
      });

      return {
        user,
        scrapes,
        groups,
      };
    })
  );

  const lastMessages = await prisma.message.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      thread: true,
    },
    take: 100,
  });

  const messageDetails: MessageDetail[] = await Promise.all(
    lastMessages.map(async (message) => {
      const user = await prisma.user.findFirstOrThrow({
        where: {
          id: message.ownerUserId,
        },
      });

      const scrape = await prisma.scrape.findFirstOrThrow({
        where: {
          id: message.scrapeId,
        },
      })!;

      return {
        message,
        user,
        scrape,
        thread: message.thread,
      };
    })
  );

  return {
    userDetails,
    messageDetails,
  };
}

function UsersTable({ userDetails }: { userDetails: UserDetail[] }) {
  return (
    <Table.Root size="sm">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Id</Table.ColumnHeader>
          <Table.ColumnHeader>Email</Table.ColumnHeader>
          <Table.ColumnHeader>Name</Table.ColumnHeader>
          <Table.ColumnHeader>Scrapes</Table.ColumnHeader>
          <Table.ColumnHeader>Groups</Table.ColumnHeader>
          <Table.ColumnHeader>Scrape credits</Table.ColumnHeader>
          <Table.ColumnHeader>Message credits</Table.ColumnHeader>
          <Table.ColumnHeader>Created At</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {userDetails.map((userDetail) => (
          <Table.Row key={userDetail.user.id}>
            <Table.Cell>{userDetail.user.id}</Table.Cell>
            <Table.Cell>{userDetail.user.email}</Table.Cell>
            <Table.Cell>{userDetail.user.name}</Table.Cell>
            <Table.Cell>{userDetail.scrapes.length}</Table.Cell>
            <Table.Cell>{userDetail.groups.length}</Table.Cell>
            <Table.Cell>{userDetail.user.plan?.credits?.scrapes}</Table.Cell>
            <Table.Cell>{userDetail.user.plan?.credits?.messages}</Table.Cell>
            <Table.Cell>
              {userDetail.user.createdAt.toLocaleString()}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

function Score({ message }: { message: Message }) {
  if (message.links.length === 0) return null;
  const min = Math.min(...message.links.map((l) => l.score ?? 0)).toFixed(2);
  const max = Math.max(...message.links.map((l) => l.score ?? 0)).toFixed(2);
  const avg = (
    message.links.reduce((acc, l) => acc + (l.score ?? 0), 0) /
    message.links.length
  ).toFixed(2);
  return `[${min}, ${avg}, ${max}]`;
}

function WithPopover({
  title,
  popoverContent,
  children,
}: {
  title?: string;
  popoverContent: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Text>{children}</Text>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Arrow />
            <Popover.Body>
              {title && (
                <Popover.Title fontWeight="medium">{title}</Popover.Title>
              )}
              {popoverContent}
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

function MessagesTable({
  messageDetails,
}: {
  messageDetails: MessageDetail[];
}) {
  return (
    <Table.Root size="sm">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Message</Table.ColumnHeader>
          <Table.ColumnHeader>Scrape</Table.ColumnHeader>
          <Table.ColumnHeader>User</Table.ColumnHeader>
          <Table.ColumnHeader>Score</Table.ColumnHeader>
          <Table.ColumnHeader>Channel</Table.ColumnHeader>
          <Table.ColumnHeader>Data gap</Table.ColumnHeader>
          <Table.ColumnHeader>Created At</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {messageDetails.map((messageDetail) => (
          <Table.Row key={messageDetail.message.id}>
            <Table.Cell>
              <SingleLineCell>
                {(messageDetail.message.llmMessage as any).content}
              </SingleLineCell>
            </Table.Cell>
            <Table.Cell>{messageDetail.scrape.title}</Table.Cell>
            <Table.Cell>{messageDetail.user.email}</Table.Cell>
            <Table.Cell>
              <Score message={messageDetail.message} />
            </Table.Cell>
            <Table.Cell>
              {messageDetail.message.channel ?? "chatbot"}
            </Table.Cell>
            <Table.Cell>
              {messageDetail.message.analysis?.dataGapTitle && (
                <WithPopover
                  title={messageDetail.message.analysis.dataGapTitle}
                  popoverContent={
                    <MarkdownProse>
                      {messageDetail.message.analysis.dataGapDescription}
                    </MarkdownProse>
                  }
                >
                  yes
                </WithPopover>
              )}
            </Table.Cell>
            <Table.Cell>
              {messageDetail.message.createdAt.toLocaleString()}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  return (
    <Stack p={4}>
      <Heading>Users</Heading>
      <UsersTable userDetails={loaderData.userDetails} />
      <Heading mt={4}>Messages</Heading>
      <MessagesTable messageDetails={loaderData.messageDetails} />
    </Stack>
  );
}
