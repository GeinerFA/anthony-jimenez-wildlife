"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    // reducedMotion="user": todas las animaciones de motion respetan la preferencia del sistema.
    <MotionConfig reducedMotion="user">
      {reduceMotion ? children : (
        <ReactLenis root options={{ lerp: 0.1, wheelMultiplier: 1 }}>
          {children}
        </ReactLenis>
      )}
    </MotionConfig>
  );
}
