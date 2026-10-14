// The Hub and DiplomaPro name the same subjects differently: the Hub has one
// "English", DiplomaPro splits languages into courses (english_a_lit,
// english_a_langlit, english_b …). These pure helpers translate between them
// (the database triggers in migration 21 use the same rules). Safe for client
// and server.

const LANGUAGES = ["english", "french", "german", "spanish"] as const;
const COURSE = /^(english|french|german|spanish)_(a_lit|a_langlit|b)$/;

/** DiplomaPro subject id → the Hub's id ("english_b" → "english"; everything else is the same). */
export function toHubSubjectId(id: string): string {
  const m = COURSE.exec(id);
  return m ? m[1] : id;
}

/** The likeliest DiplomaPro course for a Hub language pick (the student can change it in the wizard). */
const LIKELIEST: Record<string, string> = {
  english: "english_a_langlit",
  french: "french_b",
  german: "german_b",
  spanish: "spanish_b",
};

/**
 * A Hub subject id as a DiplomaPro subject id, for a student who takes
 * `takenIds` (their user_subjects): a language matches the course they
 * actually take, else the likeliest one; any other id is unchanged.
 */
export function toCatalogSubjectId(id: string, takenIds: readonly string[] = []): string {
  if (!(LANGUAGES as readonly string[]).includes(id)) return id;
  return takenIds.find((t) => toHubSubjectId(t) === id) ?? LIKELIEST[id];
}
