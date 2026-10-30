import { beforeEach, describe, expect, it, vi } from "vitest"

import { decodeImageFile } from "@/lib/avatar/decode-image-file"
import { avatarMessages } from "@/lib/avatar/messages"

const heicTo = vi.hoisted(() => vi.fn())

vi.mock("heic-to", () => ({
  heicTo,
}))

const createImageBitmapMock = vi.fn()

/** Small JPEG-like payload used as the converted HEIC preview. */
function jpegBlob() {
  return new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" })
}

describe("decodeImageFile", () => {
  beforeEach(() => {
    createImageBitmapMock.mockReset()
    createImageBitmapMock.mockResolvedValue({
      width: 4032,
      height: 3024,
      close: vi.fn(),
    })
    vi.stubGlobal("createImageBitmap", createImageBitmapMock)
    heicTo.mockReset()
    heicTo.mockResolvedValue(jpegBlob())
  })

  it.each(["jpeg", "png", "webp"] as const)(
    "corrects orientation for a %s photo",
    async (format) => {
      const file = new File([new Uint8Array([1, 2, 3])], `photo.${format}`)
      const decoded = await decodeImageFile(file, format)

      expect(heicTo).not.toHaveBeenCalled()
      expect(createImageBitmapMock).toHaveBeenCalledWith(file, {
        imageOrientation: "from-image",
      })
      expect(decoded.previewBlob).toBe(file)
      expect(decoded.bitmap.width).toBe(4032)
    }
  )

  it.each(["heic", "heif"] as const)(
    "decodes %s with heic-to and does not rotate the pixels again",
    async (format) => {
      const file = new File([new Uint8Array([1])], `IMG.${format}`, {
        type: "",
      })
      const decoded = await decodeImageFile(file, format)
      const preview = await heicTo.mock.results[0]?.value

      expect(heicTo).toHaveBeenCalledWith({
        blob: file,
        type: "image/jpeg",
        quality: 0.92,
      })
      expect(createImageBitmapMock).toHaveBeenCalledTimes(1)
      expect(createImageBitmapMock.mock.calls[0]?.[0]).toBe(preview)
      expect(createImageBitmapMock.mock.calls[0]?.[1]).toEqual({
        imageOrientation: "none",
      })
      expect(decoded.previewBlob).toBe(preview)
      expect(decoded.previewBlob).not.toBe(file)
    }
  )

  it("reports a corrupted image that the browser cannot decode", async () => {
    createImageBitmapMock.mockRejectedValueOnce(new Error("broken image"))
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "broken.jpg")

    await expect(decodeImageFile(file, "jpeg")).rejects.toThrow(
      avatarMessages.unreadable
    )
  })
})
