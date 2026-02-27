import { defineAtomControls } from "@/scripts/atom/controls/types";
import { useAtomControls } from "@/scripts/atom/controls/useAtomControls";
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
  Vector2,
  type ToneMapping,
} from "three";

export const useAtoms = () => {
  const atoms = useMemo(() => {
    return {
      rendererLabel: atom(""),
      toneMapping: atom<ToneMapping>(ACESFilmicToneMapping),
      exposure: atom(0.5),

      sunProgress: atom(1),
      sunAzimuth: atom(0),
      skyBlue: atom(1),

      useCellular: atom(true),
      useLiteCellular: atom(false),
      invertedCellular: atom(true),
      cloudScale: atom(0),
      cloudScaleRate: atom(1),
      cloudMix: atom(0.6),
      cloudCoverage: atom(0.6),
      cloudDirection: atom(-45),
      cloudSpeed: atom(0.8),
      cloudEvolution: atom(0.2),
      cloudHorizon: atom(new Vector2(3, 15)),

      animation: atom(false),
    };
  }, []);

  const params = useMemo(
    () =>
      defineAtomControls({
        useCellular: ["boolean", atoms.useCellular],
        useLiteCellular: [
          "boolean",
          atoms.useLiteCellular,
          { label: "\u2003lite" },
        ],
        invertedCellular: [
          "boolean",
          atoms.invertedCellular,
          { label: "\u2003inverted" },
        ],
        cloudScale: [
          "number",
          atoms.cloudScale,
          { min: -2, max: 2, step: 0.25, label: "scale" },
        ],
        cloudScaleRate: [
          "number",
          atoms.cloudScaleRate,
          { min: 0, max: 2, step: 0.25, label: "\u2003rate" },
        ],
        cloudMix: [
          "number",
          atoms.cloudMix,
          { min: 0, max: 1, step: 0.05, label: "mix" },
        ],
        cloudCoverage: [
          "number",
          atoms.cloudCoverage,
          { min: 0.1, max: 0.9, step: 0.05, label: "coverage" },
        ],
        cloudDirection: [
          "number",
          atoms.cloudDirection,
          { min: -90, max: 90, step: 5, label: "direction" },
        ],
        cloudSpeed: [
          "number",
          atoms.cloudSpeed,
          { min: -2, max: 2, step: 0.1, label: "speed" },
        ],
        cloudEvolution: [
          "number",
          atoms.cloudEvolution,
          { min: 0, max: 1, step: 0.1, label: "evolution" },
        ],
        cloudHorizon: [
          "vec2",
          atoms.cloudHorizon,
          {
            x: { min: 0, max: 5, step: 0.25, label: "horizon min" },
            y: { min: 5, max: 15, step: 1, label: "horizon max" },
          },
        ],
        others: {
          children: {
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
            animation: ["boolean", atoms.animation],
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

  return useMemo(() => ({ ...atoms }), [atoms]);
};

export type Atoms = ReturnType<typeof useAtoms>;
