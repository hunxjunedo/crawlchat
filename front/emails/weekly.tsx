import { Section, Text, Row, Column } from "@react-email/components";
import { emailConfig } from "./config";
import { MailTemplate } from "./template";

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <Section
      style={{
        background: "#f3f3f5",
        padding: "20px",
        borderRadius: "10px",
      }}
    >
      <Text
        style={{
          margin: "0px",
          fontSize: "16px",
          opacity: 0.5,
          marginBottom: "10px",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          margin: "0px",
          fontSize: "42px",
          fontWeight: "bold",
          lineHeight: "auto",
        }}
      >
        {value}
      </Text>
    </Section>
  );
}

function LeftBox({ children }: { children: React.ReactNode }) {
  return <Column style={{ width: "50%", paddingRight: 8 }}>{children}</Column>;
}

function RightBox({ children }: { children: React.ReactNode }) {
  return <Column style={{ width: "50%", paddingLeft: 8 }}>{children}</Column>;
}

export default function WeeklyEmail(props: {
  scrapeTitle: string | null;
  questions: number;
  topCategories: { name: string; count: number; avgScore?: number | null }[];
  avgScore?: number | null;
  helpfulAnswers?: number | null;
  notHelpfulAnswers?: number | null;
}) {
  return (
    <MailTemplate
      title="CrawlChat Weekly"
      preview="Your weekly update on your conversations and performance!"
      heading={`${props.scrapeTitle ? props.scrapeTitle + " - " : ""}Weekly`}
      icon="🗓️"
      text="Thank you for being a part of our community! Here is the weekly updates with the stats for your collection. Keeping up to date with this information will let you make your documentation or content relavent to your customers or community."
      cta={{
        text: "View more details",
        href: `${emailConfig.baseUrl}/app`,
      }}
    >
      <Row style={{ marginBottom: "16px" }}>
        <LeftBox>
          <MetricCard title="Questions" value={props.questions} />
        </LeftBox>
        <RightBox>
          <MetricCard
            title="Avg Score"
            value={props.avgScore ? props.avgScore.toFixed(2) : "-"}
          />
        </RightBox>
      </Row>

      <Row style={{ marginBottom: "16px" }}>
        <LeftBox>
          <MetricCard
            title="Helpful answers"
            value={props.helpfulAnswers ?? 0}
          />
        </LeftBox>
        <RightBox>
          <MetricCard
            title="Not helpful answers"
            value={props.notHelpfulAnswers ?? 0}
          />
        </RightBox>
      </Row>

      <Row style={{ marginBottom: "16px" }}>
        <Text style={{ margin: "0px", fontSize: "20px", fontWeight: "medium" }}>
          Top categories
        </Text>

        <ul style={{ marginTop: "8px", padding: "0px 24px", fontSize: "16px" }}>
          {props.topCategories?.map((category) => (
            <li key={category.name}>
              {category.name} [{category.count} questions,{" "}
              {category.avgScore ? category.avgScore.toFixed(2) : "-"} avg
              score]
            </li>
          ))}
          {(!props.topCategories || props.topCategories.length === 0) && (
            <li>No categories found</li>
          )}
        </ul>
      </Row>
    </MailTemplate>
  );
}
