import type { ImageFormat } from "@/lib/avatar/validate-image-file"
import { ImageProcessingError, avatarMessages } from "@/lib/avatar/messages"

export type DecodedImage = {
  bitmap: ImageBitmap
  previewBlob: Blob
}

/**
 * Decodes a validated image into an orientation-corrected bitmap.
 * heic-to (libheif 1.23.7, LGPL-3.0) is loaded only for HEIC/HEIF,
 * because heic2any is unmaintained and most browsers cannot decode those files.
 * libheif bakes iPhone orientation into the pixels, so the converted
 * JPEG is decoded with imageOrientation "none" to avoid rotating twice.
 */
export async function decodeImageFile(
  file: File,
  format: ImageFormat
): Promise<DecodedImage> {
  try {
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
  } catch (error) {
    if (error instanceof ImageProcessingError) {
      throw error
    }
    throw new ImageProcessingError(avatarMessages.unreadable)
  }
}
