import "server-only";

// THE DATA ACCESS LAYER for DiplomaPro. Pages, layouts and server actions
// import from here. Everything reads and writes Supabase as the signed-in
// student (RLS + the security-definer functions in supabase/migrations).
// docs/DATA_LAYER.md lists the table or function behind each export.

// Viewer, profile, subjects, onboarding, hints ─ users, exam_sessions, user_subjects
export {
  getViewer,
  getExamSession,
  setExamSession,
  getExamSessions,
  getUserSubjects,
  getUserSubject,
  getAllSubjects,
  setCoreSubjects,
  addExtraClass,
  removeExtraClass,
  CORE_SUBJECT_COUNT,
  needsOnboarding,
  getOnboardingSubjects,
  completeOnboarding,
  getPendingHints,
  hasDismissedHint,
  dismissHint,
  getGettingStarted,
  getThemePreference,
  setThemePreference,
  type ThemePreference,
  HINT_IDS,
  isCustomSubjectId,
  type SubjectChoice,
  type HintId,
  type OnboardingAnswers,
} from "./supabase/viewer";

// Calendar ─ hub_items (+ has_timer, kind, set_id)
export { getCalendarItems, getUpcomingItems, getNextTimedItem, scheduleSet, completeScheduledSet } from "./supabase/calendar";

// Strength map ─ topic_strength + the catalog's topic trees
export { getStrengthMap, getStrengthMaps } from "./supabase/strength";

// Practice ─ practice_sets, attempts, attempt_answers and their RPCs
export {
  getSet,
  getSetQuestions,
  saveSet,
  unsaveSet,
  renameSet,
  updateSet,
  rebuildSet,
  deleteSet,
  hasOpenAttempt,
  getSavedSets,
  shareSet,
  redeemShareCode,
  getSubjectsWithQuestions,
  previewSet,
  buildSet,
  createRedoSet,
  startOrResumeAttempt,
  saveAnswer,
  revealMarkscheme,
  finishAttempt,
  discardAttempt,
  confirmMarks,
  getAttemptResult,
  getRecentSessions,
  getPastSets,
} from "./supabase/practice";

// Suggestions and Bro's brief ─ rules over real data until DiplomaBro (phase 7)
export { getSuggestions } from "./supabase/suggestions";
export { getBroBrief } from "./supabase/brief";

// Leaderboard (practice points)
export { getLeaderboard, getMyStanding, getAttemptPoints, setLeaderboardHidden } from "./supabase/leaderboard";

// Pro waitlist ─ pro_waitlist (closed table; join_pro_waitlist, on_pro_waitlist)
export { joinProWaitlist, onProWaitlist } from "./supabase/waitlist";

// Subject requests ─ subject_requests (request_subject, my_subject_requests)
export { requestSubject, getMySubjectRequests, subjectRequestKey } from "./supabase/requests";

// Usage and stats
export { getUsage } from "./supabase/usage";
export { getPracticeStats } from "./supabase/stats";

// Catalog ─ lib/catalog (the source the subjects/topics seed is generated from)
export { subjectById as getSubject, topicTree as getTopicTree } from "@/lib/catalog";

export { NotSignedInError } from "./supabase/client";
