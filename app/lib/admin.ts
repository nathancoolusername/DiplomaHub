const ADMIN_USER_IDS = ["c5680362-be56-490f-b6bc-471363da8648"];

export function isAdmin(userId: string | null | undefined): boolean {
  return !!userId && ADMIN_USER_IDS.includes(userId);
}
