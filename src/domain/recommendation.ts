export interface RecommendationInput {
  code: string;
  title: string;
  marks: number;
  accuracy: number | null;
  answered: number;
  lastPractisedAt: string | null;
}

export interface Recommendation {
  code: string;
  title: string;
  priority: number;
  reasons: string[];
}

function recencyFactor(lastPractisedAt: string | null, now: Date): { factor: number; reason: string } {
  if (!lastPractisedAt) return { factor: 1.2, reason: "it has not been practised yet" };
  const days = (now.getTime() - new Date(lastPractisedAt).getTime()) / 86_400_000;
  if (days <= 3) return { factor: 0.8, reason: "it was practised in the last 3 days" };
  if (days >= 14) return { factor: 1.1, reason: "it has not been practised for at least 14 days" };
  return { factor: 1, reason: "it was practised recently enough to keep a normal priority" };
}

export function recommendTopics(
  topics: readonly RecommendationInput[],
  targetAccuracyPercent: number,
  now: Date,
): Recommendation[] {
  const target = targetAccuracyPercent / 100;
  return topics
    .map((topic) => {
      const accuracy = topic.accuracy ?? 0;
      const gap = Math.max(0, target - accuracy);
      const recency = recencyFactor(topic.lastPractisedAt, now);
      const priority = topic.marks * gap * recency.factor;
      const accuracyText =
        topic.accuracy === null ? "no scored answers yet" : `${Math.round(topic.accuracy * 100)}% accuracy from ${topic.answered} scored answers`;
      const reasons = [
        `${topic.title} is worth ${topic.marks} marks on the proposed paper.`,
        `Current result: ${accuracyText}. Target accuracy is ${targetAccuracyPercent}%.`,
        `Recency factor is ${recency.factor} because ${recency.reason}.`,
        "Priority = topic marks × (target accuracy − current accuracy) × recency factor.",
      ];
      if (topic.answered < 10) {
        reasons.push("The mastery label stays “Not enough data” until this topic has 10 scored answers.");
      }
      return { code: topic.code, title: topic.title, priority, reasons };
    })
    .filter((item) => item.priority > 0)
    .sort((a, b) => b.priority - a.priority || a.code.localeCompare(b.code));
}
