import gsap from "gsap";

type TweenLike = gsap.core.Tween | gsap.core.Timeline;

export const serial = (...tweens: TweenLike[]) => {
  const tl = gsap.timeline();
  for (const tween of tweens) {
    tl.add(tween);
  }
  return tl;
};

export const parallel = (...tweens: TweenLike[]) => {
  return gsap.timeline().add(tweens);
};

import {
  Back,
  Bounce,
  Circ,
  Cubic,
  Elastic,
  Expo,
  Linear,
  Quad,
  Quart,
  Quint,
  Sine,
  Strong,
} from "gsap";

export const LinearEase = Linear.easeNone;

export const QuadIn = Quad.easeIn;
export const QuadOut = Quad.easeOut;
export const QuadInOut = Quad.easeInOut;

export const CubicIn = Cubic.easeIn;
export const CubicOut = Cubic.easeOut;
export const CubicInOut = Cubic.easeInOut;

export const QuartIn = Quart.easeIn;
export const QuartOut = Quart.easeOut;
export const QuartInOut = Quart.easeInOut;

export const QuintIn = Quint.easeIn;
export const QuintOut = Quint.easeOut;
export const QuintInOut = Quint.easeInOut;

export const StrongIn = Strong.easeIn;
export const StrongOut = Strong.easeOut;
export const StrongInOut = Strong.easeInOut;

export const SineIn = Sine.easeIn;
export const SineOut = Sine.easeOut;
export const SineInOut = Sine.easeInOut;

export const BackIn = Back.easeIn;
export const BackOut = Back.easeOut;
export const BackInOut = Back.easeInOut;

export const BounceIn = Bounce.easeIn;
export const BounceOut = Bounce.easeOut;
export const BounceInOut = Bounce.easeInOut;

export const CircIn = Circ.easeIn;
export const CircOut = Circ.easeOut;
export const CircInOut = Circ.easeInOut;

export const ElasticIn = Elastic.easeIn;
export const ElasticOut = Elastic.easeOut;
export const ElasticInOut = Elastic.easeInOut;

export const ExpoIn = Expo.easeIn;
export const ExpoOut = Expo.easeOut;
export const ExpoInOut = Expo.easeInOut;
