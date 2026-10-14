"use server";

import { revalidatePath } from "next/cache";
import { getViewer, setLeaderboardHidden } from "@/lib/data";

export async function setLeaderboardHiddenAction(hidden: boolean): Promise<void> {
  await getViewer();
  await setLeaderboardHidden(hidden);
  revalidatePath("/leaderboard");
  revalidatePath("/practice");
  revalidatePath("/");
}
