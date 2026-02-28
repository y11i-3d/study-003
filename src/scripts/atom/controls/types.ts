import type { Atom, PrimitiveAtom } from "jotai";
import type {
  ButtonSettings,
  FolderSettings,
  InputOptions,
  NumberSettings,
} from "leva/plugin";
import type { Vector2, Vector3, Vector4 } from "three";

export type Transform<T> = (v: T) => T;

export type StringSettings = {
  editable?: boolean;
  rows?: boolean | number;
};

export type OptionsSettings<T> = {
  options: T[] | Record<string, T>;
};

export type NumberSchemeSettings = NumberSettings &
  Omit<InputOptions, "onChange" | "transient">;

export type BooleanSchemeSettings = Omit<
  InputOptions,
  "onChange" | "transient"
>;

export type StringSchemeSettings = StringSettings &
  Omit<InputOptions, "onChange" | "transient">;

export type OptionsSchemeSettings<T> = OptionsSettings<T> &
  Omit<InputOptions, "onChange" | "transient">;

export type ColorSchemeSettings = Omit<InputOptions, "onChange" | "transient">;

export type NumberControllerParams = [
  type: "number",
  atom: PrimitiveAtom<number>,
  settings?: NumberSchemeSettings,
  onChange?: Transform<number>,
  onInit?: Transform<number>,
];

export type BooleanControllerParams = [
  type: "boolean",
  atom: PrimitiveAtom<boolean>,
  settings?: BooleanSchemeSettings,
  onChange?: Transform<boolean>,
  onInit?: Transform<boolean>,
];

export type StringControllerParams = [
  type: "string",
  atom: Atom<string>,
  settings?: StringSchemeSettings,
  onChange?: Transform<string>,
  onInit?: Transform<string>,
];

export type OptionsControllerParams<T> = [
  type: "options",
  atom: PrimitiveAtom<T>,
  settings?: OptionsSchemeSettings<T>,
  onChange?: Transform<T>,
  onInit?: Transform<T>,
];
export type ColorControllerParams = [
  type: "color",
  atom: PrimitiveAtom<string>,
  settings?: ColorSchemeSettings,
  onChange?: Transform<string>,
  onInit?: Transform<string>,
];

export type Vector2ControllerParams = [
  type: "vec2",
  atom: PrimitiveAtom<Vector2>,
  settings?: {
    x?: NumberSchemeSettings;
    y?: NumberSchemeSettings;
  },
  onChange?: Transform<Vector2>,
  onInit?: Transform<Vector2>,
];

export type Vector3ControllerParams = [
  type: "vec3",
  atom: PrimitiveAtom<Vector3>,
  settings?: {
    x?: NumberSchemeSettings;
    y?: NumberSchemeSettings;
    z?: NumberSchemeSettings;
  },
  onChange?: Transform<Vector3>,
  onInit?: Transform<Vector3>,
];

export type Vector4ControllerParams = [
  type: "vec4",
  atom: PrimitiveAtom<Vector4>,
  settings?: {
    x?: NumberSchemeSettings;
    y?: NumberSchemeSettings;
    z?: NumberSchemeSettings;
    w?: NumberSchemeSettings;
  },
  onChange?: Transform<Vector4>,
  onInit?: Transform<Vector4>,
];

export type BoolNumberControllerParams<
  T extends number = number,
  F extends number = number,
> = [
  type: "boolNumber",
  atom: PrimitiveAtom<number>,
  truthy: T,
  falsy: F,
  settings?: NumberSchemeSettings,
  onChange?: (v: boolean) => T | F,
  onInit?: (v: T | F) => boolean,
];

export type ButtonControllerParams = [
  type: "button",
  onClick: () => void,
  settings?: ButtonSettings,
];

export type LinkControllerParams = [
  type: "link",
  url: string,
  target?: string,
  settings?: ButtonSettings,
];

type ControllerMap = {
  number: NumberControllerParams;
  boolean: BooleanControllerParams;
  string: StringControllerParams;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: OptionsControllerParams<any>;
  color: ColorControllerParams;
  vec2: Vector2ControllerParams;
  vec3: Vector3ControllerParams;
  vec4: Vector4ControllerParams;
  boolNumber: BoolNumberControllerParams<number, number>;
  button: ButtonControllerParams;
  link: LinkControllerParams;
};

export type ControllerType = keyof ControllerMap;

export type ControllerParams = ControllerMap[ControllerType];

type ToCanonical<K> = K extends FolderParams
  ? {
      children: InferAtomControls<K["children"]>;
      folderSettings?: FolderSettings;
    }
  : K extends [infer Type, ...unknown[]]
    ? Type extends ControllerType
      ? Type extends "options"
        ? K extends [unknown, infer A, ...unknown[]]
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            A extends { read: (get: any, ...args: any[]) => infer V }
            ? OptionsControllerParams<V>
            : ControllerMap[Type]
          : ControllerMap[Type]
        : ControllerMap[Type]
      : K
    : K;

export type InferAtomControls<T> = {
  [K in keyof T]: ToCanonical<T[K]>;
};

export function defineAtomControls<T extends AtomControlParams>(
  params: InferAtomControls<T>,
): InferAtomControls<T> {
  return params;
}

export type AtomControlParams = Record<string, ControllerParams | FolderParams>;

export type FolderParams = {
  children: AtomControlParams;
  folderSettings?: FolderSettings;
};
