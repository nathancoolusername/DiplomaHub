"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { isAdmin } from "@/app/lib/admin";
import { recordArticleView } from "@/app/lib/actions/articles";
import { LikeButton } from "@/components/likeButton";
import { SaveButton } from "@/components/saveButton";
import Comments from "@/components/detailed-articles/comments";

// The article and resource pages are cached and shared by every visitor, so
// everything that depends on who's looking is filled in here, in the
// browser: the session comes from the local cookie (no network call), then
// one query each for the viewer's own like and save. Server actions still
// verify the session themselves, so this only decides what to show.

type Target = { resource_id: string } | { article_id: string };

type Viewer = {
  // undefined = still reading the session, null = signed out.
  userId: string | null | undefined;
  liked: boolean;
  saved: boolean;
  authorId: string;
};

const ViewerContext = createContext<Viewer | null>(null);

function useViewer(): Viewer {
  const viewer = useContext(ViewerContext);
  if (!viewer) throw new Error("Wrap the page in <ViewerProvider>");
  return viewer;
}

export function ViewerProvider({
  target,
  authorId,
  children,
}: {
  target: Target;
  authorId: string;
  children: ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<Omit<Viewer, "authorId">>({
    userId: undefined,
    liked: false,
    saved: false,
  });
  const targetKey = JSON.stringify(target);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user.id ?? null;
      // Show the comment box and owner controls straight away; the like and
      // save state follow a moment later.
      if (!cancelled) setState({ userId, liked: false, saved: false });
      if (!userId) return;
      const match = { user_id: userId, ...(JSON.parse(targetKey) as Target) };
      const [{ data: like }, { data: save }] = await Promise.all([
        supabase.from("likes").select("id").match(match).maybeSingle(),
        supabase.from("saved_items").select("id").match(match).maybeSingle(),
      ]);
      if (!cancelled) setState({ userId, liked: !!like, saved: !!save });
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, targetKey]);

  return (
    <ViewerContext.Provider value={{ ...state, authorId }}>
      {children}
    </ViewerContext.Provider>
  );
}

// Remounted once the viewer's own state arrives, since the buttons only read
// their initial value on mount.
export function ViewerLikeButton(props: Omit<ComponentProps<typeof LikeButton>, "initiallyLiked">) {
  const { liked } = useViewer();
  return <LikeButton key={liked ? "liked" : "not-liked"} initiallyLiked={liked} {...props} />;
}

export function ViewerSaveButton(props: Omit<ComponentProps<typeof SaveButton>, "initiallySaved">) {
  const { saved } = useViewer();
  return <SaveButton key={saved ? "saved" : "not-saved"} initiallySaved={saved} {...props} />;
}

/** Edit/delete controls, shown only to the author and admins. */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const { userId, authorId } = useViewer();
  if (!userId || (userId !== authorId && !isAdmin(userId))) return null;
  return <>{children}</>;
}

export function ViewerComments(props: Omit<ComponentProps<typeof Comments>, "isLoggedIn" | "currentUserId">) {
  const { userId } = useViewer();
  return <Comments {...props} isLoggedIn={!!userId} currentUserId={userId ?? null} />;
}

// Counted from the browser now that the page itself is cached. A side
// benefit: crawlers that don't run JavaScript no longer add views.
export function ArticleViewCounter({ articleId }: { articleId: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    recordArticleView(articleId).catch(() => {});
  }, [articleId]);
  return null;
}
