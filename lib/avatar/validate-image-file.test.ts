import { describe, expect, it } from "vitest"

import { avatarMessages, ImageValidationError } from "@/lib/avatar/messages"
import { validateImageFile } from "@/lib/avatar/validate-image-file"

/** Builds a file whose bytes, not its name, decide the format. */
function imageFile(bytes: Uint8Array<ArrayBuffer>, name: string, type = "") {
  return new File([bytes], name, { type })
}

/** JPEG start-of-image marker plus a short header. */
function jpegBytes() {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
}

/** PNG signature. */
function pngBytes() {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
}

/** Minimal RIFF WebP header. */
function webpBytes() {
  const bytes = new Uint8Array(12)
  bytes.set(new TextEncoder().encode("RIFF"), 0)
  bytes.set(new TextEncoder().encode("WEBP"), 8)
  return bytes
}

/** ISO BMFF ftyp box with a major brand and compatible brands. */
function ftyp(major: string, compatible: string[] = [major]) {
  const bytes = new Uint8Array(16 + compatible.length * 4)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, bytes.length)
  bytes.set(new TextEncoder().encode("ftyp"), 4)
  bytes.set(new TextEncoder().encode(major), 8)
  compatible.forEach((brand, index) => {
    bytes.set(new TextEncoder().encode(brand), 16 + index * 4)
  })
  return bytes
}

describe("validateImageFile", () => {
  it("accepts a JPEG upload", async () => {
    const file = imageFile(jpegBytes(), "photo.jpeg", "image/jpeg")
    await expect(validateImageFile(file)).resolves.toBe("jpeg")
  })

  it("accepts a JPG upload", async () => {
    const file = imageFile(jpegBytes(), "photo.jpg", "image/jpeg")
    await expect(validateImageFile(file)).resolves.toBe("jpeg")
  })

  it("accepts a PNG upload", async () => {
    const file = imageFile(pngBytes(), "photo.png", "image/png")
    await expect(validateImageFile(file)).resolves.toBe("png")
  })

  it("accepts a WebP upload", async () => {
    const file = imageFile(webpBytes(), "photo.webp", "image/webp")
    await expect(validateImageFile(file)).resolves.toBe("webp")
  })

  it("accepts a HEIC upload", async () => {
    const file = imageFile(ftyp("heic"), "IMG_0001.HEIC", "image/heic")
    await expect(validateImageFile(file)).resolves.toBe("heic")
  })

  it("accepts a HEIF upload", async () => {
    const file = imageFile(
      ftyp("mif1", ["mif1", "heif"]),
      "photo.heif",
      "image/heif"
    )
    await expect(validateImageFile(file)).resolves.toBe("heif")
  })

  it("rejects an unsupported format", async () => {
    const file = imageFile(
      new TextEncoder().encode("GIF89a"),
      "anim.gif",
      "image/gif"
    )
    await expect(validateImageFile(file)).rejects.toThrow(
      avatarMessages.unsupported
    )
  })

  it("rejects an original file larger than 10 MB", async () => {
    const header = jpegBytes()
    const padding = new Uint8Array(10 * 1024 * 1024 + 1 - header.length)
    const file = new File([header, padding], "huge.jpg", { type: "image/jpeg" })

    await expect(validateImageFile(file)).rejects.toBeInstanceOf(
      ImageValidationError
    )
    await expect(validateImageFile(file)).rejects.toThrow(
      avatarMessages.tooLarge(10)
    )
  })

  it("accepts a valid image when the MIME type is missing or wrong", async () => {
    const missing = imageFile(jpegBytes(), "photo.bin", "")
    const incorrect = imageFile(
      pngBytes(),
      "photo.txt",
      "application/octet-stream"
    )

    await expect(validateImageFile(missing)).resolves.toBe("jpeg")
    await expect(validateImageFile(incorrect)).resolves.toBe("png")
  })

  it("rejects an empty or unreadable file", async () => {
    const file = new File([], "photo.jpg", { type: "image/jpeg" })
    await expect(validateImageFile(file)).rejects.toThrow(
      avatarMessages.unreadable
    )
  })

  it("rejects AVIF even when the MIME type says HEIC", async () => {
    const file = imageFile(ftyp("avif"), "photo.heic", "image/heic")
    await expect(validateImageFile(file)).rejects.toThrow(
      avatarMessages.unsupported
    )
  })
})
