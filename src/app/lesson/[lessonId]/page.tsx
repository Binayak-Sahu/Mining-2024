import { allLessons } from "@/content";
import { LessonPlayer } from "@/components/LessonPlayer";

export function generateStaticParams() {
  return allLessons().map((l) => ({ lessonId: l.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return <LessonPlayer lessonId={lessonId} />;
}
