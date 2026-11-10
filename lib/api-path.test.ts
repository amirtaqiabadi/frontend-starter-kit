import { afterEach, describe, expect, it, vi } from "vitest"

import { apiPath } from "@/lib/api-path"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("apiPath", () => {
  it("calls the backend on port 3000 during development", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("NEXT_PUBLIC_API_ORIGIN", "")
    expect(apiPath("/auth/identify")).toBe(
      "http://localhost:3000/api/v1/auth/identify"
    )
  })

  it("stays on the page host outside development", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_API_ORIGIN", "")
    expect(apiPath("/wallets")).toBe("/api/v1/wallets")
  })

  it("uses a configured origin when one is set", () => {
    vi.stubEnv("NEXT_PUBLIC_API_ORIGIN", "https://api.example.com/")
    expect(apiPath("/auth/identify")).toBe(
      "https://api.example.com/api/v1/auth/identify"
    )
  })
})
