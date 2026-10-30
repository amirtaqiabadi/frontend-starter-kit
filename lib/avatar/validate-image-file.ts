import { ImageValidationError, avatarMessages } from "@/lib/avatar/messages"

export type ImageFormat = "jpeg" | "png" | "webp" | "heic" | "heif"

const HEIC_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
])
const HEIF_BRANDS = new Set(["heif", "mif1", "msf1"])
const REJECTED_BRANDS = new Set(["avif", "avis"])

/** Reads a four-character ISO brand or signature from a header. */
function readAscii(bytes: Uint8Array, start: number, end: number) {
  let text = ""
  for (let index = start; index < end; index += 1) {
    text += String.fromCharCode(bytes[index] ?? 0)
  }
  return text
}

/** Returns true when the header is a JPEG start-of-image marker. */
function isJpeg(bytes: Uint8Array) {
  return (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
}

/** Returns true when the header is a PNG signature. */
function isPng(bytes: Uint8Array) {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
}

/** Returns true when the header is a RIFF WebP file. */
function isWebp(bytes: Uint8Array) {
  return (
    bytes.length >= 12 &&
    readAscii(bytes, 0, 4) === "RIFF" &&
    readAscii(bytes, 8, 12) === "WEBP"
  )
}

/** Collects the major brand and compatible brands from an ftyp box. */
function readBrands(bytes: Uint8Array) {
  if (bytes.length < 12 || readAscii(bytes, 4, 8) !== "ftyp") {
    return []
  }

  const brands = [readAscii(bytes, 8, 12)]
  for (let offset = 16; offset + 4 <= bytes.length; offset += 4) {
    brands.push(readAscii(bytes, offset, offset + 4))
  }
  return brands
}

/** Maps ISO BMFF brands to HEIC or HEIF, and rejects AVIF. */
function formatFromBrands(brands: string[]): ImageFormat | null {
  if (brands.some((brand) => REJECTED_BRANDS.has(brand))) {
    return null
  }
  if (brands.some((brand) => HEIC_BRANDS.has(brand))) {
    return "heic"
  }
  if (brands.some((brand) => HEIF_BRANDS.has(brand))) {
    return "heif"
  }
  return null
}

/** Detects a supported image from its header, ignoring the filename and MIME type. */
export async function validateImageFile(
  file: File,
  maxInputSizeMB = 10
): Promise<ImageFormat> {
  const maxBytes = maxInputSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    throw new ImageValidationError(avatarMessages.tooLarge(maxInputSizeMB))
  }
  if (file.size === 0) {
    throw new ImageValidationError(avatarMessages.unreadable)
  }

  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer())
  if (isJpeg(bytes)) {
    return "jpeg"
  }
  if (isPng(bytes)) {
    return "png"
  }
  if (isWebp(bytes)) {
    return "webp"
  }

  const heifFormat = formatFromBrands(readBrands(bytes))
  if (heifFormat) {
    return heifFormat
  }

  throw new ImageValidationError(avatarMessages.unsupported)
}
