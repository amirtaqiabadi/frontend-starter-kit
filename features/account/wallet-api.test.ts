import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createWallet,
  initiatePayment,
  listWallets,
  recoverPayment,
  WalletApiError,
} from "@/features/account/wallet-api"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.cookie = "csrf-token=; max-age=0"
})

/** JSON response with optional extra fields the client must ignore. */
function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })
}

describe("listWallets", () => {
  it("reads wallets and ignores extra fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(200, {
          wallets: [
            {
              teamId: "4",
              displayName: "Travel",
              role: "owner",
              availableBalance: 5000,
              restrictedBalance: 0,
              leftover: true,
            },
            {
              teamId: 5,
              displayName: "",
              role: "moderator",
              extra: 1,
            },
          ],
          ignored: "x",
        })
      )
    )

    await expect(listWallets()).resolves.toEqual([
      {
        teamId: 4,
        displayName: "Travel",
        role: "owner",
        availableBalance: 5000,
        restrictedBalance: 0,
      },
      {
        teamId: 5,
        displayName: "Personal wallet",
        role: "viewer",
        availableBalance: 0,
        restrictedBalance: 0,
      },
    ])
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/wallets",
      expect.objectContaining({
        credentials: "include",
      })
    )
  })
})

describe("createWallet", () => {
  it("retries once after INVALID_CSRF", async () => {
    document.cookie = "csrf-token=stale"
    const fetchMock = vi.fn(async (path: string, init?: RequestInit) => {
      if (init?.method === "POST" && fetchMock.mock.calls.length === 1) {
        return jsonResponse(403, {
          error: {
            type: "DOMAIN_ERROR",
            code: "INVALID_CSRF",
            message: "توکن نامعتبر است.",
            traceId: "trace-csrf",
          },
        })
      }
      if (!init?.method || init.method === "GET") {
        document.cookie = "csrf-token=fresh"
        return jsonResponse(200, { wallets: [] })
      }
      return jsonResponse(201, {
        teamId: 9,
        displayName: "Travel",
        role: "owner",
        availableBalance: 0,
        restrictedBalance: 0,
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    await expect(createWallet("Travel")).resolves.toMatchObject({
      teamId: 9,
      displayName: "Travel",
      role: "owner",
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)

    const retried = fetchMock.mock.calls[2]?.[1] as RequestInit
    expect(retried.headers).toMatchObject({
      "x-csrf-token": "fresh",
    })
  })
})

describe("initiatePayment", () => {
  it("keeps a safe payment URL and attempt id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(200, {
          paymentUrl:
            "https://sandbox.zarinpal.com/pg/StartPay/A00000000000000000000000000123456789",
          attemptId: 18,
          extra: true,
        })
      )
    )

    await expect(
      initiatePayment({ amount: 50000, description: "شارژ کیف پول", teamId: 4 })
    ).resolves.toEqual({
      paymentUrl:
        "https://sandbox.zarinpal.com/pg/StartPay/A00000000000000000000000000123456789",
      attemptId: 18,
    })
  })

  it("rejects a non-http payment URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(200, { paymentUrl: "javascript:alert(1)", attemptId: 1 })
      )
    )

    await expect(
      initiatePayment({ amount: 50000, description: "شارژ کیف پول" })
    ).rejects.toMatchObject({ code: "UNKNOWN" })
  })
})

describe("recoverPayment", () => {
  it("treats a missing recovered count as zero", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, { note: "none" }))
    )

    await expect(recoverPayment()).resolves.toEqual({ recovered: 0 })
  })
})

describe("wallet errors", () => {
  it("reads code, message, type, and traceId", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          403,
          {
            error: {
              type: "DOMAIN_ERROR",
              code: "TEAM_FORBIDDEN",
              message: "برای این کیف پول دسترسی ندارید.",
              traceId: "8c0d0b0e-3b1e-4f0a-9c2d-1a2b3c4d5e6f",
              extra: "nope",
            },
          },
          { "x-request-id": "8c0d0b0e-3b1e-4f0a-9c2d-1a2b3c4d5e6f" }
        )
      )
    )

    const error = await listWallets().catch((reason) => reason)
    expect(error).toBeInstanceOf(WalletApiError)
    expect(error).toMatchObject({
      code: "TEAM_FORBIDDEN",
      message: "برای این کیف پول دسترسی ندارید.",
      type: "DOMAIN_ERROR",
      traceId: "8c0d0b0e-3b1e-4f0a-9c2d-1a2b3c4d5e6f",
      status: 403,
    })
  })
})
