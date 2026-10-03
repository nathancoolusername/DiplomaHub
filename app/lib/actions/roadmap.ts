"use server";

import { createPublicClient } from "../supabase/public";
import type { ActionResult } from "../types";
import type { RoadmapItem } from "../types";

// Roadmap items are public and identical for every visitor, so this reads
// with the cookie-less client — touching cookies here would force /roadmap
// to render dynamically on every request instead of being served via ISR.
export async function getRoadmapItems(): Promise<ActionResult<RoadmapItem[]>> {
  const { data, error } = await createPublicClient()
    .from("roadmap_items")
    .select(
      "id, title, status, completion_percentage, sort_order, release_label, description, tags",
    )
    .order("sort_order");

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
