import { Suspense } from "react";
import { SimLab } from "@/components/pages/SimLab";

export const metadata = { title: "Sim Lab — STRATA" };

export default function LabPage() {
  return (
    <Suspense fallback={null}>
      <SimLab />
    </Suspense>
  );
}
