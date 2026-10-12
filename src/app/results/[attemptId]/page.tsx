import { ReviewView } from "@/components/ReviewView";

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <ReviewView attemptId={attemptId} />;
}
