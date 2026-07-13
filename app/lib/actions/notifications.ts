"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { resolveOrigin } from "../resolveOrigin";
import type { ActionResult } from "../types";

export type NotificationType =
  | "like_resource"
  | "like_article"
  | "like_discussion"
  | "like_reply"
  | "comment_resource"
  | "comment_article"
  | "reply_discussion"
  | "admin_trust_score"
  | "admin_pro_upgrade"
  | "download_milestone";

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
  actor: { display_name: string; avatar_url: string | null } | null;
};

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Internal — called from other server actions after a successful
// like/comment/reply/download/admin-edit, never invoked directly from the
// client. Writes through the service-role client because it inserts into
// the *recipient's* row, not the caller's own — a plain auth.uid()-scoped
// RLS policy can't express "the actor may create rows for someone else."
export async function createNotification(params: {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  message: string;
  link: string;
}): Promise<void> {
  // Don't notify people about their own actions (e.g. liking your own resource).
  if (params.actorId && params.actorId === params.userId) return;

  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert({
    user_id: params.userId,
    actor_id: params.actorId ?? null,
    type: params.type,
    message: params.message,
    link: params.link,
  });
  if (error) {
    console.error("Failed to create notification:", error.message);
    return;
  }

  await sendNotificationEmail(admin, params.userId, params.message, params.link);
}

// Resend can only deliver to arbitrary recipients once the sender domain
// verification goes through — on hold until 2026-09-02. Until then,
// notifications stay in-app only; flip this back once the domain is live.
const EMAIL_SENDING_ENABLED = false;

async function sendNotificationEmail(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  message: string,
  link: string,
) {
  if (!resend || !EMAIL_SENDING_ENABLED) return;

  const { data: recipient } = await admin
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();
  if (!recipient?.email) return;

  const origin = resolveOrigin(await headers());

  try {
    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ?? "DiplomaHub <onboarding@resend.dev>",
      to: recipient.email,
      subject: message,
      html: `<p>${message}</p><p><a href="${origin}${link}">View on DiplomaHub</a></p>`,
    });
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }
}

export async function getNotifications(): Promise<
  ActionResult<Notification[]>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, type, message, link, read, created_at, actor:users!notifications_actor_id_fkey(display_name, avatar_url)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: data.map((n) => ({
      ...n,
      actor: Array.isArray(n.actor) ? (n.actor[0] ?? null) : n.actor,
    })),
  };
}

export async function getUnreadNotificationCount(): Promise<
  ActionResult<number>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: true, data: 0 };

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) return { success: false, error: error.message };
  return { success: true, data: count ?? 0 };
}

export async function markNotificationRead(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function markAllNotificationsRead(): Promise<
  ActionResult<null>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}
