"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { familyOfPath } from "@/lib/family";

/**
 * Keeps <html data-family> in step with the route after client-side navigation (the first paint is handled by the inline
 * FAMILY_BOOT script in the layout). Because it sits on <html>, sheets, popovers and toasts in portals get the unit hue too.
 */
export function FamilyScope() {
  const path = usePathname();
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-family", familyOfPath(path));
  }, [path]);
  return null;
}
