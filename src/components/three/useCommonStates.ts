import { defineAtomControls } from "@/scripts/atom/controls/types";
import { useAtomControls } from "@/scripts/atom/controls/useAtomControls";
import { useFpsAtoms } from "@/scripts/atom/useFpsAtoms";
import { atom } from "jotai";
import { useMemo } from "react";
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  CineonToneMapping,
  LinearToneMapping,
  NeutralToneMapping,
  NoToneMapping,
  ReinhardToneMapping,
  type ToneMapping,
} from "three";

export const useCommonStates = () => {
  const atoms = useMemo(() => {
    return {
      rendererLabel: atom(""),
      dpr: atom("1"),
      toneMapping: atom<ToneMapping>(ACESFilmicToneMapping),
      exposure: atom(0.5),
    };
  }, []);

  const fpsAtoms = useFpsAtoms();

  const params = useMemo(
    () =>
      defineAtomControls({
        others: {
          children: {
            fps: ["string", fpsAtoms.fpsStr, { editable: false }],
            dpr: ["string", atoms.dpr, { editable: false }],
            rendererLabel: ["string", atoms.rendererLabel, { editable: false }],
            toneMapping: [
              "options",
              atoms.toneMapping,
              {
                options: {
                  No: NoToneMapping,
                  Linear: LinearToneMapping,
                  Reinhard: ReinhardToneMapping,
                  Cineon: CineonToneMapping,
                  ACESFilmic: ACESFilmicToneMapping,
                  AgX: AgXToneMapping,
                  Neutral: NeutralToneMapping,
                },
              },
            ],
            exposure: [
              "number",
              atoms.exposure,
              { min: 0.05, max: 1, step: 0.05 },
            ],
          },
          folderSettings: { collapsed: true },
        },

        Links: {
          children: {
            "002: Horizon, Sun, Sky": [
              "link",
              "https://y11i-3d.github.io/study-002/",
            ],
          },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useAtomControls(params);

  return {
    atoms: {
      ...atoms,
      ...fpsAtoms,
    },
  };
};

export type CommonAtoms = ReturnType<typeof useCommonStates>["atoms"];
