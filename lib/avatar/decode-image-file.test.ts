import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  MAX_SOURCE_EDGE,
  decodeImageFile,
} from "@/lib/avatar/decode-image-file"
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
      width: 1200,
      height: 900,
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
      expect(decoded.bitmap.width).toBe(1200)
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

  it("downsamples a photo larger than the crop source limit", async () => {
    const full = { width: 4032, height: 3024, close: vi.fn() }
    const scale = MAX_SOURCE_EDGE / full.width
    const limited = {
      width: MAX_SOURCE_EDGE,
      height: Math.round(full.height * scale),
      close: vi.fn(),
    }
    createImageBitmapMock
      .mockResolvedValueOnce(full)
      .mockResolvedValueOnce(limited)

    const drawImage = vi.fn()
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({
        fillStyle: "",
        imageSmoothingEnabled: false,
        imageSmoothingQuality: "low",
        fillRect: vi.fn(),
        drawImage,
      } as unknown as CanvasRenderingContext2D)
    const originalToBlob = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback, type) {
      callback?.(new Blob([new Uint8Array(32)], { type }))
    }

    try {
      const file = new File([new Uint8Array([1, 2, 3])], "phone.jpg")
      const decoded = await decodeImageFile(file, "jpeg")

      expect(full.close).toHaveBeenCalledOnce()
      expect(decoded.bitmap).toBe(limited)
      expect(decoded.previewBlob).not.toBe(file)
      expect(decoded.previewBlob.type).toBe("image/jpeg")
      expect(drawImage).toHaveBeenCalledWith(
        full,
        0,
        0,
        limited.width,
        limited.height
      )
    } finally {
      getContext.mockRestore()
      HTMLCanvasElement.prototype.toBlob = originalToBlob
    }
  })

  it("replaces a large HEIC preview instead of keeping the full JPEG", async () => {
    const full = { width: 4032, height: 3024, close: vi.fn() }
    const limited = { width: MAX_SOURCE_EDGE, height: 1536, close: vi.fn() }
    createImageBitmapMock
      .mockResolvedValueOnce(full)
      .mockResolvedValueOnce(limited)
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillStyle: "",
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    const originalToBlob = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback, type) {
      callback?.(new Blob([new Uint8Array(16)], { type }))
    }

    try {
      const file = new File([new Uint8Array([1])], "IMG.heic", { type: "" })
      const fullJpeg = jpegBlob()
      heicTo.mockResolvedValue(fullJpeg)
      const decoded = await decodeImageFile(file, "heic")

      expect(full.close).toHaveBeenCalledOnce()
      expect(decoded.previewBlob).not.toBe(fullJpeg)
      expect(decoded.previewBlob).not.toBe(file)
      expect(decoded.bitmap).toBe(limited)
    } finally {
      vi.restoreAllMocks()
      HTMLCanvasElement.prototype.toBlob = originalToBlob
    }
  })

  it("reports a corrupted image that the browser cannot decode", async () => {
    createImageBitmapMock.mockRejectedValueOnce(new Error("broken image"))
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "broken.jpg")

    await expect(decodeImageFile(file, "jpeg")).rejects.toThrow(
      avatarMessages.unreadable
    )
  })
})
