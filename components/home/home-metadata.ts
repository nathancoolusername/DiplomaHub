import type { Metadata } from "next";

// Shared by `/` (signed-out, static) and `/dashboard` (signed-in, served at
// `/` via a proxy rewrite) so both versions of the homepage carry the same
// title and canonical URL.
const description =
  "Run your IB like a system: plan every test and deadline on the Hub, practise IB-style questions marked like the markscheme, and watch every subject improve. Plus free IA and EE exemplars, notes and guides.";

export const homeMetadata: Metadata = {
  title: "DiplomaHub – IB resources and diploma planner",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "DiplomaHub – IB resources and diploma planner",
    description,
  },
};
