import { useEffect, useRef, useState } from "react";
import { Page } from "~/components/page";
import { Heading, HStack, Icon, Stack, SimpleGrid } from "@chakra-ui/react";
import type { Route } from "./+types/page";
import { getAuthUser } from "~/auth/middleware";
import { prisma } from "~/prisma";
import {
  TbCalendar,
  TbCalendarWeek,
  TbClock,
  TbForms,
  TbHome,
  TbNumbers,
  TbUpload,
} from "react-icons/tb";
import { StatLabel, StatRoot, StatValueText } from "~/components/ui/stat";
import { LineChart, Line, XAxis, Tooltip } from "recharts";
import moment from "moment";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getAuthUser(request);
  const buddies = await prisma.buddy.findMany({
    where: { userId: user!.id },
  });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const submissions = await prisma.submission.findMany({
    where: {
      userId: user!.id,
      createdAt: {
        gte: oneWeekAgo,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group submissions by day
  const submissionsByDay = submissions.reduce((acc, submission) => {
    const date = submission.createdAt.toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date]++;
    return acc;
  }, {} as Record<string, number>);

  // Fill in missing days with 0 submissions
  const chartData = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    chartData.unshift({
      date: dateStr,
      submissions: submissionsByDay[dateStr] || 0,
    });
  }

  const submissionsToday = submissions.filter(
    (submission) =>
      submission.createdAt.toISOString().split("T")[0] ===
      new Date().toISOString().split("T")[0]
  ).length;
  const submissionsTotal = await prisma.submission.count({
    where: {
      userId: user!.id,
    },
  });
  const lastSubmission = submissions[submissions.length - 1];

  return {
    buddies,
    chartData,
    submissionsToday,
    submissionsTotal,
    lastSubmission,
  };
}

function StatCard({
  title,
  icon,
  value,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <StatRoot w="full" borderWidth="1px" p="4" rounded="md">
      <HStack justify="space-between">
        <StatLabel>{title}</StatLabel>
        <Icon color="fg.muted">{icon}</Icon>
      </HStack>
      <StatValueText>{value}</StatValueText>
    </StatRoot>
  );
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    setChartWidth(containerRef.current.clientWidth);
  }, []);

  return (
    <Page title="Home" icon={<TbHome />}>
      <Stack w="full" h="full" ref={containerRef} gap={8}>
        <Stack>
          <Heading display="flex" alignItems="center" gap={2}>
            <TbNumbers />
            Stats
          </Heading>
          <SimpleGrid columns={[1, 1, 3]} gap={4}>
            <StatCard
              title="Submissions today"
              icon={<TbForms />}
              value={loaderData.submissionsToday.toString()}
            />
            <StatCard
              title="Submissions total"
              icon={<TbForms />}
              value={loaderData.submissionsTotal.toString()}
            />
            <StatCard
              title="Last submission"
              icon={<TbForms />}
              value={loaderData.lastSubmission
                ? moment(loaderData.lastSubmission.createdAt).format(
                    "HH:mm A, MMM Do"
                  )
                : "N/A"}
            />
          </SimpleGrid>
        </Stack>

        <Stack css={{ "--color": "colors.brand.fg" }}>
          <Heading display="flex" alignItems="center" gap={2}>
            <TbCalendarWeek />
            Submissions last 7 days
          </Heading>
          <LineChart
            width={chartWidth}
            height={250}
            data={loaderData.chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <Tooltip />
            <XAxis dataKey="date" />
            <Line
              type="monotone"
              dataKey="submissions"
              stroke="var(--color)"
              strokeWidth={4}
            />
          </LineChart>
        </Stack>
      </Stack>
    </Page>
  );
}
