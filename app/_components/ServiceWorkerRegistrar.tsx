"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount.
 * Rendered once in the root layout.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration failed — notifications will still
        // work via the Notification constructor fallback.
      });
    }
  }, []);

  return null;
}
