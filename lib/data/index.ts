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
  getDismissedHints,
  setSubjectLevel,
  hasDismissedHint,
  dismissHint,
  getGettingStarted,
  getThemePreference,
  setThemePreference,
  getAppearancePreference,
  setAppearancePreference,
  type ThemePreference,
  HINT_IDS,
  isCustomSubjectId,
  type SubjectChoice,
  type HintId,
  type OnboardingAnswers,
} from "./supabase/viewer";

// DiplomaPro access ─ entitlements, users.is_pro / pro_expires_at
export { getProStatus, requirePro, setProBadgeHidden, ProRequiredError, type ProStatus, type ProPlan } from "./supabase/pro";

// Calendar ─ hub_items (+ has_timer, kind, set_id)
export { getCalendarItems, getUpcomingItems, getNextTimedItem, scheduleSet, completeScheduledSet, addHubItems } from "./supabase/calendar";

// Strength map ─ topic_strength + the catalog's topic trees
export { getStrengthMap, getStrengthMaps, getWeakestTopics, type WeakTopic } from "./supabase/strength";

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
  getInstantMcqKeys,
  finishAttempt,
  discardAttempt,
  confirmMarks,
  getAttemptResult,
  getRecentSessions,
  getPastSets,
} from "./supabase/practice";

// Sharing codes ─ share_codes, share_code_redemptions; create_share_code, redeem_code (migration 32); sharing stats + referral week (33)
export { createShareCode, createHubSetCode, redeemCode, getMyCodes, getShareCodeFor, getSharingStats, claimShareReward, getPublicShareUses, type MyCode, type SharingStats } from "./supabase/codes";

// Suggestions and Bro's brief ─ rules over real data until DiplomaBro (phase 7)
export { getSuggestions } from "./supabase/suggestions";
export { getBroBrief } from "./supabase/brief";

// Leaderboard (practice points)
export { getLeaderboard, getMyStanding, getAttemptPoints, setLeaderboardHidden, getContributionBoard, getMyContribution } from "./supabase/leaderboard";

// Pro waitlist ─ pro_waitlist (closed table; join_pro_waitlist, on_pro_waitlist)
export { joinProWaitlist, onProWaitlist } from "./supabase/waitlist";

// Subject requests ─ subject_requests (request_subject, my_subject_requests)
export { requestSubject, getMySubjectRequests, subjectRequestKey } from "./supabase/requests";

// Usage and stats
export { getUsage, consumeUsage, type UsageResult } from "./supabase/usage";
export { getPracticeStats } from "./supabase/stats";

// Catalog ─ lib/catalog (the source the subjects/topics seed is generated from)
export { subjectById as getSubject, topicTree as getTopicTree } from "@/lib/catalog";

export { NotSignedInError } from "./supabase/client";

// DiplomaBro ─ bro_messages (migration 37; writes only in app/api/bro/chat), bro_flags + flag_bro_message (38)
export { getBroHistory, getBroConversations, getAttemptConversationId, getConversationAttempt, deleteBroConversation, flagBroMessage, type BroMessage, type BroConversation, type BroFlagReason } from "./supabase/bro";
// DiplomaBro memory ─ bro_memory (migration 39); writes go through checkMemory (lib/bro/memory-rules.ts)
export { getBroMemory, updateBroMemory, deleteBroMemory, clearBroMemory, type BroMemoryItem, type MemoryWrite } from "./supabase/bro-memory";
// Progress ─ student_results (migration 41): results students log, "How did it go?" for past Hub tests
export { getResults, addResult, updateResult, deleteResult, getTestsToLog, getPracticeProgress, getBoundaryOverrides, setBoundaryOverride, type ResultWrite, type PastTest, type PracticeSubject } from "./supabase/results";

// Sunday Reset ─ weekly_resets (migration 50)
export { getWeeklyReset, markWeeklyReset, getDoneWeeks } from "./supabase/reset";
export type { WeeklyReset, ResetSession, LostTopic } from "./supabase/reset";

// Squads and marks won back ─ squads, squad_members (migrations 51–52)
export { getMarksWonBack, getMySquads, getSquadBoard, getSquadsFortyFiveToday, getSquadShelf, shareToSquad, shareResourceToSquad, removeSquadShare, createSquad, joinSquad, leaveSquad, removeSquadMember, renameSquad, newSquadCode } from "./supabase/squads";
export type { MarksWonBack, SquadSummary, SquadMember, SquadBoard, SquadPeriod, SquadFortyFive, JoinSquadResult, ShelfItem } from "./supabase/squads";
