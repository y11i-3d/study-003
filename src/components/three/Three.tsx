import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { WebGPURenderer } from "three/webgpu";
import { ThreeCamera } from "./ThreeCamera";
import { ThreeProvider } from "./ThreeProvider";
import { ThreeSetup } from "./ThreeSetup";
import { ThreeSky } from "./ThreeSky";

type WebGPURendererParameters = ConstructorParameters<typeof WebGPURenderer>[0];

export const Three = () => {
  return (
    <div className="h-dvh w-screen">
      <Canvas
        gl={async (props) => {
          const renderer = new WebGPURenderer(
            props as WebGPURendererParameters,
          );
          await renderer.init();
          return renderer;
        }}
        dpr={[1, 1.75]}
      >
        <ThreeProvider>
          <ThreeSetup></ThreeSetup>
          <ThreeCamera />
          <ThreeSky />
        </ThreeProvider>
      </Canvas>
      <div className="in-[html.hide-controls]:hidden in-[html.hide-ui]:hidden">
        <Leva collapsed={false} />
      </div>
    </div>
  );
};
