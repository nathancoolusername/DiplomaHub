// Returns a complete, self-contained phrase (e.g. "3h ago", "Just now") —
// callers should not append their own "ago" suffix.
export function formatRelativeTime(dateString: string | Date): string {
  const today = new Date();
  const createdAt = new Date(dateString);
  const last_I = today.toISOString().lastIndexOf("-");

  if (
    today.toISOString().split("T")[0] === createdAt.toISOString().split("T")[0]
  ) {
    const hours = today.getHours() - createdAt.getHours();
    return hours <= 0 ? "Just now" : `${hours}h ago`;
  } else if (
    today.toISOString().slice(0, last_I) ===
    createdAt.toISOString().slice(0, last_I)
  ) {
    const days = today.getDate() - createdAt.getDate();
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  } else if (
    today.toISOString().split("-")[0] === createdAt.toISOString().split("-")[0]
  ) {
    const months = today.getMonth() - createdAt.getMonth();
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  } else {
    const years = today.getFullYear() - createdAt.getFullYear();
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  }
}
