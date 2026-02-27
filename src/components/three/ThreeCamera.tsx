import {
  CameraControls,
  PerspectiveCamera,
  type PerspectiveCameraProps,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type ThreeCameraProps = Omit<
  PerspectiveCameraProps,
  "position" | "makeDefault" | "manual"
>;

export const ThreeCamera = ({ ...props }: ThreeCameraProps) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  const controls = useThree((state) => state.controls as CameraControls);
  useEffect(() => {
    if (controls) {
      const y = 5 * Math.tan((10 * Math.PI) / 180);
      controls.setLookAt(0, 0, 5, 0, y, 0, false);
    }
  }, [controls]);

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, 0, 5]}
        {...props}
      />
      <CameraControls makeDefault />
    </>
  );
};
