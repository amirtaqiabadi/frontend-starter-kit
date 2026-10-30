import type { ImageFormat } from "@/lib/avatar/validate-image-file"
import { ImageProcessingError, avatarMessages } from "@/lib/avatar/messages"

/** Longest edge kept for the cropper. The exported avatar is 512 px. */
export const MAX_SOURCE_EDGE = 2048

export type DecodedImage = {
  bitmap: ImageBitmap
  previewBlob: Blob
}

/** Scales a size so its longest edge fits the crop source limit. */
function fittedSize(width: number, height: number) {
  const longest = Math.max(width, height)
  if (longest <= MAX_SOURCE_EDGE) {
    return { width, height, scaled: false as const }
  }

  const scale = MAX_SOURCE_EDGE / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scaled: true as const,
  }
}

/** Encodes a canvas as a JPEG the cropper can display. */
function canvasToJpeg(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new ImageProcessingError(avatarMessages.unreadable))
          return
        }
        resolve(blob)
      },
      "image/jpeg",
      0.92
    )
  })
}

/**
 * Shrinks an oversized bitmap and closes the full-resolution copy.
 * Images that already fit are returned unchanged, with no preview blob.
 */
async function boundBitmap(
  bitmap: ImageBitmap
): Promise<{ bitmap: ImageBitmap; previewBlob: Blob | null }> {
  const next = fittedSize(bitmap.width, bitmap.height)
  if (!next.scaled) {
    return { bitmap, previewBlob: null }
  }

  const canvas = document.createElement("canvas")
  canvas.width = next.width
  canvas.height = next.height
  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    throw new ImageProcessingError(avatarMessages.unreadable)
  }

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, next.width, next.height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  context.drawImage(bitmap, 0, 0, next.width, next.height)
  bitmap.close()

  const previewBlob = await canvasToJpeg(canvas)
  const limited = await createImageBitmap(canvas)
  return { bitmap: limited, previewBlob }
}

/** Decodes a file to an oriented bitmap and a same-sized preview blob. */
async function decodeOriented(file: File, format: ImageFormat) {
  if (format === "heic" || format === "heif") {
    const { heicTo } = await import("heic-to")
    const previewBlob = await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: 0.92,
    })
    const bitmap = await createImageBitmap(previewBlob, {
      imageOrientation: "none",
    })
    return { bitmap, previewBlob }
  }

  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  })
  return { bitmap, previewBlob: file }
}

/**
 * Decodes a validated image into an orientation-corrected bitmap.
 * heic-to (libheif 1.23.7, LGPL-3.0) is loaded only for HEIC/HEIF,
 * because heic2any is unmaintained and most browsers cannot decode those files.
 * libheif bakes iPhone orientation into the pixels, so the converted
 * JPEG is decoded with imageOrientation "none" to avoid rotating twice.
 * Photos larger than 2048 px on the longest edge are downsampled first,
 * so the cropper does not keep a second full-resolution copy.
 */
export async function decodeImageFile(
  file: File,
  format: ImageFormat
): Promise<DecodedImage> {
  let bitmap: ImageBitmap | null = null

  try {
    const oriented = await decodeOriented(file, format)
    bitmap = oriented.bitmap
    const bounded = await boundBitmap(bitmap)
    bitmap = bounded.bitmap
    return {
      bitmap: bounded.bitmap,
      previewBlob: bounded.previewBlob ?? oriented.previewBlob,
    }
  } catch (error) {
    bitmap?.close()
    if (error instanceof ImageProcessingError) {
      throw error
    }
    throw new ImageProcessingError(avatarMessages.unreadable)
  }
}
