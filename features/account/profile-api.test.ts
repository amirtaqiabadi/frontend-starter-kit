import { afterEach, describe, expect, it, vi } from "vitest"
import {
  getProfile,
  ProfileApiError,
  updateProfileName,
  uploadAvatar,
  deleteAvatar,
} from "./profile-api"

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
  it("uploads the original file as multipart with the session and CSRF token", async () => {
    document.cookie = "csrf-token=hello%2Bworld"
    const fetchMock = vi.fn(async () =>
      Response.json({ avatarUrl: "https://example.com/new.webp" })
    )
    vi.stubGlobal("fetch", fetchMock)
    const file = new File(["image"], "photo.png", { type: "image/png" })
    await expect(uploadAvatar(file)).resolves.toBe(
      "https://example.com/new.webp"
    )
    const [url, options] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ]
    expect(url).toBe("/api/v1/user/avatar")
    expect(options).toMatchObject({
      method: "POST",
      credentials: "include",
      headers: { "x-csrf-token": "hello+world" },
    })
    expect((options.body as FormData).getAll("file")).toEqual([file])
  })

  it("reports upload failures and rejects malformed success responses", async () => {
    const file = new File(["image"], "photo.png", { type: "image/png" })
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: { code: "AVATAR_TOO_LARGE" } }, { status: 413 })
      )
    )
    await expect(uploadAvatar(file)).rejects.toMatchObject({
      status: 413,
      message: expect.stringContaining("۵ مگابایت"),
    })
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ avatarUrl: null }))
    )
    await expect(uploadAvatar(file)).rejects.toBeInstanceOf(ProfileApiError)
  })
  it("deletes the avatar with credentials and CSRF and no body", async () => {
    document.cookie = "csrf-token=hello%2Bworld"
    const fetchMock = vi.fn(async () => Response.json({ avatarUrl: null }))
    vi.stubGlobal("fetch", fetchMock)
    await expect(deleteAvatar()).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/user/avatar", {
      method: "DELETE",
      credentials: "include",
      headers: { "x-csrf-token": "hello+world" },
    })
  })

  it("preserves the avatar when delete fails or returns an invalid response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: { message: "خطای نشست" } }, { status: 403 })
      )
    )
    await expect(deleteAvatar()).rejects.toMatchObject({
      status: 403,
      message: "خطای نشست",
    })
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({}))
    )
    await expect(deleteAvatar()).rejects.toBeInstanceOf(ProfileApiError)
  })
})
