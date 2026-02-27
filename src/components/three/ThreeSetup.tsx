import { extend, useThree } from "@react-three/fiber";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { SkyMesh } from "three/addons/objects/SkyMesh.js";
import * as THREE_WEBGPU from "three/webgpu";
import { useThreeContext } from "./ThreeProvider";

type WebGPURendererWithBackend = THREE_WEBGPU.WebGPURenderer & {
  backend: { isWebGPUBackend: boolean };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE_WEBGPU as any);
extend({ SkyMesh });

export const ThreeSetup = () => {
  const { atoms } = useThreeContext();
  const { gl } = useThree();

  const setLabel = useSetAtom(atoms.rendererLabel);
  const toneMapping = useAtomValue(atoms.toneMapping);
  const exposure = useAtomValue(atoms.exposure);

  useEffect(() => {
    const renderer = gl as unknown as WebGPURendererWithBackend;
    setLabel(renderer.backend.isWebGPUBackend === true ? "WebGPU" : "WebGL");
  }, [gl, setLabel, atoms.rendererLabel]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    gl.toneMapping = toneMapping;
    gl.toneMappingExposure = exposure;
  }, [gl, toneMapping, exposure]);

  return null;
};
