// Shared between server actions (which can only export async functions,
// not plain constants, from a "use server" file) and the client components
// that need to recognize this specific error to show a popup instead of
// plain inline text.
export const LOGIN_REQUIRED_TO_DOWNLOAD =
  "Log in to access every single resource for FREE";
