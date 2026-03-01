import { defineAtomControls } from "@/scripts/atom/controls/types";
import { useAtomControls } from "@/scripts/atom/controls/useAtomControls";
import { useAtomUniforms } from "@/scripts/atom/useAtomUniforms";
import { atom } from "jotai";
import { useMemo } from "react";
import { HalfFloatType, MathUtils, RenderTarget, Vector2 } from "three";

export const useCloudeStates = () => {
  const atoms = useMemo(() => {
    return {
      cloudOctaves: atom(5),
      cloudPass1Octaves: atom(3),
      cloudPass1Resolution: atom(0.25),
      cloudPass2Resolution: atom(0.5),

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

      cloudRenderTarget1: atom<RenderTarget>(
        new RenderTarget(1, 1, { type: HalfFloatType }),
      ),
      cloudRenderTarget2: atom<RenderTarget>(
        new RenderTarget(1, 1, { type: HalfFloatType }),
      ),

      cloudLayerTarget: atom<RenderTarget | null>(null),
    };
  }, []);

  const uniforms = useAtomUniforms({
    useCellular: [(get) => get(atoms.useCellular)],
    useLiteCellular: [(get) => get(atoms.useLiteCellular)],
    invertedCellular: [(get) => get(atoms.invertedCellular)],
    cloudScale: [(get) => Math.pow(2, get(atoms.cloudScale))],
    cloudScaleRate: [(get) => Math.pow(2, get(atoms.cloudScaleRate))],
    cloudMix: [(get) => get(atoms.cloudMix)],
    cloudCoverage: [(get) => 1.0 - get(atoms.cloudCoverage)],
    cloudDirection: [(get) => get(atoms.cloudDirection)],
    cloudSpeed: [(get) => get(atoms.cloudSpeed) * 0.1],
    cloudEvolution: [(get) => get(atoms.cloudEvolution) * 0.1],
    cloudHorizon: [
      (get) => {
        const fade = get(atoms.cloudHorizon);
        return new Vector2(
          MathUtils.degToRad(fade.x),
          MathUtils.degToRad(fade.y),
        );
      },
    ],
    cloudMaxValue: [
      (get) => {
        const total = get(atoms.cloudOctaves);
        return Math.max(2 * (1 - Math.pow(0.5, total)), 1e-6);
      },
    ],
  });

  const controlParams = useMemo(
    () =>
      defineAtomControls({
        cloudPass1Resolution: [
          "number",
          atoms.cloudPass1Resolution,
          { min: 0.05, max: 1, step: 0.05, label: "resolution1" },
        ],
        cloudPass2Resolution: [
          "number",
          atoms.cloudPass2Resolution,
          { min: 0.05, max: 1, step: 0.05, label: "resolution2" },
        ],
        cloudPass1Octaves: [
          "number",
          atoms.cloudPass1Octaves,
          { min: 1, max: 8, step: 1, label: "octave1" },
        ],
        cloudOctaves: [
          "number",
          atoms.cloudOctaves,
          { min: 1, max: 8, step: 1, label: "octaves1+2" },
        ],
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

export type CloudAtoms = ReturnType<typeof useCloudeStates>["atoms"];
export type CloudUniforms = ReturnType<typeof useCloudeStates>["uniforms"];
