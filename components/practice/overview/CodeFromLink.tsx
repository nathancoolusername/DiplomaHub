"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EnterCodeDialog } from "@/components/practice/build/SetDialogs";

/** Practice opened from a share link (/join/CODE → /practice?code=CODE): Enter a code, filled in. */
export function CodeFromLink({ code }: { code: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <EnterCodeDialog
      initialCode={code}
      onClose={() => {
        setOpen(false);
        router.replace("/practice", { scroll: false });
      }}
    />
  );
}
