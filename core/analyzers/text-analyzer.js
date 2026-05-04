import { cleanText, getSubjectDefaults } from "../utils/text-utils.js";

export function extractKeywords(text, fallbackSubject) {
  const cleaned = cleanText(text);
  const counts = new Map();

  cleaned.forEach((word) => {
    counts.set(word, (counts.get(word) || 0) + 1);
  });

  const keywords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([word]) => word);

  if (keywords.length >= 4) return keywords;

  return getSubjectDefaults(fallbackSubject);
}
