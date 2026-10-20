export type Resource = {
  id: string;
  title: string;
  description: string | null;
  subject_tag: string;
  type_tag: string;
  year_tag: string | null;
  file_url: string | null;
  link_url: string | null;
  author_id: string;
  download_count: number;
  like_count: number;
  created_at: string;
  published: boolean;
  community_trust: number;
  isLiked?: boolean;
  isSaved?: boolean;
  author: {
    display_name: string;
    is_pro: boolean;
    ib_year: "Pre-IB" | "DP1" | "DP2" | "Alumni" | "Educator" | null;
    avatar_url: string | null;
  };
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image_url: string | null;
  author_id: string;
  topic: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  published: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  author?: {
    display_name: string;
    is_pro: boolean;
    ib_year?: "Pre-IB" | "DP1" | "DP2" | "Alumni" | "Educator" | null;
    avatar_url?: string | null;
  };
};

export type Comment = {
  id: string;
  user_id: string;
  resource_id: string | null;
  article_id: string | null;
  content: string;
  created_at: string;
  author: {
    display_name: string;
    is_pro: boolean;
    ib_year: "Pre-IB" | "DP1" | "DP2" | "Alumni" | "Educator" | null;
    avatar_url: string | null;
  };
};

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type RoadmapStatus = "completed" | "in_progress" | "planned";

export type RoadmapTag = { label: string; icon: string };

export type RoadmapItem = {
  id: string;
  title: string;
  status: RoadmapStatus;
  completion_percentage: number | null;
  sort_order: number;
  release_label: string | null;
  description: string | null;
  tags: RoadmapTag[];
};

/**
 * Anyone's public profile: the public.public_profiles view (no email, no
 * private Hub data). Use this for other users; UserProfile is only ever the
 * signed-in student's own row.
 */
export type PublicProfile = {
  id: string;
  display_name: string;
  avatar_url: string;
  bio: string | null;
  ib_year: "Pre-IB" | "DP1" | "DP2" | "Alumni" | "Educator" | null;
  points: number;
  is_pro: boolean;
  author_trust_score: number;
  created_at: string;
  hide_from_leaderboard: boolean;
};

/** The signed-in student's own users row (readable only by them, since migration 28). */
export type UserProfile = {
  id: string;
  email: string;
  display_name: string;
  points: number;
  is_pro: boolean;
  author_trust_score: number;
  ib_year: "Pre-IB" | "DP1" | "DP2" | "Alumni" | "Educator" | null;
  avatar_url: string;
  bio: string | null;
  created_at: string;
  hub_onboarded_at: string | null;
  exam_session_id: string | null;
};
