"use client"

import { useEffect, useRef, useState } from "react"
import { LoaderCircleIcon, UserIcon } from "lucide-react"

import { ImageCropDialog } from "@/components/organisms/avatar-uploader/image-crop-dialog"
import { Button } from "@/components/ui/button"
import { decodeImageFile } from "@/lib/avatar/decode-image-file"
import { AVATAR_MIME_TYPE } from "@/lib/avatar/compress-to-target-size"
import {
  ImageProcessingError,
  ImageValidationError,
  avatarMessages,
} from "@/lib/avatar/messages"
import {
  processAvatarImage,
  type PixelCrop,
} from "@/lib/avatar/process-avatar-image"
import { validateImageFile } from "@/lib/avatar/validate-image-file"

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"

type AvatarUploaderProps = {
  value?: string
  onChange: (file: File) => void
  onRemove: () => void
  maxSizeKB?: number
  maxInputSizeMB?: number
  outputSize?: number
  disabled?: boolean
  imageLabel?: string
}

/** Uses a data URL as a background only when it cannot break out of the CSS string. */
function avatarBackground(value: string) {
  if (!value || /["\\)]/.test(value)) {
    return undefined
  }

  return { backgroundImage: `url("${value}")` }
}

/** Returns a Persian message for known image errors. */
function errorMessage(error: unknown) {
  if (
    error instanceof ImageValidationError ||
    error instanceof ImageProcessingError
  ) {
    return error.message
  }

  return avatarMessages.failed
}

/** Selects, crops, and replaces a square avatar without uploading the original. */
export function AvatarUploader({
  value = "",
  onChange,
  onRemove,
  maxSizeKB = 200,
  maxInputSizeMB = 10,
  outputSize = 512,
  disabled = false,
  imageLabel = "آواتار",
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const busyRef = useRef(false)
  const previewUrlRef = useRef<string | null>(null)
  const bitmapRef = useRef<ImageBitmap | null>(null)
  const [processing, setProcessing] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState("")

  function releasePreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    bitmapRef.current?.close()
    bitmapRef.current = null
    setPreviewUrl(null)
    setCropOpen(false)
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
      bitmapRef.current?.close()
    }
  }, [])

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || busyRef.current || disabled) {
      return
    }

    busyRef.current = true
    setProcessing(true)
    setError("")

    try {
      const format = await validateImageFile(file, maxInputSizeMB)
      const decoded = await decodeImageFile(file, format)
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
      bitmapRef.current?.close()
      const url = URL.createObjectURL(decoded.previewBlob)
      previewUrlRef.current = url
      bitmapRef.current = decoded.bitmap
      setPreviewUrl(url)
      setCropOpen(true)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      busyRef.current = false
      setProcessing(false)
    }
  }

  async function onConfirm(crop: PixelCrop) {
    const bitmap = bitmapRef.current
    if (!bitmap || busyRef.current) {
      return
    }

    busyRef.current = true
    setProcessing(true)
    setError("")

    try {
      const file = await processAvatarImage({
        source: bitmap,
        crop,
        outputSize,
        maxSizeKB,
      })
      if (file.size > maxSizeKB * 1024 || file.type !== AVATAR_MIME_TYPE) {
        throw new ImageProcessingError(avatarMessages.outputTooLarge(maxSizeKB))
      }
      onChange(file)
      releasePreview()
    } catch (caught) {
      setError(errorMessage(caught))
      releasePreview()
    } finally {
      busyRef.current = false
      setProcessing(false)
    }
  }

  const background = avatarBackground(value)
  const locked = disabled || processing || cropOpen
  const uploadLabel = processing
    ? "در حال پردازش"
    : value
      ? "تغییر تصویر"
      : "افزودن تصویر"

  return (
    <div className="flex flex-col items-center gap-4" aria-busy={processing}>
      <div
        role="img"
        aria-label={imageLabel}
        className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted bg-cover bg-center"
        style={background}
      >
        {background ? null : (
          <UserIcon className="size-10 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-2">
          <input
            ref={inputRef}
            id="avatar"
            name="avatar"
            type="file"
            accept={ACCEPT}
            aria-label="تصویر حساب"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "avatar-error" : undefined}
            className="sr-only"
            disabled={locked}
            onChange={(event) => {
              void onFileChange(event)
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={locked}
            onClick={() => inputRef.current?.click()}
          >
            {processing ? <LoaderCircleIcon className="animate-spin" /> : null}
            {uploadLabel}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              disabled={locked}
              onClick={() => {
                setError("")
                onRemove()
              }}
            >
              حذف تصویر
            </Button>
          ) : null}
        </div>
        {error ? (
          <p
            id="avatar-error"
            className="text-center text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
      {previewUrl ? (
        <ImageCropDialog
          key={previewUrl}
          open={cropOpen}
          imageUrl={previewUrl}
          pending={processing}
          onCancel={releasePreview}
          onConfirm={(crop) => {
            void onConfirm(crop)
          }}
        />
      ) : null}
    </div>
  )
}
