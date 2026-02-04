import cn from "@meltdownjs/cn";

export default function Tags({
  tags,
}: {
  tags: Array<{ title: string; count: number }>;
}) {
  return (
    <div className={cn("flex flex-row flex-wrap gap-3")}>
      {tags.map((tag) => (
        <div
          className={cn("border border-base-300 p-3 bg-base-100 flex gap-2")}
        >
          {tag.title}
          <span className="badge badge-primary rounded-4xl badge-soft">
            {tag.count}
          </span>
        </div>
      ))}
    </div>
  );
}
