import { toAsciiDigits, toPersianDigits } from "@/lib/digits"

export const CARD_LENGTH = 16

/** Keeps at most 16 digits and groups them as 1234 5678 9012 3456. */
export function formatCardInput(value: string) {
  const digits = toAsciiDigits(value).replace(/\D/g, "").slice(0, CARD_LENGTH)
  const groups = digits.match(/.{1,4}/g) ?? []

  return toPersianDigits(groups.join(" "))
}

/** Returns the ASCII digits of a card entry. */
export function cardDigits(value: string) {
  return toAsciiDigits(value).replace(/\D/g, "").slice(0, CARD_LENGTH)
}

/** Caret index after a digit count in a grouped card field. */
export function cardCaretIndex(formatted: string, digitCount: number) {
  if (digitCount <= 0) {
    return 0
  }

  let seen = 0
  for (let index = 0; index < formatted.length; index += 1) {
    if (formatted[index] === " ") {
      continue
    }

    seen += 1
    if (seen === digitCount) {
      return index + 1
    }
  }

  return formatted.length
}
