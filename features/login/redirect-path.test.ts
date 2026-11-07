import { describe, expect, it } from "vitest"

import { loginPath, safeRedirectPath } from "@/features/login/redirect-path"

describe("loginPath", () => {
  it("encodes a safe next path", () => {
    expect(loginPath("/wallet/payment/failure")).toBe(
      "/login?next=%2Fwallet%2Fpayment%2Ffailure"
    )
  })

  it("falls back when next is unsafe", () => {
    expect(loginPath("https://evil.example")).toBe("/login?next=%2Faccount")
  })
})

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
