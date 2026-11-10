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

/** Formats a Toman entry and keeps it at or below the given maximum. */
export function limitTomanInput(value: string, max: number) {
  const formatted = formatTomanInput(value)
  const toman = tomanInputToRial(formatted) / 10
  if (!toman || toman <= max) {
    return formatted
  }

  return formatTomanInput(String(max))
}

const ONES = [
  "",
  "یک",
  "دو",
  "سه",
  "چهار",
  "پنج",
  "شش",
  "هفت",
  "هشت",
  "نه",
]
const TEENS = [
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
]
const TENS = [
  "",
  "",
  "بیست",
  "سی",
  "چهل",
  "پنجاه",
  "شصت",
  "هفتاد",
  "هشتاد",
  "نود",
]
const HUNDREDS = [
  "",
  "صد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
]
const SCALES = ["", "هزار", "میلیون", "میلیارد"]

/** Spells a three-digit group in Persian. */
function spellGroup(value: number) {
  const parts: string[] = []
  const hundred = Math.floor(value / 100)
  const rest = value % 100
  if (hundred) {
    parts.push(HUNDREDS[hundred] ?? "")
  }
  if (rest >= 10 && rest < 20) {
    parts.push(TEENS[rest - 10] ?? "")
  } else {
    const ten = Math.floor(rest / 10)
    const one = rest % 10
    if (ten) {
      parts.push(TENS[ten] ?? "")
    }
    if (one) {
      parts.push(ONES[one] ?? "")
    }
  }
  return parts.filter(Boolean).join(" و ")
}

/** Spells a positive integer in Persian. */
function spellNumber(value: number) {
  const groups: number[] = []
  let rest = value
  while (rest > 0) {
    groups.push(rest % 1000)
    rest = Math.floor(rest / 1000)
  }

  const parts: string[] = []
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index] ?? 0
    if (!group) {
      continue
    }
    const scale = SCALES[index] ?? ""
    if (!scale) {
      parts.push(spellGroup(group))
      continue
    }
    if (index === 1 && group === 1) {
      parts.push(scale)
      continue
    }
    parts.push(`${spellGroup(group)} ${scale}`)
  }
  return parts.join(" و ")
}

/** Spells a Toman entry in Persian, including the currency name. */
export function formatTomanWords(value: string) {
  const rial = tomanInputToRial(value)
  if (!rial) {
    return ""
  }
  return `${spellNumber(rial / 10)} تومان`
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
