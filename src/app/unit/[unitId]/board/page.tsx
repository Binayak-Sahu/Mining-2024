import { UNITS } from "@/content";
import { UnitBoard } from "@/components/pages/UnitBoard";

export function generateStaticParams() {
  return UNITS.map((u) => ({ unitId: u.id }));
}

/** §5.8 unit gameboard. */
export default async function UnitBoardPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  return <UnitBoard unitId={unitId} />;
}
