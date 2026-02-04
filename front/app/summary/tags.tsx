import cn from "@meltdownjs/cn";

export default function Tags({
  tags,
}: {
  tags: Array<{ title: string; count: number }>;
}) {
  const paddingBoxes = (3 - (tags.length % 3)) % 3;

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3",
        "rounded-box gap-px",
        "bg-base-300 border border-base-300"
      )}
    >
      {tags.map((tag) => (
        <div
          key={tag.title}
          className={cn("p-2 px-3 bg-base-100", "flex justify-between")}
        >
          {tag.title}
          <span className="badge badge-primary badge-soft">{tag.count}</span>
        </div>
      ))}
      {Array.from({ length: paddingBoxes }).map((_, index) => (
        <div key={index} className="p-2 px-3 bg-base-100 hidden md:block" />
      ))}
    </div>
  );
}
