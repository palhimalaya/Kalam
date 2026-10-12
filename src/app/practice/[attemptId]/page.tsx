import { SessionRunner } from "@/components/SessionRunner";

export default async function PracticeSessionPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <SessionRunner attemptId={attemptId} kind="practice" />;
}
