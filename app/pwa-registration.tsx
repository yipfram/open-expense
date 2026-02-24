"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("Service worker registration failed.", error);
      }
    });
  }, []);

  return null;
}
