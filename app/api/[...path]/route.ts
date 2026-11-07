import { proxyApiRequest } from "@/lib/api-proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Relays one API call to the backend on the same host as the page. */
async function handle(request: Request) {
  try {
    return await proxyApiRequest(request)
  } catch {
    return Response.json(
      {
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "ارتباط با سرور برقرار نشد.",
        },
      },
      { status: 503 }
    )
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
