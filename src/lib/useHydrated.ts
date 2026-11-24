"use client";

import { useEffect, useState } from "react";

/** True after the first client render — guards localStorage-backed UI against SSR mismatch. */
export function useHydrated(): boolean {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
