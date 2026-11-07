import { describe, expect, it } from "vitest"

import { safeRedirectPath } from "@/features/login/redirect-path"

describe("safeRedirectPath", () => {
  it("keeps a single-slash relative path", () => {
    expect(safeRedirectPath("/account")).toBe("/account")
    expect(safeRedirectPath("/wallet")).toBe("/wallet")
  })

  it("falls back for missing or unsafe values", () => {
    expect(safeRedirectPath(undefined)).toBe("/account")
    expect(safeRedirectPath("//host")).toBe("/account")
    expect(safeRedirectPath("/\\evil")).toBe("/account")
    expect(safeRedirectPath("https://evil.example")).toBe("/account")
    expect(safeRedirectPath("account")).toBe("/account")
  })
})
