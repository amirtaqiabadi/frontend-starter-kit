import { compressToTargetSize } from "@/lib/avatar/compress-to-target-size"
import { ImageProcessingError, avatarMessages } from "@/lib/avatar/messages"

export type PixelCrop = {
  x: number
  y: number
  width: number
  height: number
}

/** Encodes one canvas frame as a WebP blob at the requested quality. */
function canvasToWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== "image/webp") {
          reject(new ImageProcessingError(avatarMessages.webpUnsupported))
          return
        }
        resolve(blob)
      },
      "image/webp",
      quality
    )
  })
}

/** Crops, resizes to a square, and compresses an oriented bitmap to WebP. */
export async function processAvatarImage({
  source,
  crop,
  outputSize = 512,
  maxSizeKB = 200,
}: {
  source: CanvasImageSource
  crop: PixelCrop
  outputSize?: number
  maxSizeKB?: number
}) {
  if (crop.width <= 0 || crop.height <= 0) {
    throw new ImageProcessingError(avatarMessages.unreadable)
  }

  const canvas = document.createElement("canvas")
  canvas.width = outputSize
  canvas.height = outputSize
  const context = canvas.getContext("2d")
  if (!context) {
    throw new ImageProcessingError(avatarMessages.webpUnsupported)
  }

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, outputSize, outputSize)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  context.drawImage(
    source,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize
  )

  return compressToTargetSize((quality) => canvasToWebp(canvas, quality), {
    maxBytes: maxSizeKB * 1024,
  })
}
