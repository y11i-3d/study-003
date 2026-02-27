import { createContext, useContext, useMemo } from "react";
import { useAtoms, type Atoms } from "./hooks/useAtoms";

type ThreeContextValue = { atoms: Atoms };

const ThreeContext = createContext<ThreeContextValue | null>(null);

export const ThreeProvider = ({ children }: { children: React.ReactNode }) => {
  const atoms = useAtoms();

  const value = useMemo(
    () => ({
      atoms,
    }),
    [atoms],
  );

  return (
    <ThreeContext.Provider value={value}>{children}</ThreeContext.Provider>
  );
};

export const useThreeContext = () => {
  const ctx = useContext(ThreeContext);
  if (!ctx)
    throw new Error("useThreeContext must be used within ThreeProvider");
  return ctx;
};
