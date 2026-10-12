import { SessionRunner } from "@/components/SessionRunner";

export default async function MockSessionPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <SessionRunner attemptId={attemptId} kind="mock" />;
}
