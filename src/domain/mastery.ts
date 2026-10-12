import { MIN_MASTERY_SAMPLE, type MasteryLabel } from "@/domain/types";

export function masteryLabel(correct: number, answered: number, minimum = MIN_MASTERY_SAMPLE): MasteryLabel {
  if (answered < minimum) return "Not enough data";
  const percent = (correct / answered) * 100;
  if (percent < 50) return "Weak";
  if (percent < 70) return "Improving";
  if (percent < 85) return "Strong";
  return "Mastered";
}
