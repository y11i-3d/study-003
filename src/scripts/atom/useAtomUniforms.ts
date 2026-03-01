import type { Atom, Getter } from "jotai";
import { atom, useStore } from "jotai";
import { useEffect, useMemo } from "react";
import { uniform } from "three/tsl";
import type { UniformNode } from "three/webgpu";
import type { NodeType, NodeTypeMap } from "../tsl/types";

type MapperFn<R = unknown> = (get: Getter) => R;
type Mapper<R = unknown> = readonly [fn: MapperFn<R>, type?: NodeType];

type Prettify<T> = { [K in keyof T]: T[K] } & {};
type AnyUniform = { [K in NodeType]: UniformNode<K, NodeTypeMap[K]> }[NodeType];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UniformMap<T extends Record<string, Mapper<any>>> = Prettify<{
  [K in keyof T]: T[K][1] extends NodeType
    ? UniformNode<T[K][1], ReturnType<T[K][0]>>
    : ReturnType<T[K][0]> extends number
      ? UniformNode<"float", ReturnType<T[K][0]>>
      : UniformNode<
          {
            [N in NodeType]: NodeTypeMap[N] extends ReturnType<T[K][0]>
              ? N
              : never;
          }[NodeType],
          ReturnType<T[K][0]>
        >;
}>;

export const defineAtomUniforms = <
  T extends // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Record<string, Mapper<any>>,
>(
  mappers: T,
): T => mappers;

export const useAtomUniforms = <
  T extends // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Record<string, Mapper<any>>,
>(
  mappers: T,
): UniformMap<T> => {
  const store = useStore();

  const { uniforms, derivedAtoms } = useMemo(() => {
    const uniforms: Record<string, AnyUniform> = {};
    const derivedAtoms: Record<string, Atom<NodeTypeMap[NodeType]>> = {};

    for (const key in mappers) {
      const [fn, type] = mappers[key];
      const derived = atom((get) => fn(get)) as Atom<NodeTypeMap[NodeType]>;
      const initialValue = store.get(derived);

      uniforms[key] = (
        typeof initialValue === "number"
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            uniform(initialValue, type as any)
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            uniform(initialValue as any)
      ) as AnyUniform;
      derivedAtoms[key] = derived;
    }

    return { uniforms: uniforms as UniformMap<T>, derivedAtoms };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubs = Object.keys(derivedAtoms).map((key) => {
      const derived = derivedAtoms[key];
      return store.sub(derived, () => {
        (uniforms[key] as UniformNode<string, NodeTypeMap[NodeType]>).value =
          store.get(derived);
      });
    });

    return () => unsubs.forEach((u) => u());
  }, [store, uniforms, derivedAtoms]);

  return uniforms;
};
