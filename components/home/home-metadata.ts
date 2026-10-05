import type { Metadata } from "next";

// Shared by `/` (signed-out, static) and `/dashboard` (signed-in, served at
// `/` via a proxy rewrite) so both versions of the homepage carry the same
// title and canonical URL.
const description =
  "Browse IA and EE exemplars, guides, and notes for every subject, and plan every deadline with the Hub — DiplomaHub's personal calendar for the IB Diploma.";

export const homeMetadata: Metadata = {
  title: "DiplomaHub – IB resources and diploma planner",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "DiplomaHub – IB resources and diploma planner",
    description,
  },
};
