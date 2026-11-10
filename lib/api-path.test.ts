import { describe, expect, it } from "vitest"

import { apiPath } from "@/lib/api-path"

describe("apiPath", () => {
  it("keeps browser requests on the page origin", () => {
    expect(apiPath("/auth/identify")).toBe("/api/v1/auth/identify")
    expect(apiPath("/wallets")).toBe("/api/v1/wallets")
  })
})
