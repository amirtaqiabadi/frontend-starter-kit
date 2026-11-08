const STORAGE_KEY = "frontend-starter-kit.invite-token"

/** Drops spaces and hyphens and uppercases, matching the server. */
export function normalizeInviteToken(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase()
}

/** Keeps an invite link token until OTP verification succeeds. */
export function rememberInviteToken(value: string | undefined) {
  const token = value ? normalizeInviteToken(value) : ""
  if (!token) {
    return
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, token)
  } catch {
    // Login still works when the token cannot be stored.
  }
}

/** Returns the stored invite token, or an empty string. */
export function readInviteToken() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? ""
  } catch {
    return ""
  }
}

/** Drops the token after a successful OTP verification. */
export function clearInviteToken() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // The verify call already succeeded.
  }
}
