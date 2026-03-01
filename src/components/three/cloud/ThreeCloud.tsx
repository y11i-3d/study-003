import { useFrame, useThree } from "@react-three/fiber";
import { useAtomValue, useStore } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import { BackSide, Mesh, Object3D } from "three";
import {
  cameraPosition,
  Fn,
  modelViewProjection,
  normalize,
  positionWorld,
  screenUV,
  texture,
  uniform,
  vec4,
} from "three/tsl";
import type { Node, UniformNode } from "three/webgpu";
import { useThreeContext } from "../ThreeProvider";
import { cloudNoise } from "./cloud";

export const ThreeCloud = () => {
  const store = useStore();
  const { scene, camera, size, gl } = useThree();
  const { atoms, uniforms } = useThreeContext();

  const visibleStatesRef = useRef(new Map<Object3D, boolean>());
  const meshRef = useRef<Mesh>(null);

  const useCellular = useAtomValue(atoms.useCellular);
  const useLiteCellular = useAtomValue(atoms.useLiteCellular);

  const localUniforms = useMemo(
    () => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beginOctave: uniform(1, "int" as any) as unknown as UniformNode<
        "int",
        number
      >,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      octaves: uniform(3, "int" as any) as unknown as UniformNode<
        "int",
        number
      >,

      previousTexture: texture(
        store.get(atoms.cloudRenderTarget2).texture,
        screenUV,
      ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const colorNode = useMemo(() => {
    const direction = normalize(positionWorld.sub(cameraPosition));

    const noiseNode = cloudNoise(
      useCellular,
      useLiteCellular,
      uniforms.cloudScale,
      uniforms.cloudScaleRate,
      uniforms.cloudDirection,
      uniforms.cloudSpeed,
      uniforms.cloudEvolution,
      localUniforms.beginOctave,
      localUniforms.octaves,
      direction,
    );
    return vec4(noiseNode.add(localUniforms.previousTexture.xy), 0.0, 1.0);
  }, [uniforms, useCellular, useLiteCellular, localUniforms]);

  const cloudPass1Resolution = useAtomValue(atoms.cloudPass1Resolution);
  const cloudPass2Resolution = useAtomValue(atoms.cloudPass2Resolution);

  useEffect(() => {
    const dpr = gl.getPixelRatio();

    const target1 = store.get(atoms.cloudRenderTarget1);
    const target2 = store.get(atoms.cloudRenderTarget2);

    const w1 = Math.max(1, Math.floor(size.width * cloudPass1Resolution * dpr));
    const h1 = Math.max(
      1,
      Math.floor(size.height * cloudPass1Resolution * dpr),
    );
    target1.setSize(w1, h1);

    const w2 = Math.max(1, Math.floor(size.width * cloudPass2Resolution * dpr));
    const h2 = Math.max(
      1,
      Math.floor(size.height * cloudPass2Resolution * dpr),
    );
    target2.setSize(w2, h2);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, cloudPass1Resolution, cloudPass2Resolution]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const target1 = store.get(atoms.cloudRenderTarget1);
    const target2 = store.get(atoms.cloudRenderTarget2);
    const octaves1 = store.get(atoms.cloudPass1Octaves);
    const octavesTotal = store.get(atoms.cloudOctaves);

    //
    const visibleStates = visibleStatesRef.current;
    visibleStates.clear();
    scene.children.forEach((child) => {
      visibleStates.set(child, child.visible);
      child.visible = false;
    });

    mesh.visible = true;

    // ---------- Reset
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gl.setRenderTarget(target2 as any);
    gl.clear();

    // ---------- Pass 1
    localUniforms.beginOctave.value = 1;
    localUniforms.octaves.value = octaves1;
    localUniforms.previousTexture.value = target2.texture;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gl.setRenderTarget(target1 as any);
    gl.clear();
    gl.render(scene, camera);

    // ---------- Pass 2
    localUniforms.beginOctave.value = octaves1 + 1;
    localUniforms.octaves.value = Math.max(0, octavesTotal - octaves1);
    localUniforms.previousTexture.value = target1.texture;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gl.setRenderTarget(target2 as any);
    gl.render(scene, camera);

    gl.setRenderTarget(null);

    //
    visibleStates.forEach((visible, child) => {
      child.visible = visible;
    });
  }, 0);

  return (
    <mesh ref={meshRef} scale={10000} visible={false}>
      <boxGeometry args={[1, 1, 1]} />
      <nodeMaterial
        key={colorNode.uuid}
        side={BackSide}
        depthWrite={false}
        fragmentNode={colorNode}
        vertexNode={Fn(() => {
          const pos = modelViewProjection as Node<"vec4">;
          pos.z.assign(pos.w);
          return pos;
        })()}
      />
    </mesh>
  );
};
