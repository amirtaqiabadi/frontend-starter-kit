import { afterEach, describe, expect, it, vi } from "vitest"

import {
  formatLoginError,
  identifyAccount,
  LoginApiError,
  requestOtp,
  verifyOtp,
} from "@/features/login/login-api"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/** JSON response with optional extra fields the client must ignore. */
function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("identifyAccount", () => {
  it("reads nextStep and ignores extra fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(200, { nextStep: "OTP", extra: true, nested: { a: 1 } })
      )
    )

    await expect(identifyAccount("09123456789")).resolves.toEqual({
      nextStep: "OTP",
    })
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/identify",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    )
  })
})

describe("requestOtp", () => {
  it("keeps cooldown and a 5-digit dev code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(200, {
          cooldownSeconds: 90,
          devCode: "12345",
          ignored: "x",
        })
      )
    )

    await expect(requestOtp("09123456789")).resolves.toEqual({
      cooldownSeconds: 90,
      devCode: "12345",
    })
  })

  it("falls back when cooldown is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, { note: "no cooldown" }))
    )

    await expect(requestOtp("09123456789")).resolves.toEqual({
      cooldownSeconds: 120,
      devCode: "",
    })
  })
})

describe("verifyOtp", () => {
  it("treats a missing hasPassword as no password", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(200, { redirectTo: "/account", leftover: 1 })
      )
    )

    await expect(
      verifyOtp({ phoneNumber: "09123456789", code: "12345" })
    ).resolves.toEqual({
      hasPassword: false,
      redirectTo: "/account",
    })
  })

  it("rejects an unsafe redirectTo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(200, {
          hasPassword: true,
          redirectTo: "https://evil.example",
        })
      )
    )

    await expect(
      verifyOtp({ phoneNumber: "09123456789", code: "12345" })
    ).resolves.toEqual({
      hasPassword: true,
      redirectTo: "/account",
    })
  })
})

describe("auth errors", () => {
  it("reads code, message, and attemptsRemaining", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(401, {
          error: {
            code: "OTP_MISMATCH",
            message: "کد نادرست است.",
            attemptsRemaining: 2,
            extra: "nope",
          },
        })
      )
    )

    const error = await identifyAccount("09123456789").catch((reason) => reason)
    expect(error).toBeInstanceOf(LoginApiError)
    expect(error).toMatchObject({
      code: "OTP_MISMATCH",
      message: "کد نادرست است.",
      attemptsRemaining: 2,
      status: 401,
    })
    expect(formatLoginError(error)).toContain("۲")
  })
})
