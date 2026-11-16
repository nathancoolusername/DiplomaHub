// The single list of DiplomaPro feature keys and limits. Server checks
// (consume_quota), the UsageBanner and Pro badges all read from here.
//
// Practice from the question bank is free with no limit (it costs nothing to
// run); the Pro caps are PLACEHOLDER NUMBERS until there's API cost data.

export type FeatureKey =
  | "written_questions"
  | "mcq"
  | "rule_suggestions"
  | "bro_suggestions"
  | "bro_explain"
  | "bro_chat"
  | "bro_auto_fill"
  | "short_answer_review"
  | "essay_review"
  | "photo_marking"
  | "generate_more"
  | "scheduling"
  | "midnight_theme"
  | "backgrounds";

type Access = { allowed: false } | { allowed: true; limit: number | null; period: "week" | "month" | null };

export type FeaturePlan = {
  label: string;
  free: Access;
  pro: Access;
};

const unlimited: Access = { allowed: true, limit: null, period: null };
const no: Access = { allowed: false };

export const FEATURES: Record<FeatureKey, FeaturePlan> = {
  written_questions: { label: "Written questions", free: unlimited, pro: unlimited },
  mcq: { label: "Multiple choice", free: unlimited, pro: unlimited },
  rule_suggestions: { label: "Suggestions", free: unlimited, pro: unlimited },
  bro_suggestions: { label: "Bro suggestions", free: no, pro: unlimited },
  bro_explain: { label: "Explanations", free: no, pro: { allowed: true, limit: 100, period: "month" } },
  bro_chat: { label: "Bro chat", free: no, pro: { allowed: true, limit: 200, period: "month" } },
  bro_auto_fill: { label: "Auto sets", free: no, pro: { allowed: true, limit: 60, period: "month" } },
  short_answer_review: { label: "Answer checks", free: no, pro: { allowed: true, limit: 40, period: "month" } },
  essay_review: { label: "Essay reviews", free: no, pro: { allowed: true, limit: 8, period: "month" } },
  photo_marking: { label: "Photo marking", free: no, pro: { allowed: true, limit: 10, period: "month" } },
  generate_more: { label: "Generate more", free: no, pro: { allowed: true, limit: 5, period: "month" } },
  scheduling: { label: "Scheduling", free: no, pro: unlimited },
  midnight_theme: { label: "Midnight theme", free: no, pro: unlimited },
  backgrounds: { label: "Backgrounds", free: no, pro: unlimited },
};

/**
 * DiplomaPro is "coming soon": nobody has Pro yet (the viewer's isPro is
 * forced off), every Pro feature points at the /pro waitlist, and the few
 * things below are free to everyone until Pro launches. Set
 * NEXT_PUBLIC_PRO_COMING_SOON=false (e.g. in .env.local) to test the real
 * Pro features; remove this flag and FREE_WHILE_COMING_SOON at launch.
 */
export const PRO_COMING_SOON = process.env.NEXT_PUBLIC_PRO_COMING_SOON !== "false";

/**
 * Free for now: Midnight. On launch day (the flag above set to false) it
 * becomes Pro only: the picker locks it and ThemePreferenceSync moves anyone
 * without Pro to Dark. Run supabase/launch/midnight_pro.sql the same day.
 */
const FREE_WHILE_COMING_SOON: FeatureKey[] = ["midnight_theme", "backgrounds"];

/** Capped features worth showing in the UsageBanner, in display order. */
export const BANNER_FEATURES: Record<"free" | "pro", FeatureKey[]> = {
  free: [],
  pro: ["essay_review", "photo_marking", "bro_explain", "generate_more"],
};

/**
 * Daily caps, counted per UTC day in usage_counters by dp_consume_usage()
 * (migration 31; lib/data/supabase/usage.ts → consumeUsage). null means no
 * cap (still counted). PLACEHOLDER NUMBERS until there's API cost data.
 */
export type UsageMetric = "bro_message" | "opus_escalation" | "generated_question";

export const DAILY_CAPS: Record<UsageMetric, { free: number | null; pro: number | null }> = {
  bro_message: { free: 10, pro: 150 },
  opus_escalation: { free: 0, pro: 10 },
  generated_question: { free: 3, pro: 40 },
};

/** The day's cap for this student. The admin's unlimited plan has none. */
export function dailyCap(metric: UsageMetric, plan: { isPro: boolean; unlimited?: boolean }): number | null {
  if (plan.unlimited) return null;
  return plan.isPro ? DAILY_CAPS[metric].pro : DAILY_CAPS[metric].free;
}

export function access(feature: FeatureKey, isPro: boolean): Access {
  if (PRO_COMING_SOON && FREE_WHILE_COMING_SOON.includes(feature)) return unlimited;
  return isPro ? FEATURES[feature].pro : FEATURES[feature].free;
}

export function isProFeature(feature: FeatureKey): boolean {
  return !access(feature, false).allowed && FEATURES[feature].pro.allowed;
}
