import { describe, expect, it, vi } from "vitest"

import {
  AVATAR_FILENAME,
  AVATAR_MIME_TYPE,
  WEBP_INITIAL_QUALITY,
  WEBP_MIN_QUALITY,
  compressToTargetSize,
} from "@/lib/avatar/compress-to-target-size"
import { avatarMessages } from "@/lib/avatar/messages"

const MAX_BYTES = 200 * 1024

/** Builds a blob whose size is the real byte length. */
function blobOf(bytes: number) {
  return new Blob([new Uint8Array(bytes)])
}

describe("compressToTargetSize", () => {
  it("keeps the initial quality when the output is under 200 KB", async () => {
    const encode = vi.fn(async () => blobOf(145 * 1024))
    const file = await compressToTargetSize(encode, { maxBytes: MAX_BYTES })

    expect(encode).toHaveBeenCalledTimes(1)
    expect(encode).toHaveBeenCalledWith(WEBP_INITIAL_QUALITY)
    expect(file.size).toBeLessThanOrEqual(MAX_BYTES)
    expect(file.type).toBe(AVATAR_MIME_TYPE)
    expect(file.name).toBe(AVATAR_FILENAME)
  })

  it("reduces quality until the measured blob fits", async () => {
    const encode = vi.fn(async (quality: number) =>
      blobOf(quality >= WEBP_INITIAL_QUALITY ? 260 * 1024 : 180 * 1024)
    )
    const file = await compressToTargetSize(encode, { maxBytes: MAX_BYTES })

    expect(encode.mock.calls.map((call) => call[0])).toEqual([0.82, 0.74])
    expect(file.size).toBe(180 * 1024)
    expect(file.size).toBeLessThanOrEqual(MAX_BYTES)
    expect(file.type).toBe("image/webp")
    expect(file.name.endsWith(".webp")).toBe(true)
  })

  it("fails at the minimum quality instead of returning an oversized file", async () => {
    const encode = vi.fn(async (quality: number) =>
      blobOf(quality > 0 ? 300 * 1024 : 0)
    )
    const pending = compressToTargetSize(encode, { maxBytes: MAX_BYTES })

    await expect(pending).rejects.toThrow(avatarMessages.outputTooLarge(200))
    expect(encode.mock.calls.map((call) => call[0])).toEqual([
      0.82,
      0.74,
      0.66,
      0.58,
      WEBP_MIN_QUALITY,
    ])
    await expect(pending).rejects.toBeDefined()
  })
})
