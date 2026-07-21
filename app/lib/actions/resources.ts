"use server";

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { revalidatePath } from "next/cache";
import { isAdmin } from "../admin";
import { createNotification } from "./notifications";
import { requireField, optionalField, requireOneOf } from "../validation";
import { checkRateLimit } from "../ratelimit";
import { SubjectTags, ResourceTypeTag, YEAR_OPTIONS } from "@/components/pills";
import type { ActionResult, Resource } from "../types";

// Notify the resource owner once total downloads first cross one of these
// thresholds, rather than on every single download.
const DOWNLOAD_MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

const SUBJECT_OPTIONS = Object.keys(SubjectTags);
const RESOURCE_TYPE_OPTIONS = Object.keys(ResourceTypeTag);

function validateResourceFields(formData: FormData) {
  const title = requireField(formData.get("title"), "Title", 200);
  if ("error" in title) return title;

  const description = optionalField(
    formData.get("description"),
    "Description",
    3000,
  );
  if ("error" in description) return description;

  const subject_tag = requireOneOf(
    formData.get("subject_tag"),
    "Subject",
    SUBJECT_OPTIONS,
  );
  if ("error" in subject_tag) return subject_tag;

  const type_tag = requireOneOf(
    formData.get("type_tag"),
    "Type",
    RESOURCE_TYPE_OPTIONS,
  );
  if ("error" in type_tag) return type_tag;

  const year_tag = requireOneOf(formData.get("year_tag"), "Year", YEAR_OPTIONS);
  if ("error" in year_tag) return year_tag;

  const file_url = requireField(formData.get("file_url"), "File", 2000);
  if ("error" in file_url) return file_url;

  return {
    value: {
      title: title.value,
      description: description.value,
      subject_tag: subject_tag.value,
      type_tag: type_tag.value,
      year_tag: year_tag.value,
      file_url: file_url.value,
    },
  };
}

export async function createResource(
  formData: FormData,
): Promise<ActionResult<Resource>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const fields = validateResourceFields(formData);
  if ("error" in fields) return { success: false, error: fields.error };

  const { data, error } = await supabase
    .from("resources")
    .insert({ ...fields.value, author_id: user.id })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/resources");
  return { success: true, data };
}

export async function getResourceForEdit(
  resourceId: string,
): Promise<ActionResult<Resource>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { data, error } = await supabase
    .from("resources")
    .select("*, author:users(display_name, is_pro, ib_year, avatar_url)")
    .eq("id", resourceId)
    .single();

  if (error || !data) return { success: false, error: "Resource not found" };
  if (data.author_id !== user.id && !isAdmin(user.id)) {
    return { success: false, error: "You can only edit your own resources" };
  }

  return {
    success: true,
    data: {
      ...data,
      author: Array.isArray(data.author) ? data.author[0] : data.author,
    },
  };
}

export async function updateResource(
  resourceId: string,
  formData: FormData,
): Promise<ActionResult<Resource>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const fields = validateResourceFields(formData);
  if ("error" in fields) return { success: false, error: fields.error };

  let query = supabase
    .from("resources")
    .update(fields.value)
    .eq("id", resourceId);

  if (!isAdmin(user.id)) {
    query = query.eq("author_id", user.id);
  }

  const { data, error } = await query.select().maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!data)
    return { success: false, error: "You can only edit your own resources" };

  revalidatePath("/resources");
  revalidatePath(`/resources/${resourceId}`);
  return { success: true, data };
}

export async function getResourceDetail(
  resourceId: string,
): Promise<ActionResult<Resource>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("resources")
    .select("*, author:users(display_name, is_pro, ib_year, avatar_url)")
    .eq("id", resourceId)
    .eq("published", true)
    .single();

  if (error || !data) return { success: false, error: "Resource not found" };

  const resource = {
    ...data,
    author: Array.isArray(data.author) ? data.author[0] : data.author,
  };

  if (!user) {
    return { success: true, data: { ...resource, isLiked: false, isSaved: false } };
  }

  const [{ data: like }, { data: save }] = await Promise.all([
    supabase
      .from("likes")
      .select("id")
      .match({ user_id: user.id, resource_id: resourceId })
      .maybeSingle(),
    supabase
      .from("saved_items")
      .select("id")
      .match({ user_id: user.id, resource_id: resourceId })
      .maybeSingle(),
  ]);

  return {
    success: true,
    data: { ...resource, isLiked: !!like, isSaved: !!save },
  };
}

export async function getResources(filters?: {
  subject?: string;
  type?: string;
}): Promise<ActionResult<Resource[]>> {
  const supabase = await createClient();

  let query = supabase
    .from("resources")
    .select("*, author:users(display_name, is_pro, avatar_url)")
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  let query = supabase.from("resources").delete().eq("id", resourceId);
  if (!isAdmin(user.id)) {
    query = query.eq("author_id", user.id);
  }
  const { data, error } = await query.select("id, file_url");

  if (error) return { success: false, error: error.message };
  if (!data || data.length === 0)
    return { success: false, error: "You can only delete your own resources" };

  const fileUrl = data[0].file_url;
  const bucketMarker = "/object/public/resources/";
  const markerIndex = fileUrl?.indexOf(bucketMarker) ?? -1;
  if (markerIndex > -1) {
    const storagePath = fileUrl!.slice(markerIndex + bucketMarker.length);
    // Best effort — the resource row is already gone either way.
    await supabase.storage.from("resources").remove([storagePath]);
  }

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

  const rateLimit = await checkRateLimit("download", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const admin = createAdminClient();

  const { data: resource, error: fetchError } = await admin
    .from("resources")
    .select("file_url, title, author_id, download_count")
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

  const previousCount = resource.download_count;
  const newCount = previousCount + 1;
  const crossedMilestone = DOWNLOAD_MILESTONES.find(
    (m) => previousCount < m && newCount >= m,
  );
  if (crossedMilestone) {
    await createNotification({
      userId: resource.author_id,
      type: "download_milestone",
      message: `Your resource "${resource.title}" just passed ${crossedMilestone} downloads!`,
      link: `/resources/${resourceId}`,
    });
  }

  revalidatePath("/resources");
  return { success: true, data: { fileUrl: resource.file_url } };
}

export type ResourceSort =
  | "newest"
  | "oldest"
  | "most_downloaded"
  | "most_liked";

// Filters/sorts/paginates in the query itself (via .range()) instead of
// fetching every published resource and slicing client-side — used by the
// /resources grid, which needs real pagination as the table grows.
export async function getResourcesPage(filters: {
  subject?: string;
  type?: string;
  year?: string;
  sort?: ResourceSort;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<{ items: Resource[]; totalCount: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize =
    filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 6;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("resources")
    .select(
      `
      *,
      author:users(display_name, is_pro, ib_year, avatar_url)
    `,
      { count: "exact" },
    )
    .eq("published", true);

  if (filters.subject) query = query.eq("subject_tag", filters.subject);
  if (filters.type) query = query.eq("type_tag", filters.type);
  if (filters.year) query = query.eq("year_tag", filters.year);

  switch (filters.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "most_downloaded":
      query = query.order("download_count", { ascending: false });
      break;
    case "most_liked":
      query = query.order("like_count", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: resources, error, count } = await query.range(from, to);
  if (error) return { success: false, error: error.message };

  if (!user) {
    return {
      success: true,
      data: {
        items: resources.map((r) => ({ ...r, isLiked: false, isSaved: false })),
        totalCount: count ?? 0,
      },
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

  return {
    success: true,
    data: {
      items: resources.map((r) => ({
        ...r,
        isLiked: likedIds.has(r.id),
        isSaved: savedIds.has(r.id),
      })),
      totalCount: count ?? 0,
    },
  };
}

// lib/actions/resources.ts
export async function getResourcesWithUserState(filters?: {
  subject?: string;
  type?: string;
  limit?: number;
}): Promise<ActionResult<Resource[]>> {
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
      author:users(display_name, is_pro, ib_year, avatar_url)
    `,
    )
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (filters?.subject) query = query.eq("subject_tag", filters.subject);
  if (filters?.type) query = query.eq("type_tag", filters.type);
  if (filters?.limit) query = query.limit(filters.limit);

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
