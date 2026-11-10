import { describe, expect, it } from "vitest"

import { normalizeOtp, otpFromClipboard } from "@/features/login/phone"

describe("otpFromClipboard", () => {
  it("accepts an exact five-digit code, including Persian digits", () => {
    expect(otpFromClipboard("97908")).toBe("97908")
    expect(otpFromClipboard("کد: ۹۷۹۰۸")).toBe("97908")
    expect(normalizeOtp("۹۷۹۰۸")).toBe("97908")
  })

  it("rejects text that is not exactly five digits", () => {
    expect(otpFromClipboard("")).toBe("")
    expect(otpFromClipboard("سلام")).toBe("")
    expect(otpFromClipboard("9790")).toBe("")
    expect(otpFromClipboard("09125550123")).toBe("")
  })
})
