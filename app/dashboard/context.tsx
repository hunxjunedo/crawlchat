import { createContext, useState } from "react";

export const useApp = (user: { id: string }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return { user, menuOpen, setMenuOpen };
};

export const AppContext = createContext({} as ReturnType<typeof useApp>);
