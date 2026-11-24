"use server";

import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { createRoom } from "@/lib/data";
import { normalizeCode } from "@/lib/codes";

// Deadline: making and finding rooms. Playing runs from the browser
// (lib/deadline/useRoom.ts); these only start you off on the right page.

/** A new room (with a squad: for its members), then straight into its lobby. */
export async function createRoomAction(squadId: string | null): Promise<{ error: string }> {
  if (!(await getCurrentUserId())) redirect("/login?next=/play/deadline");
  let code: string;
  try {
    code = (await createRoom(squadId)).code;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return { error: /lot of rooms|squad/i.test(msg) ? msg : "Couldn't make a room just now. Try again." };
  }
  redirect(`/play/deadline/${code}`);
}

/** "Join with code": to the room's page, which joins you. */
export async function joinWithCodeAction(raw: string): Promise<{ error: string }> {
  const code = normalizeCode(String(raw ?? ""));
  if (code.length !== 4) return { error: "Room codes have 4 characters." };
  redirect(`/play/deadline/${code}?via=code`);
}
