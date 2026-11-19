import { afterEach, describe, expect, it, vi } from "vitest"
import { getProfile, ProfileApiError, updateProfileName } from "./profile-api"

afterEach(() => {
  vi.unstubAllGlobals()
  document.cookie = "csrf-token=; max-age=0"
})

describe("profile API", () => {
  it("loads the signed-in profile with credentials", async () => {
    const profile = {
      name: null,
      phoneNumber: "09123456789",
      avatarUrl: null,
      hasPassword: true,
      token: "AC234",
      walletIds: [4, 7],
    }
    const fetchMock = vi.fn(async () => Response.json(profile))
    vi.stubGlobal("fetch", fetchMock)
    await expect(getProfile()).resolves.toEqual(profile)
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/user",
      expect.objectContaining({ method: "GET", credentials: "include" })
    )
  })

  it("accepts an empty wallet list and rejects invalid wallet IDs", async () => {
    const profile = {
      name: null,
      phoneNumber: "09123456789",
      avatarUrl: null,
      hasPassword: false,
      token: "AC234",
      walletIds: [],
    }
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(profile))
    )
    await expect(getProfile()).resolves.toEqual(profile)
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ ...profile, walletIds: ["4"] }))
    )
    await expect(getProfile()).rejects.toBeInstanceOf(ProfileApiError)
  })

  it("sends only the name and decoded CSRF token", async () => {
    document.cookie = "csrf-token=hello%2Bworld"
    const fetchMock = vi.fn(async () => Response.json({ name: "علی" }))
    vi.stubGlobal("fetch", fetchMock)
    await expect(updateProfileName("علی")).resolves.toBe("علی")
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/user",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "hello+world",
        },
        body: JSON.stringify({ name: "علی" }),
      })
    )
  })

  it("preserves server error messages and status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { error: { message: "نام نامعتبر است" } },
          { status: 400 }
        )
      )
    )
    await expect(updateProfileName("")).rejects.toMatchObject({
      message: "نام نامعتبر است",
      status: 400,
    } satisfies Partial<ProfileApiError>)
  })
})
