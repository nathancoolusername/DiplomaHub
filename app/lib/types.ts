export type Resource = {
  id: string;
  title: string;
  description: string | null;
  subject_tag: string;
  type_tag: string;
  year_tag: string | null;
  file_url: string | null;
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
  };
};

export type Discussion = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  subject_tag: string | null;
  type_tag: string | null;
  year_tag: string | null;
  reply_count: number;
  like_count: number;
  created_at: string;
  top_reply: string | null;
  isLiked?: boolean;
  isSaved?: boolean;
  author?: {
    display_name: string;
    is_pro: boolean;
    ib_year?: "Pre-IB" | "DP1" | "DP2" | "Alumni" | "Educator" | null;
  };
};

export type DiscussionReply = {
  id: string;
  discussion_id: string;
  author_id: string;
  content: string;
  like_count: number;
  created_at: string;
  parent_reply_id: string | null;
  isLiked?: boolean;
  author?: {
    display_name: string;
    is_pro: boolean;
    ib_year?: "Pre-IB" | "DP1" | "DP2" | "Alumni" | "Educator" | null;
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
  };
};

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

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
};
