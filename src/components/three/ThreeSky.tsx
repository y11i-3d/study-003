import {
  buildSkyConfig,
  cloudColor,
  skyColor,
} from "@/components/three/tsl/sky";
import { CubicIn, ExpoOut, QuadOut } from "@/scripts/gsap/gsapUtils";
import gsap from "gsap";
import { useAtomValue, useStore } from "jotai";
import { useEffect, useMemo } from "react";
import { BackSide, MathUtils, Vector2 } from "three";
import {
  Fn,
  acos,
  cameraPosition,
  dot,
  max,
  modelViewProjection,
  normalize,
  positionWorld,
  uniform,
  vec4,
} from "three/tsl";
import { Vector3 } from "three/webgpu";
import { useThreeContext } from "./ThreeProvider";

const UP: [number, number, number] = [0, 1, 0];
const SCALE = 10000;

export const ThreeSky = () => {
  const store = useStore();
  const { atoms } = useThreeContext();

  const uniforms = useMemo(() => {
    return {
      sunDirection1: uniform(new Vector3(0, 1, 0)),
      sunDirection2: uniform(new Vector3(0, 1, 0)),
      sunE1: uniform(0),
      sunE2: uniform(0),
      betaR1: uniform(new Vector3()),
      betaR2: uniform(new Vector3()),
      sunfade: uniform(1),
      betaM: uniform(new Vector3()),
      upUniform: uniform(new Vector3(...UP)),
      mieDirectionalG: uniform(0.85),
      showSunDiskUniform: uniform(0),
      cloudScale: uniform(0),
      cloudScaleRate: uniform(0),
      cloudMix: uniform(0),
      cloudDirection: uniform(0),
      cloudSpeed: uniform(0),
      cloudEvolution: uniform(0),
      cloudHorizon: uniform(new Vector2()),
      cloudCoverage: uniform(0),
      useCellular: uniform(1),
      invertedCellular: uniform(1),
      useLiteCellular: uniform(1),
    };
  }, []);

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
    uniforms.upUniform.value.set(...UP);
    uniforms.mieDirectionalG.value = Math.sqrt(sunGlow);
    uniforms.cloudScale.value = Math.pow(2, -store.get(atoms.cloudScale));
    uniforms.cloudScaleRate.value = Math.pow(
      2,
      store.get(atoms.cloudScaleRate),
    );
    uniforms.cloudMix.value = store.get(atoms.cloudMix);
    uniforms.cloudDirection.value = store.get(atoms.cloudDirection);
    uniforms.cloudSpeed.value = store.get(atoms.cloudSpeed) * 0.1;
    uniforms.cloudEvolution.value = store.get(atoms.cloudEvolution) * 0.1;
    uniforms.cloudCoverage.value = 1.0 - store.get(atoms.cloudCoverage);
    uniforms.useCellular.value = store.get(atoms.useCellular) ? 1 : 0;
    uniforms.invertedCellular.value = store.get(atoms.invertedCellular) ? 1 : 0;
    uniforms.useLiteCellular.value = store.get(atoms.useLiteCellular) ? 1 : 0;

    const fade = store.get(atoms.cloudHorizon);
    uniforms.cloudHorizon.value.set(
      MathUtils.degToRad(fade.x),
      MathUtils.degToRad(fade.y),
    );
  };

  const subscribedAtoms = [
    atoms.sunProgress,
    atoms.sunAzimuth,
    atoms.skyBlue,
    atoms.cloudScale,
    atoms.cloudScaleRate,
    atoms.cloudMix,
    atoms.cloudCoverage,
    atoms.cloudDirection,
    atoms.cloudSpeed,
    atoms.cloudEvolution,
    atoms.cloudHorizon,
    atoms.useCellular,
    atoms.invertedCellular,
    atoms.useLiteCellular,
  ];

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

  const animation = useAtomValue(atoms.animation);

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

  const colorNode = useMemo(() => {
    const direction = normalize(positionWorld.sub(cameraPosition));
    const zenithAngle = acos(max(0.0, dot(uniforms.upUniform, direction)));

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

    const clouds = cloudColor(
      uniforms.cloudScale,
      uniforms.cloudHorizon,
      uniforms.cloudDirection,
      uniforms.cloudSpeed,
      uniforms.cloudEvolution,
      uniforms.cloudCoverage,
      uniforms.cloudScaleRate,
      uniforms.cloudMix,
      direction,
      zenithAngle,
      Orange,
      uniforms.useCellular,
      uniforms.invertedCellular,
      uniforms.useLiteCellular,
    );

    return vec4(sky.rgb.add(clouds), 1.0);
    //return vec4(sky.rgb, 1.0);
  }, [uniforms]);

  return (
    <mesh scale={SCALE}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicNodeMaterial
        key={import.meta.env.DEV ? Math.random() : undefined}
        side={BackSide}
        depthWrite={false}
        colorNode={colorNode}
        vertexNode={Fn(() => {
          const pos = modelViewProjection as ReturnType<typeof vec4>;
          pos.z.assign(pos.w);
          return pos;
        })()}
      />
    </mesh>
  );
};
