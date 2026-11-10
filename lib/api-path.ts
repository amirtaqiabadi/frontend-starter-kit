const API_VERSION = "/api/v1"

/** Builds a versioned backend path such as `/api/v1/payment/reverse`. */
export function apiPath(path: string) {
  return `${API_VERSION}${path}`
}
