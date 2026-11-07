const DEFAULT_NEXT = "/account"

/** Returns a same-origin relative path, or the fallback when the value is unsafe. */
export function safeRedirectPath(
  value: string | string[] | undefined | null,
  fallback = DEFAULT_NEXT
) {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) {
    return fallback
  }

  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return fallback
  }

  if (raw.includes("://")) {
    return fallback
  }

  return raw
}
