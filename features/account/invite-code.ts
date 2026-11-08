/** Builds the login link friends open with this invite token. */
export function inviteUrl(origin: string, token: string) {
  const path = `/login?token=${encodeURIComponent(token)}`
  return origin ? `${origin}${path}` : path
}
