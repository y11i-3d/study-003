import type { Atom, PrimitiveAtom } from "jotai";
import { useStore } from "jotai";
import type { Store } from "jotai/vanilla/store";
import { button, folder, useControls } from "leva";
import type { Schema } from "leva/plugin";
import { useEffect } from "react";
import type {
  AtomControlParams,
  BoolNumberControllerParams,
  ControllerParams,
  FolderParams,
} from "./types";

type SchemaItemWithOptions = Schema[string];

const isFolderParams = (
  v: ControllerParams | FolderParams,
): v is FolderParams => "children" in v;

const parseParams = (params: ControllerParams) => {
  const type = params[0];
  if (type === "button")
    return { type, onClick: params[1], settings: params[2] };

  if (type === "link")
    return { type, url: params[1], target: params[2], settings: params[3] };

  if (type === "boolNumber") {
    const p = params as BoolNumberControllerParams;
    return {
      type,
      atom: p[1],
      truthy: p[2],
      falsy: p[3],
      settings: p[4],
      onChange: p[5],
      onInit: p[6],
    };
  }

  return {
    type,
    atom: params[1] as PrimitiveAtom<unknown>,
    settings: params[2] as Record<string, unknown> | undefined,
    onChange: params[3] as ((v: unknown) => unknown) | undefined,
    onInit: params[4] as ((v: unknown) => unknown) | undefined,
  };
};

const getLevaValues = (
  key: string,
  params: ControllerParams,
  store: Store,
): Record<string, unknown> => {
  const p = parseParams(params);
  if (p.type === "button" || p.type === "link") return {};

  const raw = store.get(p.atom);

  switch (p.type) {
    case "vec2":
    case "vec3":
    case "vec4": {
      const v = (p.onInit ? p.onInit(raw) : raw) as Record<string, number>;
      const result: Record<string, unknown> = {};
      ["x", "y", "z", "w"].forEach((axis) => {
        if (axis in v && p.settings?.[axis]) result[`${key}_${axis}`] = v[axis];
      });
      return result;
    }
    case "boolNumber": {
      return { [key]: p.onInit ? p.onInit(raw as number) : raw === p.truthy };
    }
    default: {
      return { [key]: p.onInit ? p.onInit(raw) : raw };
    }
  }
};

const buildScheme = (
  key: string,
  params: ControllerParams,
  store: Store,
): Record<string, SchemaItemWithOptions> => {
  const p = parseParams(params);
  const values = getLevaValues(key, params, store);

  if (p.type === "button") {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key]: button(p.onClick, p.settings as any) as SchemaItemWithOptions,
    };
  }

  if (p.type === "link") {
    return {
      [key]: button(() => {
        window.open(p.url, p.target ?? "_blank");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, p.settings as any) as SchemaItemWithOptions,
    };
  }

  const result: Record<string, SchemaItemWithOptions> = {};
  for (const [vKey, vVal] of Object.entries(values)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item: any =
      p.type === "string" ? { type: "STRING", value: vVal } : { value: vVal };

    if (p.type === "vec2" || p.type === "vec3" || p.type === "vec4") {
      const axis = vKey.split("_").pop() as "x" | "y" | "z" | "w";
      const settings = p.settings?.[axis];
      Object.assign(item, settings);
      item.onChange = (v: number, _path: string, ctx: { initial: boolean }) => {
        if (ctx.initial) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const current = (store.get(p.atom) as any).clone();
        current[axis] = v;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.set(p.atom as any, p.onChange ? p.onChange(current) : current);
      };
    } else {
      Object.assign(item, p.settings);
      const isReadOnly = !("write" in p.atom);
      if (!isReadOnly) {
        item.onChange = (
          v: unknown,
          _path: string,
          ctx: { initial: boolean },
        ) => {
          if (ctx.initial) return;
          if (p.type === "boolNumber") {
            const next = p.onChange
              ? p.onChange(v as boolean)
              : v
                ? p.truthy
                : p.falsy;
            store.set(p.atom, next);
          } else {
            const next = p.onChange ? p.onChange(v) : v;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            store.set(p.atom as any, next);
          }
        };
      }
    }
    result[vKey] = item as SchemaItemWithOptions;
  }
  return result;
};

const buildSchema = (params: AtomControlParams, store: Store) => {
  const schema: Record<string, SchemaItemWithOptions> = {};
  for (const [key, value] of Object.entries(params)) {
    if (isFolderParams(value)) {
      schema[key] = folder(
        buildSchema(value.children, store),
        value.folderSettings ?? {},
      );
    } else {
      Object.assign(schema, buildScheme(key, value, store));
    }
  }
  return schema;
};

const collectAtoms = (
  params: AtomControlParams,
): [string, ControllerParams][] => {
  const result: [string, ControllerParams][] = [];
  for (const [key, value] of Object.entries(params)) {
    if (isFolderParams(value)) result.push(...collectAtoms(value.children));
    else if (value[0] !== "button" && value[0] !== "link") {
      result.push([key, value]);
    }
  }
  return result;
};

export const useAtomControls = (params: AtomControlParams) => {
  const store = useStore();
  const [, set] = useControls(() => buildSchema(params, store));

  useEffect(() => {
    const unsubs = collectAtoms(params).map(([key, controller]) => {
      const atom = controller[1] as Atom<unknown>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sync = () => set(getLevaValues(key, controller, store) as any);
      const unsub = store.sub(atom, sync);
      sync();
      return unsub;
    });
    return () => unsubs.forEach((unsub) => unsub());
  }, [params, store, set]);
};
