import type {
  Color,
  InputNode,
  Matrix2,
  Matrix3,
  Matrix4,
  Node,
  Vector2,
  Vector3,
  Vector4,
} from "three/webgpu";

export type NodeTypeMap = {
  float: number;
  int: number;
  uint: number;
  bool: boolean;
  vec2: Vector2;
  vec3: Vector3;
  vec4: Vector4;
  color: Color;
  mat2: Matrix2;
  mat3: Matrix3;
  mat4: Matrix4;
};

export type NodeType = keyof NodeTypeMap;

export type NodeToLiteral<T extends string> = T extends keyof NodeTypeMap
  ? NodeTypeMap[T]
  : never;

export type FnArg<N extends Node> =
  N extends InputNode<NodeType, infer V>
    ? N | V
    : N extends Node<infer T extends string>
      ? N | NodeToLiteral<T>
      : never;

export type FnArgs<T extends readonly Node[]> = {
  [K in keyof T]: FnArg<T[K]>;
};
