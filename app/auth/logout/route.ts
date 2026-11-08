export const dynamic = "force-dynamic"

/** Expires the browser session. The API documents no logout endpoint. */
export function POST(request: Request) {
  const secure = isSecureRequest(request) ? "; Secure" : ""

  return new Response(null, {
    status: 204,
    headers: [
      [
        "set-cookie",
        `session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
      ],
      [
        "set-cookie",
        `csrf-token=; Path=/; Max-Age=0; SameSite=Strict${secure}`,
      ],
    ],
  })
}

/** Matches a Secure cookie only when the page itself was served over HTTPS. */
function isSecureRequest(request: Request) {
  const forwarded = request.headers.get("x-forwarded-proto")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() === "https"
  }

  return new URL(request.url).protocol === "https:"
}
