import Link from "next/link";
import { Timer } from "lucide-react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getRoomState, joinRoom, logDeadlineEvent } from "@/lib/data";
import { normalizeCode } from "@/lib/codes";
import type { RoomState } from "@/lib/deadline/types";
import { LiveRoom } from "./LiveRoom";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ via?: string }> };

// A pasted invite unfurls as a card with the room code (app/play/deadline/og).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = normalizeCode(decodeURIComponent((await params).code)).slice(0, 4);
  const title = `Join my Deadline game: ${code}`;
  const description = "A fast party game for IB students on DiplomaHub. Name an answer before your deadline; rarer answers score more; last one in wins.";
  const image = { url: `/play/deadline/og?c=${code}`, width: 1200, height: 630, alt: `Deadline room ${code}` };
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, url: `/play/deadline/${code}`, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

const WHY: Record<string, string> = {
  not_found: "There's no open room with that code. Check it with whoever sent it.",
  full: "That room is full (8 players).",
  rate_limited: "Too many wrong codes. Try again in a bit.",
  error: "Couldn't open the room just now. Try again.",
};

// A room: signed-out visitors get the invite page (sign up / log in, then
// back here); everyone else joins (or rejoins) and gets the live room.
export default async function DeadlineRoomPage({ params, searchParams }: Props) {
  const [{ code: raw }, { via }] = await Promise.all([params, searchParams]);
  const code = normalizeCode(decodeURIComponent(raw));
  if (code.length !== 4) redirect("/play/deadline");
  // Signed out (often a friend opening the invite, or a chat app fetching its
  // preview): an invite page that keeps the room through sign-up or login.
  if (!(await getCurrentUserId())) {
    const next = encodeURIComponent(`/play/deadline/${code}`);
    return (
      <div className="bg-surface-container-low min-h-full">
        <div className="max-w-[560px] mx-auto px-md py-xl flex flex-col items-center gap-lg text-center">
          <p className="inline-flex items-center gap-xs text-label-md font-semibold uppercase tracking-wide text-error"><Timer size={14} aria-hidden="true" />Deadline</p>
          <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">You&apos;re invited to a game</h1>
          <p className="font-mono font-black text-[3.25rem] leading-none tracking-[0.25em] pl-[0.25em] text-on-surface">{code}</p>
          <p className="text-body-lg text-on-surface-variant">
            A fast party game for IB students: name an answer before your deadline, then pass the draft. Rarer answers score more. Last one in wins.
          </p>
          <div className="flex flex-wrap justify-center gap-sm">
            <Link href={`/signup?next=${next}`} className="rounded-2xl bg-primary text-on-primary px-lg py-sm text-body-lg font-bold">Sign up free to join</Link>
            <Link href={`/login?next=${next}`} className="rounded-2xl border border-outline-variant px-lg py-sm text-body-lg font-semibold text-on-surface">Log in</Link>
          </div>
        </div>
      </div>
    );
  }

  const joined = await joinRoom(code, via === "code" ? "code" : via === "squad" ? "squad" : "link");
  let state: Awaited<ReturnType<typeof getRoomState>> | null = null;
  if (joined.ok) {
    void logDeadlineEvent("join_page_opened", { via: via ?? "link" });
    state = await getRoomState(code);
  }

  return (
    <div className="bg-surface-container-low min-h-full">
      <div className="max-w-[1400px] mx-auto px-md md:px-lg py-lg">
        {state && state.ok ? (
          <LiveRoom code={code} initial={state as RoomState} />
        ) : (
          <div className="flex flex-col items-center gap-md py-xl text-center">
            <p className="font-mono font-black text-[2.5rem] tracking-[0.25em] text-on-surface-variant">{code}</p>
            <p className="font-serif font-bold text-headline-md text-on-surface">{WHY[joined.ok ? "error" : joined.reason] ?? WHY.error}</p>
            <Link href="/play/deadline" className="rounded-full bg-primary text-on-primary px-lg py-sm font-semibold">Back to Deadline</Link>
          </div>
        )}
      </div>
    </div>
  );
}
