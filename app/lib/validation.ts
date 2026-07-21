// Server-side validation for form-submitted content. Client forms already
// mark these fields "required" and constrain dropdowns to fixed option
// sets, but that's trivially bypassed by anyone calling the server action
// directly with their own session — every create/update action needs its
// own check, not just the form.

export type FieldResult =
  | { error: string }
  | { value: string };

export function requireField(
  value: FormDataEntryValue | null,
  fieldName: string,
  maxLength: number,
): FieldResult {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return { error: `${fieldName} is required` };
  if (trimmed.length > maxLength) {
    return { error: `${fieldName} must be under ${maxLength} characters` };
  }
  return { value: trimmed };
}

export function optionalField(
  value: FormDataEntryValue | null,
  fieldName: string,
  maxLength: number,
): { error: string } | { value: string | null } {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return { value: null };
  if (trimmed.length > maxLength) {
    return { error: `${fieldName} must be under ${maxLength} characters` };
  }
  return { value: trimmed };
}

export function requireOneOf(
  value: FormDataEntryValue | null,
  fieldName: string,
  allowed: readonly string[],
): FieldResult {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!allowed.includes(trimmed)) {
    return { error: `${fieldName} must be one of: ${allowed.join(", ")}` };
  }
  return { value: trimmed };
}
