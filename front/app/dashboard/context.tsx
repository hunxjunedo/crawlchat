import type { Scrape, User } from "libs/prisma";
import { createContext, useState } from "react";
import type { SetupProgressAction } from "./setup-progress";

export const useApp = ({
  user,
  scrapeId,
  scrape,
}: {
  user: User;
  scrapeId?: string;
  scrape?: Scrape;
}) => {
  const [containerWidth, setContainerWidth] = useState<number>();
  const [progressActions, setProgressActions] = useState<SetupProgressAction[]>(
    []
  );

  return {
    user,
    containerWidth,
    setContainerWidth,
    scrapeId,
    progressActions,
    setProgressActions,
    scrape,
  };
};

export const AppContext = createContext({} as ReturnType<typeof useApp>);
