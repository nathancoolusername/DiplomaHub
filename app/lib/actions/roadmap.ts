"use server";

import { createClient } from "../supabase/server";
import type { ActionResult } from "../types";
import type { RoadmapItem } from "../types";

export async function getRoadmapItems(): Promise<ActionResult<RoadmapItem[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roadmap_items")
    .select("id, title, status, completion_percentage, sort_order")
    .order("sort_order");

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
