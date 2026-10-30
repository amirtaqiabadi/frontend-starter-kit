import { toAsciiDigits, toPersianDigits } from "@/lib/digits"

export { toAsciiDigits, toPersianDigits }

export const OTP_LENGTH = 5
export const RESEND_SECONDS = 60
export const MOBILE_LENGTH = 11

/** Returns 09xxxxxxxxx, or an empty string when the value is not an Iranian mobile. */
export function normalizeIranMobile(value: string) {
  let digits = toAsciiDigits(value).replace(/\D/g, "")

  if (digits.startsWith("0098")) {
    digits = digits.slice(4)
  } else if (digits.startsWith("98")) {
    digits = digits.slice(2)
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1)
  }

  if (!/^9\d{9}$/.test(digits)) {
    return ""
  }

  return `0${digits}`
}

/** Groups digits as 0912 345 6789, including a partial number. */
function groupMobileDigits(digits: string) {
  const parts = [
    digits.slice(0, 4),
    digits.slice(4, 7),
    digits.slice(7, 11),
  ].filter((part) => part.length > 0)

  return parts.join(" ")
}

/** Caret position after a digit count in the grouped mobile field. */
export function mobileCaretIndex(digitCount: number) {
  const digits = Math.min(Math.max(digitCount, 0), MOBILE_LENGTH)
  const spaces = digits > 7 ? 2 : digits > 4 ? 1 : 0

  return digits + spaces
}

export const MOBILE_INPUT_MAX = mobileCaretIndex(MOBILE_LENGTH)

/** Keeps at most 11 digits, adds a leading zero, and groups them as ۰۹۱۲ ۳۴۵ ۶۷۸۹. */
export function formatMobileInput(value: string) {
  let digits = toAsciiDigits(value).replace(/\D/g, "")

  if (digits.length > 0 && !digits.startsWith("0")) {
    digits = `0${digits}`
  }

  return groupMobileDigits(toPersianDigits(digits.slice(0, MOBILE_LENGTH)))
}

/** Groups a complete Iranian mobile as ۰۹۱۲ ۳۴۵ ۶۷۸۹. */
export function formatIranMobile(value: string) {
  const phone = normalizeIranMobile(value)
  if (!phone) {
    return ""
  }

  return groupMobileDigits(toPersianDigits(phone))
}

/** Keeps only the digits of a one-time code, capped at OTP_LENGTH. */
export function normalizeOtp(value: string) {
  return toAsciiDigits(value).replace(/\D/g, "").slice(0, OTP_LENGTH)
}
