// Closed list of icon names a roadmap tag may reference — kept separate
// from the actual lucide-react component map (components/roadmap/icons.ts)
// so server-only validation code (app/lib/actions/admin.ts) doesn't need to
// pull in lucide-react just to check a tag's icon name is one of these.
export const ROADMAP_TAG_ICON_NAMES = [
  "Medal",
  "Podium",
  "BadgeCheck",
  "Clock",
  "Sparkles",
  "Rocket",
  "Star",
  "Trophy",
  "Users",
  "BookOpen",
  "Globe",
  "Shield",
  "Zap",
] as const;
