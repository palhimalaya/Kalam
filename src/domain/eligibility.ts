import type { Question, ReviewStatus, RightsStatus } from "@/domain/types";

const ELIGIBLE_STATUSES: ReadonlySet<ReviewStatus> = new Set(["verified", "live"]);

export function isPracticeEligible(question: Pick<Question, "reviewStatus" | "rightsStatus">): boolean {
  return ELIGIBLE_STATUSES.has(question.reviewStatus) && question.rightsStatus !== "restricted";
}

export function eligibilityBlockReason(status: ReviewStatus, rights: RightsStatus): string | null {
  if (rights === "restricted") return "Restricted rights keep this question out of practice and mocks.";
  if (!ELIGIBLE_STATUSES.has(status)) {
    return "Only verified or live questions can appear in practice and mocks.";
  }
  return null;
}
