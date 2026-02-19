"use client";

import { useEffect } from "react";

export function PerformanceGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const perf = window.performance;
    const originalMeasure = perf.measure.bind(perf);

    const guardedMeasure = ((...args: Parameters<Performance["measure"]>) => {
      try {
        return originalMeasure(...args);
      } catch (error) {
        if (error instanceof Error && error.message.includes("cannot have a negative time stamp")) {
          return undefined as unknown as PerformanceMeasure;
        }

        throw error;
      }
    }) as Performance["measure"];

    perf.measure = guardedMeasure;

    return () => {
      perf.measure = originalMeasure;
    };
  }, []);

  return null;
}
