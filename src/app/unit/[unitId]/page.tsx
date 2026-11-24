import { UNITS } from "@/content";
import { UnitMap } from "@/components/pages/UnitMap";

export function generateStaticParams() {
  return UNITS.map((u) => ({ unitId: u.id }));
}

export default async function UnitPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  return <UnitMap unitId={unitId} />;
}
