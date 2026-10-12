export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function duplicateFingerprint(stem: string, optionTexts: readonly string[]): string {
  const base = [normalizeText(stem), ...optionTexts.map(normalizeText).sort()].join("|");
  return fnv1a(base);
}

export function tokenSet(value: string): Set<string> {
  return new Set(normalizeText(value).split(" ").filter(Boolean));
}

export function jaccard(a: string, b: string): number {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (left.size === 0 && right.size === 0) return 1;
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  const union = left.size + right.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function isNearDuplicate(stemA: string, stemB: string, threshold = 0.9): boolean {
  return jaccard(stemA, stemB) >= threshold;
}
