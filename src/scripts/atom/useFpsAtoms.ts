import { atom, useStore } from "jotai";
import { useEffect, useMemo } from "react";

export const useFpsAtoms = () => {
  const store = useStore();
  const fpsAtom = useMemo(() => atom(60), []);
  const fpsStrAtom = useMemo(() => atom((get) => `${get(fpsAtom)}`), [fpsAtom]);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const tick = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;

      if (elapsed >= 500) {
        store.set(fpsAtom, Math.round((frameCount / elapsed) * 1000));
        frameCount = 0;
        lastTime = now;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [store, fpsAtom]);

  return { fps: fpsAtom, fpsStr: fpsStrAtom };
};
