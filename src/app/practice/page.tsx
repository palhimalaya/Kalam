import { Suspense } from "react";
import { PracticeSetup } from "@/components/PracticeSetup";

export default function PracticePage() {
  return (
    <Suspense fallback={<p role="status">Loading practice…</p>}>
      <PracticeSetup />
    </Suspense>
  );
}
