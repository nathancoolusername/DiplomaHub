"use server";

import { revalidatePath } from "next/cache";
import { setProBadgeHidden } from "@/lib/data";

/** "Hide my Pro badge": everyone else stops seeing it (public_profiles.is_pro goes false). */
export async function setProBadgeHiddenAction(hidden: boolean): Promise<void> {
  await setProBadgeHidden(hidden);
  revalidatePath("/profile/edit");
  revalidatePath("/", "layout");
}
