import { stripHtml } from "./stripHtml";

const WORDS_PER_MINUTE = 200;

export function estimateReadTime(html: string): number {
  const text = stripHtml(html);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
