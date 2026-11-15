import { afterEach, describe, expect, it, vi } from "vitest"

import { apiPath } from "@/lib/api-path"

describe("apiPath", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("keeps browser requests on the page origin", () => {
    vi.stubEnv("NEXT_PUBLIC_API_ORIGIN", "")
    expect(apiPath("/auth/identify")).toBe("/api/v1/auth/identify")
    expect(apiPath("/wallets")).toBe("/api/v1/wallets")
  })

  it("sends requests directly to the configured backend origin", () => {
    vi.stubEnv("NEXT_PUBLIC_API_ORIGIN", "http://localhost:3000/")
    expect(apiPath("/auth/identify")).toBe(
      "http://localhost:3000/api/v1/auth/identify"
    )
    expect(apiPath("/wallets")).toBe("http://localhost:3000/api/v1/wallets")
  })
})
