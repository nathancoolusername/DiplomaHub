import type { Metadata } from "next";

// Shared by `/` (signed-out, static) and `/dashboard` (signed-in, served at
// `/` via a proxy rewrite) so both versions of the homepage carry the same
// title and canonical URL.
const description =
  "Practise IB-style questions marked like the markscheme, see exactly where your marks go, and plan every test on the Hub. Plus free IA and EE exemplars, notes and guides.";

export const homeMetadata: Metadata = {
  title: "DiplomaHub – IB practice questions, planner and resources",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "DiplomaHub – IB practice questions, planner and resources",
    description,
  },
};
