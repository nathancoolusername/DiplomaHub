import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { CriteriaSet } from "./criteria";
import { MODERATION_TASK, REVIEW_MODEL, REVIEW_SYSTEM, reviewTask, type ReviewInput } from "./prompt";
import { REPORT_SCHEMA, sanitizeReport, type Report } from "./report";

// The marking itself, with no database: one PDF in, a report out. Used by the
// review pipeline (run.ts) and by scripts/review/run-samples.mts.

export type Tokens = { input: number; output: number; cacheRead: number; cacheWrite: number };

let client: Anthropic | null = null;
export const anthropic = () =>
  (client ??= new Anthropic(process.env.ANTHROPIC_WORKSPACE_ID ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } } : {}));

export function addUsage(t: Tokens, u: Anthropic.Beta.BetaUsage | Anthropic.Usage): void {
  t.input += u.input_tokens ?? 0;
  t.output += u.output_tokens ?? 0;
  t.cacheRead += u.cache_read_input_tokens ?? 0;
  t.cacheWrite += u.cache_creation_input_tokens ?? 0;
}

function textOf(msg: Anthropic.Beta.BetaMessage | Anthropic.Message): string {
  return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

/**
 * Marks a PDF (base64) against a criteria set: a first marking at high effort,
 * then a moderation pass that re-checks it. Both passes start with the same
 * system prompt, document and task, so the second reads them from the cache.
 */
export async function markPdf(pdf: string, set: CriteriaSet, input: ReviewInput, tokens: Tokens): Promise<{ report: Report; first: Report }> {
  const shared: Anthropic.Beta.BetaContentBlockParam[] = [
    { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf }, title: "Student's work" },
    { type: "text", text: await reviewTask(set, input), cache_control: { type: "ephemeral" } },
  ];

  const run = async (extra: string | null, effort: "high" | "medium") => {
    const stream = anthropic().beta.messages.stream({
      model: REVIEW_MODEL,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      max_tokens: 32000,
      output_config: { effort, format: { type: "json_schema", schema: REPORT_SCHEMA as unknown as Record<string, unknown> } },
      system: [{ type: "text", text: REVIEW_SYSTEM, cache_control: { type: "ephemeral", ttl: "1h" } }],
      messages: [{ role: "user", content: extra ? [...shared, { type: "text", text: extra }] : shared }],
    });
    const msg = await stream.finalMessage();
    addUsage(tokens, msg.usage);
    if (msg.stop_reason === "refusal") throw new Error("The review couldn't be completed for this file");
    if (msg.stop_reason === "max_tokens") throw new Error("The review ran too long");
    return JSON.parse(textOf(msg)) as Report;
  };

  const first = await run(null, "high");
  const final = await run(MODERATION_TASK + JSON.stringify(first), "medium");
  const maxById = Object.fromEntries(set.criteria.map((c) => [c.id, c.max]));
  const report = sanitizeReport(final, maxById);
  if (report.criteria.length !== set.criteria.length) throw new Error("The review missed a criterion");
  return { report, first };
}
