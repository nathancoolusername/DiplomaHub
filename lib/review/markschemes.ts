import "server-only";

import fs from "node:fs";
import path from "node:path";
import { createAdminClient } from "@/app/lib/supabase/admin";

// The official assessment criteria text, taken from the IB subject guides and
// used only in the marking prompt. It is IB's copyright, so it is NOT in the
// public repo: the source is supabase/review/markschemes.json (internal, on the
// private diplomapro branch), and the live site reads the copy in the private
// storage bucket "internal" (upload: scripts/review/upload-markschemes.mjs).
// Never send this text to the browser or show it to students.

const BUCKET = "internal";
const OBJECT = "review/markschemes.json";
const LOCAL = path.join(process.cwd(), "supabase/review/markschemes.json");

let loading: Promise<Record<string, string>> | null = null;

async function load(): Promise<Record<string, string>> {
  // Local file first (development, scripts), then private storage (the live site).
  try {
    return JSON.parse(fs.readFileSync(LOCAL, "utf8")) as Record<string, string>;
  } catch {
    // not on this machine
  }
  const { data, error } = await createAdminClient().storage.from(BUCKET).download(OBJECT);
  if (error || !data) throw new Error("The assessment criteria couldn't be loaded");
  return JSON.parse(await data.text()) as Record<string, string>;
}

/** The criteria text for a key (e.g. "science", "ee"). Cached for the life of the server process. */
export async function getMarkscheme(key: string): Promise<string> {
  loading ??= load().catch((e) => {
    loading = null; // try again next time
    throw e;
  });
  const all = await loading;
  const text = all[key];
  if (!text) throw new Error(`No assessment criteria for "${key}"`);
  return text;
}
