// Links Bro may put in a reply. Bro writes ordinary Markdown links to
// DiplomaHub pages; the chat renders the ones that match a real page as
// button chips, and anything else as plain text, so a reply can never
// carry a broken or outside link. Keep SUBJECT_IDS in step with
// lib/catalog/subjects.json (the catalog is too big to ship to the bar).

const SUBJECT_IDS = new Set([
  "english_a_lit", "english_a_langlit", "english_b", "french_a_lit", "french_a_langlit", "french_b",
  "german_a_lit", "german_a_langlit", "german_b", "spanish_a_lit", "spanish_a_langlit", "spanish_b",
  "math_aa", "physics", "chemistry", "economics", "math_ai", "history", "geography", "cs", "biology",
  "business", "psychology", "philosophy", "ess", "sport_science", "theatre",
]);

const FIXED = new Set(["/practice", "/practice/sets", "/hub", "/progress", "/bro", "/bro/memory", "/codes", "/leaderboard", "/forty-five", "/resources"]);
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** The path to use when `href` is a real DiplomaHub page Bro may link to, otherwise null. */
export function broLink(href: string | undefined): string | null {
  if (!href) return null;
  let url: URL;
  try {
    url = new URL(href, "https://www.diplomahub.org");
  } catch {
    return null;
  }
  if (url.origin !== "https://www.diplomahub.org" && url.origin !== "https://diplomahub.org") return null;
  const path = url.pathname.replace(/\/$/, "") || "/";
  const ok =
    FIXED.has(path) ||
    new RegExp(`^/practice/sets/${UUID}/(play|pdf|mark)$`).test(path) ||
    new RegExp(`^/practice/attempts/${UUID}$`).test(path) ||
    new RegExp(`^/resources/${UUID}$`).test(path) ||
    (() => {
      const m = /^\/practice\/([a-z_]+)(\/build\/(mcq_short|essay|mock))?$/.exec(path);
      return !!m && SUBJECT_IDS.has(m[1]);
    })();
  if (!ok) return null;
  // A PDF link opens the print dialog straight away.
  if (path.endsWith("/pdf")) return `${path}?print=1`;
  // Only Build your set's topic list survives as a query.
  const topics = url.searchParams.get("topics");
  return topics && path.includes("/build/") && /^[\w.,%-]{1,200}$/.test(topics) ? `${path}?topics=${topics}` : path;
}
