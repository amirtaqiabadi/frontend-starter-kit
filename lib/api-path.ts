const API_VERSION = "/api/v1"

/** Uses the configured browser API origin, or the same-origin proxy by default. */
export function apiPath(path: string) {
  const origin = (process.env.NEXT_PUBLIC_API_ORIGIN ?? "").replace(/\/+$/, "")
  return `${origin}${API_VERSION}${path}`
}
