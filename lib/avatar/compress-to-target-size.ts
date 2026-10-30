import { ImageProcessingError, avatarMessages } from "@/lib/avatar/messages"

export const WEBP_INITIAL_QUALITY = 0.82
export const WEBP_MIN_QUALITY = 0.5
export const WEBP_QUALITY_STEP = 0.08
export const AVATAR_FILENAME = "avatar.webp"
export const AVATAR_MIME_TYPE = "image/webp"

type CompressOptions = {
  maxBytes: number
  initialQuality?: number
  minQuality?: number
  qualityStep?: number
}

/** Lets the browser paint between compression attempts. */
function yieldToMain() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

/** Lowers WebP quality until the real blob fits, or throws at the minimum quality. */
export async function compressToTargetSize(
  encode: (quality: number) => Promise<Blob>,
  {
    maxBytes,
    initialQuality = WEBP_INITIAL_QUALITY,
    minQuality = WEBP_MIN_QUALITY,
    qualityStep = WEBP_QUALITY_STEP,
  }: CompressOptions
) {
  let quality = initialQuality
  let blob = await encode(quality)

  while (blob.size > maxBytes && quality > minQuality) {
    const next = Math.max(
      minQuality,
      Math.round((quality - qualityStep) * 100) / 100
    )
    if (next >= quality) {
      break
    }

    quality = next
    await yieldToMain()
    blob = await encode(quality)
  }

  if (blob.size > maxBytes) {
    throw new ImageProcessingError(
      avatarMessages.outputTooLarge(Math.round(maxBytes / 1024))
    )
  }

  return new File([blob], AVATAR_FILENAME, { type: AVATAR_MIME_TYPE })
}
