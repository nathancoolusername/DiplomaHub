"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { createSquad, getMySquads, joinSquad, leaveSquad, newSquadCode, removeSquadMember, removeSquadShare, renameSquad, shareResourceToSquad, shareToSquad, type JoinSquadResult } from "@/lib/data";

async function signedIn() {
  if (!(await getCurrentUserId())) throw new Error("Sign in to use squads");
}
const message = (e: unknown, fallback: string) => (e instanceof Error && e.message && !/schema cache|function .* does not exist/i.test(e.message) ? e.message : fallback);

export async function createSquadAction(name: string): Promise<{ id: string; code: string }> {
  await signedIn();
  try {
    const r = await createSquad(name);
    revalidatePath("/squads");
    return r;
  } catch (e) {
    throw new Error(message(e, "Couldn't create the squad just now"));
  }
}

export async function joinSquadAction(code: string): Promise<JoinSquadResult> {
  await signedIn();
  const r = await joinSquad(code);
  if (r.ok) revalidatePath("/squads");
  return r;
}

export async function leaveSquadAction(id: string): Promise<void> {
  await signedIn();
  await leaveSquad(id);
  revalidatePath("/squads");
}

export async function removeSquadMemberAction(id: string, userId: string): Promise<void> {
  await signedIn();
  try {
    await removeSquadMember(id, userId);
  } catch (e) {
    throw new Error(message(e, "Couldn't remove them"));
  }
  revalidatePath(`/squads/${id}`);
}

export async function renameSquadAction(id: string, name: string): Promise<void> {
  await signedIn();
  try {
    await renameSquad(id, name);
  } catch (e) {
    throw new Error(message(e, "Couldn't rename the squad"));
  }
  revalidatePath(`/squads/${id}`);
  revalidatePath("/squads");
}

export async function newSquadCodeAction(id: string): Promise<string> {
  await signedIn();
  try {
    const code = await newSquadCode(id);
    revalidatePath(`/squads/${id}`);
    return code;
  } catch (e) {
    throw new Error(message(e, "Couldn't change the code"));
  }
}

/** The student's squads, for "Send to your squad" in the share dialog ([] when signed out). */
export async function mySquadsAction(): Promise<{ id: string; name: string; members: number }[]> {
  if (!(await getCurrentUserId())) return [];
  return (await getMySquads()).map((s) => ({ id: s.id, name: s.name, members: s.members }));
}

export async function shareToSquadAction(squadId: string, code: string, note?: string): Promise<void> {
  await signedIn();
  try {
    await shareToSquad(squadId, code, note?.slice(0, 140));
  } catch (e) {
    throw new Error(message(e, "Couldn't send it to the squad"));
  }
  revalidatePath(`/squads/${squadId}`);
}

export async function shareResourceToSquadAction(squadId: string, resourceId: string, note?: string): Promise<void> {
  await signedIn();
  if (!/^[0-9a-f-]{36}$/i.test(resourceId)) throw new Error("That resource isn't available");
  try {
    await shareResourceToSquad(squadId, resourceId, note?.slice(0, 140));
  } catch (e) {
    throw new Error(message(e, "Couldn't send it to the squad"));
  }
  revalidatePath(`/squads/${squadId}`);
}

export async function removeSquadShareAction(squadId: string, id: string): Promise<void> {
  await signedIn();
  try {
    await removeSquadShare(id);
  } catch (e) {
    throw new Error(message(e, "Couldn't take it off the shelf"));
  }
  revalidatePath(`/squads/${squadId}`);
}
