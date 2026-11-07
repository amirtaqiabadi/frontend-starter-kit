import http from "node:http"
import https from "node:https"

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:3000"

const HOP_BY_HOP = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
])

const RESPONSE_HEADERS = [
  "cache-control",
  "content-encoding",
  "content-type",
  "retry-after",
  "x-request-id",
]

/** Forwards /api to the backend while keeping Origin and Host aligned. */
export async function proxyApiRequest(request: Request) {
  const api = new URL(API_ORIGIN)
  const incoming = new URL(request.url)
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : Buffer.from(await request.arrayBuffer())

  const headers: http.OutgoingHttpHeaders = {}
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers[key] = value
    }
  })
  headers.host = incoming.host

  const origin = request.headers.get("origin")
  if (origin) {
    headers.origin = origin
  }

  const client = api.protocol === "https:" ? https : http

  return new Promise<Response>((resolve, reject) => {
    const upstream = client.request(
      {
        protocol: api.protocol,
        hostname: api.hostname,
        port: api.port,
        path: `${incoming.pathname}${incoming.search}`,
        method: request.method,
        headers,
      },
      (response) => {
        const chunks: Buffer[] = []
        response.on("data", (chunk) => {
          chunks.push(chunk)
        })
        response.on("end", () => {
          resolve(toProxyResponse(response, Buffer.concat(chunks)))
        })
      }
    )

    upstream.on("error", reject)
    if (body && body.length > 0) {
      upstream.write(body)
    }
    upstream.end()
  })
}

/** Copies status, cookies, and the headers the browser needs. */
function toProxyResponse(response: http.IncomingMessage, payload: Buffer) {
  const headers = new Headers()

  for (const name of RESPONSE_HEADERS) {
    const value = response.headers[name]
    if (typeof value === "string") {
      headers.set(name, value)
    }
  }

  const cookies = response.headers["set-cookie"]
  if (cookies) {
    for (const cookie of Array.isArray(cookies) ? cookies : [cookies]) {
      headers.append("set-cookie", cookie)
    }
  }

  return new Response(Uint8Array.from(payload), {
    status: response.statusCode ?? 502,
    headers,
  })
}
