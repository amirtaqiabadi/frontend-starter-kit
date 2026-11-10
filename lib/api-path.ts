const API_VERSION = "/api/v1"
const DEV_API_ORIGIN = "http://localhost:3000"

/** Backend origin. Development calls port 3000; production stays on the page host. */
function apiOrigin() {
  const configured = process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/$/, "")
  if (configured) {
    return configured
  }

  if (process.env.NODE_ENV === "development") {
    return DEV_API_ORIGIN
  }

  return ""
}

/** Builds a versioned backend URL such as `http://localhost:3000/api/v1/auth/identify`. */
export function apiPath(path: string) {
  return `${apiOrigin()}${API_VERSION}${path}`
}
