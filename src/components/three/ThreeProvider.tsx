import { createContext, useContext, useMemo } from "react";
import {
  useCloudeStates,
  type CloudAtoms,
  type CloudUniforms,
} from "./cloud/useCloudStates";
import {
  useSkyStates,
  type SkyAtoms,
  type SkyUniforms,
} from "./sky/useSkyStates";
import { useCommonStates, type CommonAtoms } from "./useCommonStates";

type ThreeContextValue = {
  atoms: CommonAtoms & CloudAtoms & SkyAtoms;
  uniforms: CloudUniforms & SkyUniforms;
};

const ThreeContext = createContext<ThreeContextValue | null>(null);

export const ThreeProvider = ({ children }: { children: React.ReactNode }) => {
  const cloudStates = useCloudeStates();
  const skyStates = useSkyStates();
  const commonStates = useCommonStates();

  const value = useMemo(
    () => ({
      atoms: {
        ...commonStates.atoms,
        ...cloudStates.atoms,
        ...skyStates.atoms,
      },
      uniforms: {
        ...cloudStates.uniforms,
        ...skyStates.uniforms,
      },
    }),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
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
