/** Asks this app to expire the session cookies. The API has no logout route. */
export async function requestSignOut() {
  let response: Response

  try {
    response = await fetch("/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    })
  } catch {
    throw new Error("sign-out failed")
  }

  if (!response.ok) {
    throw new Error("sign-out failed")
  }
}
