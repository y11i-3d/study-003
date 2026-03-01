import { defineAtomControls } from "@/scripts/atom/controls/types";
import { useAtomControls } from "@/scripts/atom/controls/useAtomControls";
import { atom } from "jotai";
import { useMemo } from "react";
import { Vector3 } from "three";
import { uniform } from "three/tsl";

export const useSkyStates = () => {
  const atoms = useMemo(() => {
    return {
      sunAnimation: atom(false),
      sunProgress: atom(1),
      sunAzimuth: atom(0),
      skyBlue: atom(1),
    };
  }, []);

  const uniforms = {
    sunDirection1: uniform(new Vector3(0, 1, 0)),
    sunDirection2: uniform(new Vector3(0, 1, 0)),
    sunE1: uniform(0),
    sunE2: uniform(0),
    betaR1: uniform(new Vector3()),
    betaR2: uniform(new Vector3()),
    sunfade: uniform(1),
    betaM: uniform(new Vector3()),
    mieDirectionalG: uniform(0.85),
    //...useAtomUniforms({}),
  };

  const controlParams = useMemo(
    () =>
      defineAtomControls({
        sky: {
          children: {
            sunAnimation: ["boolean", atoms.sunAnimation],
            sunProgress: [
              "number",
              atoms.sunProgress,
              { min: 0, max: 1, step: 0.05 },
            ],
            sunAzimuth: [
              "number",
              atoms.sunAzimuth,
              { min: -90, max: 90, step: 5 },
            ],
            skyBlue: ["number", atoms.skyBlue, { min: 0, max: 2, step: 0.1 }],
          },
          folderSettings: {
            collapsed: true,
          },
        },
      }),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useAtomControls(controlParams);

  return {
    atoms,
    uniforms,
  };
};

export type SkyAtoms = ReturnType<typeof useSkyStates>["atoms"];
export type SkyUniforms = ReturnType<typeof useSkyStates>["uniforms"];
