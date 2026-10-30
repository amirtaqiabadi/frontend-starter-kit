import { toAsciiDigits, toPersianDigits } from "@/lib/digits"

const THOUSANDS = "٬"
const MAX_TOMAN_DIGITS = 12

/** Keeps the digits of a Toman entry, without leading zeros. */
function tomanDigits(value: string) {
  return toAsciiDigits(value)
    .replace(/\D/g, "")
    .replace(/^0+/, "")
    .slice(0, MAX_TOMAN_DIGITS)
}

/** Groups a Toman entry in threes and shows Persian digits. */
export function formatTomanInput(value: string) {
  const digits = tomanDigits(value)
  if (!digits) {
    return ""
  }

  return toPersianDigits(
    Number(digits).toLocaleString("en-US").replaceAll(",", THOUSANDS)
  )
}

/** Converts a Toman entry to stored Rial, or 0 when it is empty or unsafe. */
export function tomanInputToRial(value: string) {
  const digits = tomanDigits(value)
  if (!digits) {
    return 0
  }

  const toman = Number(digits)
  const rial = toman * 10
  if (!Number.isSafeInteger(toman) || !Number.isSafeInteger(rial)) {
    return 0
  }

  return rial
}

/** Formats stored Rial as grouped Toman. */
export function formatToman(amountRial: number) {
  const toman = Math.trunc(amountRial / 10)
  const grouped = Math.abs(toman)
    .toLocaleString("en-US")
    .replaceAll(",", THOUSANDS)

  return `${toPersianDigits(grouped)} تومان`
}

/** Caret index after a digit count in a grouped Toman field. */
export function tomanCaretIndex(formatted: string, digitCount: number) {
  if (digitCount <= 0) {
    return 0
  }

  let seen = 0
  for (let index = 0; index < formatted.length; index += 1) {
    if (formatted[index] === THOUSANDS) {
      continue
    }

    seen += 1
    if (seen === digitCount) {
      return index + 1
    }
  }

  return formatted.length
}
