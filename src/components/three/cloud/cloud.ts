import type { FnArgs } from "@/scripts/tsl/types";
import {
  cellularNoise3_2x2x2,
  cellularNoise3_3x3x3,
} from "@y11i-3d/tsl-cellular-noise";
import { psrdNoise3 } from "@y11i-3d/tsl-psrdnoise";
import {
  cos,
  float,
  Fn,
  If,
  Loop,
  mix,
  pow,
  sin,
  smoothstep,
  time,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import type { ConstNode, Node } from "three/webgpu";

export type FractNoiseArgs = [
  useCellular: ConstNode<"bool", boolean>,
  useLiteCellular: ConstNode<"bool", boolean>,

  params: Node<"vec3">,
  beginOctave: Node<"int">,
  octaves: Node<"int">,
  lacunarity: Node<"float">,
  diminish: Node<"float">,
  amplitude: Node<"float">,
];

const fractNoise3 = Fn(
  ([
    useCellular,
    useLiteCellular,
    params,
    beginOctave,
    octaves,
    lacunarity,
    diminish,
    amplitude,
  ]: FractNoiseArgs) => {
    const initialPower = float(beginOctave.sub(1));
    const p = params.mul(pow(lacunarity, initialPower)).toVar();
    const a = amplitude.mul(pow(diminish, initialPower)).toVar();
    const n = float(0.0).toVar();

    if (useCellular.value) {
      if (useLiteCellular.value) {
        Loop(octaves as unknown as number, () => {
          n.addAssign(a.mul(cellularNoise3_2x2x2(p)));
          a.mulAssign(diminish);
          p.mulAssign(lacunarity);
        });
      } else {
        Loop(octaves as unknown as number, () => {
          n.addAssign(a.mul(cellularNoise3_3x3x3(p)));
          a.mulAssign(diminish);
          p.mulAssign(lacunarity);
        });
      }
    } else {
      Loop(octaves as unknown as number, () => {
        n.addAssign(a.mul(psrdNoise3(p)));
        a.mulAssign(diminish);
        p.mulAssign(lacunarity);
      });
    }

    return n;
  },
) as unknown as (...args: FnArgs<FractNoiseArgs>) => Node<"float">;

// const random = vec4(Math.random(), Math.random(), Math.random(), Math.random());
const random = vec4(0, 0, 0, 0);

// Shared cloud UV and offset computation
const cloudLacunarity = 2;
const cloudDiminish = 0.5;
const cloudAmplitude = 1;

// ------------------------------------------------------------------ cloudUVOffset

export type CloudUVOffsetArgs = [
  cloudDirection: Node<"float">,
  cloudSpeed: Node<"float">,
  cloudEvolution: Node<"float">,
  viewDirection: Node<"vec3">,
];

export type CloudUVOffsetResult = {
  cloudUV: Node<"vec2">;
  offset: Node<"vec3">;
};

export const cloudUVOffset = (
  cloudDirection: Node<"float">,
  cloudSpeed: Node<"float">,
  cloudEvolution: Node<"float">,
  viewDirection: Node<"vec3">,
): CloudUVOffsetResult => {
  const elevation = 0.1;
  const cloudUV = viewDirection.xz
    .div(viewDirection.y.mul(elevation))
    .mul(0.05)
    .toVar() as unknown as Node<"vec2">;

  const dirRad = cloudDirection.mul(Math.PI / 180.0);
  const velocity = vec2(sin(dirRad).mul(-1.0), cos(dirRad)).mul(cloudSpeed);

  const offset = vec3(
    time.mul(velocity.x),
    time.mul(velocity.y),
    time.mul(cloudEvolution),
  ) as unknown as Node<"vec3">;

  return { cloudUV, offset };
};

// ------------------------------------------------------------------ cloudNoise

export type CloudNoiseArgs = [
  useCellular: ConstNode<"bool", boolean>,
  useLiteCellular: ConstNode<"bool", boolean>,

  cloudScale: Node<"float">,
  cloudScaleRate: Node<"float">,
  cloudDirection: Node<"float">,
  cloudSpeed: Node<"float">,
  cloudEvolution: Node<"float">,
  beginOctave: Node<"int">,
  octaves: Node<"int">,
  viewDirection: Node<"vec3">,
];

export const cloudNoise = Fn(
  ([
    useCellular,
    useLiteCellular,
    cloudScale,
    cloudScaleRate,
    cloudDirection,
    cloudSpeed,
    cloudEvolution,
    beginOctave,
    octaves,
    viewDirection,
  ]: CloudNoiseArgs) => {
    const res = vec2(0.0, 0.0).toVar();

    If(viewDirection.y.greaterThan(0.0), () => {
      const { cloudUV, offset } = cloudUVOffset(
        cloudDirection,
        cloudSpeed,
        cloudEvolution,
        viewDirection,
      );

      const noise1Params = vec3(cloudUV.mul(cloudScale), 0)
        .add(offset)
        .add(random.xyz);
      const noise2Params = vec3(cloudUV.mul(cloudScaleRate).mul(cloudScale), 0)
        .add(offset)
        .add(random.xyz);

      const n1 = fractNoise3(
        false,
        false,
        noise1Params,
        beginOctave,
        octaves,
        cloudLacunarity,
        cloudDiminish,
        cloudAmplitude,
      );
      const n2 = fractNoise3(
        useCellular,
        useLiteCellular,
        noise2Params,
        beginOctave,
        octaves,
        cloudLacunarity,
        cloudDiminish,
        cloudAmplitude,
      );

      res.assign(vec2(n1, n2));
    });

    return res;
  },
) as (...args: FnArgs<CloudNoiseArgs>) => Node<"vec2">;

// ------------------------------------------------------------------ cloud

export type CloudArgs = [
  useCellular: ConstNode<"bool", boolean>,
  invertedCellular: ConstNode<"bool", boolean>,

  cloudHorizon: Node<"vec2">,
  cloudCoverage: Node<"float">,
  cloudMix: Node<"float">,
  cloudMaxValue: Node<"float">,
  viewDirection: Node<"vec3">,
  zenithAngle: Node<"float">,
  layerNoise: Node<"vec4">,
];

export const cloud = Fn(
  ([
    useCellular,
    invertedCellular,

    cloudHorizon,
    cloudCoverage,
    cloudMix,
    cloudMaxValue,
    viewDirection,
    zenithAngle,
    layerNoise,
  ]: CloudArgs) => {
    const res = float(0.0).toVar();

    If(viewDirection.y.greaterThan(0.0), () => {
      const noise1 = layerNoise.x.mul(0.5).add(0.5);

      const noise2 = layerNoise.y.toVar();
      if (useCellular.value) {
        noise2.divAssign(cloudMaxValue);
        if (invertedCellular.value) {
          noise2.assign(float(1).sub(noise2));
        }
      } else {
        noise2.assign(noise2.mul(0.5).add(0.5));
      }

      const cloudNoise = mix(noise1, noise2, cloudMix);
      const cloudMask = smoothstep(cloudCoverage, 1.0, cloudNoise).toVar();

      const elevationAngle = float(Math.PI / 2.0).sub(zenithAngle);
      const horizonFade = smoothstep(
        cloudHorizon.x,
        cloudHorizon.y,
        elevationAngle,
      );
      cloudMask.mulAssign(horizonFade);

      res.assign(cloudMask);
    });

    return res;
  },
) as (...args: FnArgs<CloudArgs>) => Node<"float">;
