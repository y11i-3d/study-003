/**
 * @see https://github.com/mrdoob/three.js/blob/master/examples/jsm/objects/SkyMesh.js
 * */

import {
  Fn,
  add,
  clamp,
  cos,
  dot,
  exp,
  float,
  mix,
  mul,
  pow,
  smoothstep,
  sub,
  vec3,
  vec4,
} from "three/tsl";
import { Vector3, type Node } from "three/webgpu";

// Workaround: TSL 'exp' and 'pow' types currently lack vector overloads.
// Using 'any' to allow component-wise operations and maintain GLSL parity.

// ------------------------------  buildSkyConfig
export type BuildSkyConfig = {
  sunDirection1: Vector3;
  sunDirection2: Vector3;
  sunE1: number;
  sunE2: number;
  betaR1: Vector3;
  betaR2: Vector3;
  sunfade: number;
  betaM: Vector3;
};

export type buildSkyConfigParams = {
  sunElevation1: number;
  sunElevation2: number;
  sunAzimuth: number;
  haze: number;
  skyDensity: number;
  skyBlue: number;
};

const getDirection = (elevationDeg: number, azimuthDeg: number): Vector3 => {
  const elRad = (elevationDeg * Math.PI) / 180;
  const azRad = (azimuthDeg * Math.PI) / 180;
  return new Vector3(
    Math.cos(elRad) * Math.cos(azRad),
    Math.sin(elRad),
    Math.cos(elRad) * Math.sin(azRad),
  ).normalize();
};

const buildSunConfig = (
  sunDirection: Vector3,
  rayleigh: number,
  skyBlue: number,
  cutoffAngle: number,
  steepness: number,
  EE: number,
) => {
  const zenithAngleCos = Math.max(-1, Math.min(1, sunDirection.y));
  const sunE =
    EE *
    Math.max(
      0,
      1 -
        Math.pow(
          Math.E,
          -(cutoffAngle - Math.acos(zenithAngleCos)) / steepness,
        ),
    );
  const sunfade =
    1 - Math.max(0, Math.min(1, 1 - Math.exp(sunDirection.y / 0.4)));
  const rayleighCoefficient = Math.max(0, rayleigh - (1.0 - sunfade));
  const betaR = new Vector3(
    5.804542996261093e-6 * Math.max(0, 1 - skyBlue * 0.5),
    1.3562911419845635e-5,
    3.0265902468824876e-5 * (1 + skyBlue * 2.0),
  ).multiplyScalar(rayleighCoefficient);
  return { sunE, sunfade, betaR };
};

export const buildSkyConfig = ({
  sunElevation1,
  sunElevation2,
  sunAzimuth,
  haze,
  skyDensity: rayleigh,
  skyBlue,
}: buildSkyConfigParams): BuildSkyConfig => {
  const sunDirection1 = getDirection(sunElevation1, sunAzimuth);
  const sunDirection2 = getDirection(sunElevation2, sunAzimuth);

  const twilightAngle = -5;
  const cutoffAngle = ((90 - twilightAngle) * Math.PI) / 180;
  const steepness = 1.5;
  const EE = 1000.0;

  const sun1 = buildSunConfig(
    sunDirection1,
    rayleigh,
    skyBlue,
    cutoffAngle,
    steepness,
    EE,
  );
  const sun2 = buildSunConfig(
    sunDirection2,
    rayleigh,
    0,
    cutoffAngle,
    steepness,
    EE,
  );

  // ---------- Common
  const betaM = new Vector3(
    1.8399918514433978e14,
    2.7798023919660528e14,
    4.0790479543861094e14,
  );
  const c = 0.2 * 10e-18 * 0.434;
  betaM.multiplyScalar(c * haze * haze * 2);

  return {
    sunDirection1,
    sunDirection2,
    sunE1: sun1.sunE,
    sunE2: sun2.sunE,
    betaR1: sun1.betaR,
    betaR2: sun2.betaR,
    sunfade: sun1.sunfade,
    betaM,
  };
};

// ------------------------------ skyColor

const calcBetaMTheta = Fn(
  ([direction, sunDirection, betaM, mieDirectionalG]: [
    Node<"vec3">,
    Node<"vec3">,
    Node<"vec3">,
    Node<"float">,
  ]) => {
    const ONE_OVER_FOURPI = float(1 / (4 * Math.PI));
    const cosTheta = dot(direction, sunDirection);
    const g2 = pow(mieDirectionalG, 2.0);
    const inv = float(1.0).div(
      pow(
        float(1.0).sub(float(2.0).mul(mieDirectionalG).mul(cosTheta)).add(g2),
        1.5,
      ),
    );
    const mPhase = ONE_OVER_FOURPI.mul(float(1.0).sub(g2)).mul(inv);
    return betaM.mul(mPhase);
  },
);

const calcBetaRTheta = Fn(
  ([direction, sunDirection, betaR]: [
    Node<"vec3">,
    Node<"vec3">,
    Node<"vec3">,
  ]) => {
    const THREE_OVER_SIXTEENPI = float(3 / (16 * Math.PI));
    const cosTheta = dot(direction, sunDirection);
    const c = cosTheta.mul(0.5).add(0.5);
    const rPhase = THREE_OVER_SIXTEENPI.mul(float(1.0).add(pow(c, 2.0)));
    return betaR.mul(rPhase);
  },
);

// Note: skyColor is a plain TS function rather than Fn() because it needs to
// return multiple nodes as an object. As a consequence, assign()/mulAssign()
// cannot be used here.
export const skyColor = (
  sunDirection1: Node<"vec3">,
  sunDirection2: Node<"vec3">,
  sunE1: Node<"float">,
  sunE2: Node<"float">,
  sunfade: Node<"float">,
  betaR1: Node<"vec3">,
  betaR2: Node<"vec3">,
  betaM: Node<"vec3">,
  mieDirectionalG: Node<"float">,
  viewDirection: Node<"vec3">,
  zenithAngle: Node<"float">,
) => {
  const up = vec3(0, 1, 0);
  const pi = float(Math.PI);

  const rayleighZenithLength = float(8.4e3);
  const mieZenithLength = float(1.25e3);

  const inverse = float(1.0).div(
    cos(zenithAngle).add(
      float(0.15).mul(
        pow(float(93.885).sub(zenithAngle.mul(180.0).div(pi)), -1.253),
      ),
    ),
  );
  const sR = rayleighZenithLength.mul(inverse);
  const sM = mieZenithLength.mul(inverse);

  // Sun1
  const betaR1Theta = calcBetaRTheta(viewDirection, sunDirection1, betaR1);
  const betaM1Theta = calcBetaMTheta(
    viewDirection,
    sunDirection1,
    betaM,
    mieDirectionalG,
  );

  // Sun2
  const Fex = exp(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mul(betaR2, sR).add(mul(betaM, sM)).negate() as any,
  ) as unknown as Node<"vec3">;
  const betaR2Theta = calcBetaRTheta(viewDirection, sunDirection2, betaR2);

  const blendFactor = smoothstep(0.0, 0.1, dot(up, viewDirection));
  const effectiveBetaR = mix(betaR2, betaR1, blendFactor);
  const effectiveBetaRTheta = mix(betaR2Theta, betaR1Theta, blendFactor);

  const Lin = pow(
    sunE1
      .mul(
        add(effectiveBetaRTheta, betaM1Theta).div(add(effectiveBetaR, betaM)),
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mul(sub(1.0, Fex)) as any,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vec3(1.5) as any,
  ) as unknown as Node<"vec3">;

  // sunset
  const sunsetBase = pow(
    sunE2
      .mul(add(betaR2Theta, betaM1Theta).div(add(betaR2, betaM)))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mul(Fex) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vec3(1.0 / 2.0) as any,
  ) as unknown as Node<"vec3">;

  const sunset = mix(
    vec3(1.0),
    sunsetBase,
    clamp(pow(sub(1.0, dot(up, sunDirection2)), 5.0), 0.0, 1.0),
  );

  const lum = dot(Lin, vec3(0.2126, 0.7152, 0.0722));
  const sunHeight = sunDirection1.y.clamp(0.0, 0.4).div(0.4);
  const dynamicTint = mix(vec3(1.0, 0.5, 0.1), vec3(1.0), sunHeight);
  const Orange = dynamicTint.mul(lum);

  const LinSunset = Lin.mul(sunset);

  // nightsky
  const nightsky = vec3(0.1).mul(Fex);

  // final composition
  const texColor = add(LinSunset, nightsky)
    .mul(0.04)
    .add(vec3(0.0, 0.0003, 0.00075));

  const retColor = pow(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    texColor as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vec3(float(1.0).div(float(1.2).add(sunfade.mul(1.2)))) as any,
  ) as unknown as Node<"vec3">;

  return {
    sky: vec4(retColor, 1.0),
    Orange,
    Lin,
  };
};
