const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"

/** Renders ASCII digits as Persian digits. */
export function toPersianDigits(value: string) {
  return value.replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit)
}

/** Converts Persian and Arabic-Indic digits to ASCII digits. */
export function toAsciiDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(digit)
    if (persianIndex >= 0) {
      return String(persianIndex)
    }

    return String(ARABIC_DIGITS.indexOf(digit))
  })
}
