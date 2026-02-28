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
    octaves,
    lacunarity,
    diminish,
    amplitude,
  ]: FractNoiseArgs) => {
    const p = params.toVar();
    const n = float(0.0).toVar();
    const a = amplitude.toVar();

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

const random = vec4(Math.random(), Math.random(), Math.random(), Math.random());

export type CloudArgs = [
  useCellular: ConstNode<"bool", boolean>,
  useLiteCellular: ConstNode<"bool", boolean>,
  invertedCellular: ConstNode<"bool", boolean>,

  cloudScale: Node<"float">,
  cloudHorizon: Node<"vec2">,
  cloudDirection: Node<"float">,
  cloudSpeed: Node<"float">,
  cloudEvolution: Node<"float">,
  cloudCoverage: Node<"float">,
  cloudScaleRate: Node<"float">,
  cloudMix: Node<"float">,
  viewDirection: Node<"vec3">,
  zenithAngle: Node<"float">,
];

export const cloud = Fn(
  ([
    useCellular,
    useLiteCellular,
    invertedCellular,

    cloudScale,
    cloudHorizon,
    cloudDirection,
    cloudSpeed,
    cloudEvolution,
    cloudCoverage,
    cloudScaleRate,
    cloudMix,
    viewDirection,
    zenithAngle,
  ]: CloudArgs) => {
    const res = float(0.0).toVar();

    // TODO:
    // UVを外出しして、テクスチャ生成として万能にしたい
    // If文外す？

    If(viewDirection.y.greaterThan(0.0), () => {
      const elevation = 0.1;
      const cloudUV = viewDirection.xz
        .div(viewDirection.y.mul(elevation))
        .toVar();
      cloudUV.mulAssign(0.05);

      const dirRad = cloudDirection.mul(Math.PI / 180.0);
      const velocity = vec2(sin(dirRad).mul(-1.0), cos(dirRad)).mul(cloudSpeed);

      const offset = vec3(
        time.mul(velocity.x),
        time.mul(velocity.y),
        time.mul(cloudEvolution),
      );

      const octaves = 4;
      const lacunarity = 2;
      const diminish = 0.5;
      const amplitude = 1;
      const maxValue = (amplitude * (1 - diminish ** octaves)) / (1 - diminish);

      const noise1Params = vec3(cloudUV.mul(cloudScale), 0)
        .add(offset)
        .add(random.xyz);
      const noise2Params = vec3(cloudUV.mul(cloudScaleRate).mul(cloudScale), 0)
        .add(offset)
        .add(random.xyz);

      const noise1 = fractNoise3(
        false,
        false,

        noise1Params,
        octaves,
        lacunarity,
        diminish,
        amplitude,
      )
        .mul(0.5)
        .add(0.5);
      const noise2 = fractNoise3(
        useCellular,
        useLiteCellular,

        noise2Params,
        octaves,
        lacunarity,
        diminish,
        amplitude,
      ).toVar();
      if (useCellular.value) {
        noise2.divAssign(maxValue);
        if (invertedCellular.value) {
          noise2.assign(float(1).sub(noise2));
        }
      } else {
        noise2.assign(noise2.mul(0.5).add(0.5));
      }

      const cloudNoise = mix(noise1, noise2, cloudMix);
      const cloudMask = smoothstep(cloudCoverage, 1.0, cloudNoise).toVar();

      // Fade clouds near horizon based on elevation angle
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
