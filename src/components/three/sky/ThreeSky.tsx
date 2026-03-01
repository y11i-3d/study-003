import { buildSkyConfig, skyColor } from "@/components/three/sky/sky";
import { CubicIn, ExpoOut, QuadOut } from "@/scripts/gsap/gsapUtils";
import gsap from "gsap";
import { useAtomValue, useStore } from "jotai";
import { useEffect, useMemo } from "react";
import { BackSide, MathUtils } from "three";
import {
  Fn,
  acos,
  cameraPosition,
  dot,
  max,
  modelViewProjection,
  normalize,
  positionWorld,
  screenUV,
  texture,
  vec3,
  vec4,
} from "three/tsl";
import { type Node } from "three/webgpu";
import { useThreeContext } from "../ThreeProvider";
import { cloud } from "../cloud/cloud";

export const ThreeSky = () => {
  const store = useStore();
  const { atoms, uniforms } = useThreeContext();

  const onUpdateUniform = () => {
    const horizon = 5;
    const skyBlue = store.get(atoms.skyBlue);
    const sunAzimuth = store.get(atoms.sunAzimuth) - 90;

    const sunProgress = CubicIn(store.get(atoms.sunProgress));
    const sunElevation1 = MathUtils.lerp(-5, 90, sunProgress);
    const sunElevation2 = sunElevation1 / Math.pow(2, horizon);

    const twilight = MathUtils.clamp((sunElevation1 + 5) / 5, 0, 1);

    const haze = MathUtils.lerp(0.75, 0.3, QuadOut(twilight));
    const skyDensity = MathUtils.lerp(0.15, 1, twilight);
    const sunGlow = MathUtils.lerp(0.8, 0.999, ExpoOut(sunProgress));

    const p = buildSkyConfig({
      sunElevation1,
      sunElevation2,
      sunAzimuth,
      haze,
      skyDensity,
      skyBlue,
    });

    uniforms.sunDirection1.value.copy(p.sunDirection1);
    uniforms.sunDirection2.value.copy(p.sunDirection2);
    uniforms.sunE1.value = p.sunE1;
    uniforms.sunE2.value = p.sunE2;
    uniforms.betaR1.value.copy(p.betaR1);
    uniforms.betaR2.value.copy(p.betaR2);
    uniforms.sunfade.value = p.sunfade;
    uniforms.betaM.value.copy(p.betaM);
    uniforms.mieDirectionalG.value = Math.sqrt(sunGlow);
  };

  const subscribedAtoms = [atoms.sunProgress, atoms.sunAzimuth, atoms.skyBlue];

  useEffect(() => {
    const unsubs = subscribedAtoms.map((atom) =>
      store.sub(atom, onUpdateUniform),
    );
    onUpdateUniform();

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, atoms, uniforms]);

  const animation = useAtomValue(atoms.sunAnimation);

  useEffect(() => {
    const obj = { val: 0 };
    if (!animation) return;
    gsap.to(obj, {
      val: 1,
      duration: 8,
      ease: "linear",
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        store.set(atoms.sunProgress, obj.val);
      },
    });
    return () => {
      gsap.killTweensOf(obj);
    };
  }, [animation, store, atoms]);

  const useCellular = useAtomValue(atoms.useCellular);
  const invertedCellular = useAtomValue(atoms.invertedCellular);
  const useLiteCellular = useAtomValue(atoms.useLiteCellular);

  const cloudNoiseTexture = useMemo(
    () => texture(store.get(atoms.cloudRenderTarget2).texture, screenUV),
    [store, atoms.cloudRenderTarget2],
  );

  const colorNode = useMemo(() => {
    const direction = normalize(positionWorld.sub(cameraPosition));
    const zenithAngle = acos(max(0.0, dot(vec3(0, 1, 0), direction)));

    const { sky, Orange } = skyColor(
      uniforms.sunDirection1,
      uniforms.sunDirection2,
      uniforms.sunE1,
      uniforms.sunE2,
      uniforms.sunfade,
      uniforms.betaR1,
      uniforms.betaR2,
      uniforms.betaM,
      uniforms.mieDirectionalG,
      direction,
      zenithAngle,
    );

    const cloudMask = cloud(
      useCellular,
      invertedCellular,

      uniforms.cloudHorizon,
      uniforms.cloudCoverage,
      uniforms.cloudMix,
      uniforms.cloudMaxValue,
      direction,
      zenithAngle,
      cloudNoiseTexture,
    );
    const clouds = cloudMask.mul(Orange);

    return vec4(sky.rgb.add(clouds), 1.0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCellular, useLiteCellular, invertedCellular]);

  return (
    <mesh name="ThreeSky" scale={10000}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicNodeMaterial
        key={colorNode.uuid}
        side={BackSide}
        depthWrite={false}
        colorNode={colorNode}
        vertexNode={Fn(() => {
          const pos = modelViewProjection as Node<"vec4">;
          pos.z.assign(pos.w);
          return pos;
        })()}
      />
    </mesh>
  );
};
