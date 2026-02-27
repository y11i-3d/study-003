import type { ThreeElement, ThreeToJSXElements } from "@react-three/fiber";
import type { SkyMesh } from "three/addons/objects/SkyMesh.js";
import type * as THREE_WEBGPU from "three/webgpu";

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE_WEBGPU> {
    skyMesh: ThreeElement<typeof SkyMesh>;
  }
}
