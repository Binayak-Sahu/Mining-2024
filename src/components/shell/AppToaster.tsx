"use client";

import { Toaster } from "sonner";
import { usePrefs, resolveDark } from "@/lib/prefs";
import { useHydrated } from "@/lib/useHydrated";

/** Global sonner toaster, themed with the app and placed clear of the phone tab bar. */
export function AppToaster() {
  const hydrated = useHydrated();
  const theme = usePrefs((p) => p.theme);
  const dark = hydrated && resolveDark(theme);
  return (
    <Toaster
      theme={dark ? "dark" : "light"}
      position="top-center"
      offset={72}
      mobileOffset={{ top: 64 }}
      toastOptions={{ style: { borderRadius: 16, fontFamily: "var(--font-sans)", fontSize: 15, background: "var(--surface-2)", color: "var(--text)", border: "2px solid var(--line)", boxShadow: "var(--sheet-shadow)" } }}
    />
  );
}
