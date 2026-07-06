"use server";

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { revalidatePath } from "next/cache";
import type { ActionResult, Resource } from "../types";

export async function createResource(
  formData: FormData,
): Promise<ActionResult<Resource>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { data, error } = await supabase
    .from("resources")
    .insert({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      subject_tag: formData.get("subject_tag") as string,
      type_tag: formData.get("type_tag") as string,
      year_tag: formData.get("year_tag") as string,
      file_url: formData.get("file_url") as string,
      author_id: user.id,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/resources");
  return { success: true, data };
}

export async function getResources(filters?: {
  subject?: string;
  type?: string;
}): Promise<ActionResult<Resource[]>> {
  const supabase = await createClient();

  let query = supabase
    .from("resources")
    .select("*, author:users(display_name, is_pro)")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (filters?.subject) query = query.eq("subject_tag", filters.subject);
  if (filters?.type) query = query.eq("type_tag", filters.type);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function deleteResource(
  resourceId: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/resources");
  return { success: true, data: null };
}

export async function downloadResource(
  resourceId: string,
): Promise<ActionResult<{ fileUrl: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Log in to download resources" };

  const admin = createAdminClient();

  const { data: resource, error: fetchError } = await admin
    .from("resources")
    .select("file_url")
    .eq("id", resourceId)
    .single();

  if (fetchError || !resource)
    return { success: false, error: "Resource not found" };
  if (!resource.file_url)
    return { success: false, error: "No file attached to this resource" };

  const { error: rpcError } = await admin.rpc("increment_download_count", {
    target_resource_id: resourceId,
  });
  if (rpcError) return { success: false, error: rpcError.message };

  revalidatePath("/resources");
  return { success: true, data: { fileUrl: resource.file_url } };
}

// lib/actions/resources.ts
export async function getResourcesWithUserState(filters?: {
  subject?: string;
  type?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Step 1: fetch resources + author info in ONE query using embedded select
  let query = supabase
    .from("resources")
    .select(
      `
      *,
      author:users(display_name, is_pro, ib_year)
    `,
    )
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (filters?.subject) query = query.eq("subject_tag", filters.subject);
  if (filters?.type) query = query.eq("type_tag", filters.type);

  const { data: resources, error } = await query;
  if (error) return { success: false, error: error.message };

  // Step 2: if logged in, fetch which of THESE resources the user liked/saved
  // (skip entirely for logged-out visitors — no wasted query)
  if (!user) {
    return {
      success: true,
      data: resources.map((r) => ({ ...r, isLiked: false, isSaved: false })),
    };
  }

  const resourceIds = resources.map((r) => r.id);

  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase
      .from("likes")
      .select("resource_id")
      .eq("user_id", user.id)
      .in("resource_id", resourceIds),
    supabase
      .from("saved_items")
      .select("resource_id")
      .eq("user_id", user.id)
      .in("resource_id", resourceIds),
  ]);

  const likedIds = new Set(likes?.map((l) => l.resource_id));
  const savedIds = new Set(saves?.map((s) => s.resource_id));

  const enriched = resources.map((r) => ({
    ...r,
    isLiked: likedIds.has(r.id),
    isSaved: savedIds.has(r.id),
  }));

  return { success: true, data: enriched };
}
