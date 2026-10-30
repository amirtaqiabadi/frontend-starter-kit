import { toPersianDigits } from "@/lib/digits"

/** User-facing copy for avatar validation and processing failures. */
export const avatarMessages = {
  unsupported:
    "این قالب تصویر پشتیبانی نمی‌شود. JPEG، PNG، WebP، HEIC یا HEIF انتخاب کنید.",
  unreadable: "تصویر قابل خواندن نیست. تصویر دیگری انتخاب کنید.",
  webpUnsupported: "مرورگر شما ساخت تصویر WebP را پشتیبانی نمی‌کند.",
  failed: "پردازش تصویر انجام نشد. دوباره تلاش کنید.",
  tooLarge(maxInputSizeMB: number) {
    return `حجم تصویر اصلی باید کمتر از ${toPersianDigits(String(maxInputSizeMB))} مگابایت باشد.`
  },
  outputTooLarge(maxSizeKB: number) {
    return `حجم تصویر بعد از فشرده‌سازی هنوز بیشتر از ${toPersianDigits(String(maxSizeKB))} کیلوبایت است. تصویر دیگری انتخاب کنید.`
  },
}

/** Validation failure with a message safe to show in the form. */
export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ImageValidationError"
  }
}

/** Processing failure with a message safe to show in the form. */
export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ImageProcessingError"
  }
}
