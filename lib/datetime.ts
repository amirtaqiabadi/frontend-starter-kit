import { toPersianDigits } from "@/lib/digits"

const tehranDate = new Intl.DateTimeFormat("fa-IR", {
  calendar: "persian",
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "long",
  day: "numeric",
})

const tehranDateWithoutYear = new Intl.DateTimeFormat("fa-IR", {
  calendar: "persian",
  timeZone: "Asia/Tehran",
  month: "long",
  day: "numeric",
})

const tehranTime = new Intl.DateTimeFormat("fa-IR", {
  calendar: "persian",
  timeZone: "Asia/Tehran",
  hour: "2-digit",
  minute: "2-digit",
})

const tehranJalaliYear = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  timeZone: "Asia/Tehran",
  year: "numeric",
})

const tehranGregorianDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

/** Jalali year of a UTC instant in the Tehran timezone. */
function jalaliYear(date: Date) {
  const year = tehranJalaliYear
    .formatToParts(date)
    .find((part) => part.type === "year")?.value

  return Number(year)
}

/** Whole Tehran calendar days since the Unix epoch. */
function tehranDayIndex(date: Date) {
  const [year, month, day] = tehranGregorianDay
    .format(date)
    .split("-")
    .map(Number)

  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}

/** Relative label such as امروز or ۳ روز پیش, measured in Tehran days. */
function relativeTehranDate(date: Date, now: Date) {
  const days = tehranDayIndex(now) - tehranDayIndex(date)
  if (days < 0) {
    return "در آینده"
  }
  if (days === 0) {
    return "امروز"
  }
  if (days === 1) {
    return "دیروز"
  }
  if (days === 2) {
    return "پریروز"
  }
  if (days < 7) {
    return `${toPersianDigits(String(days))} روز پیش`
  }
  if (days < 30) {
    return `${toPersianDigits(String(Math.floor(days / 7)))} هفته پیش`
  }
  if (days < 365) {
    return `${toPersianDigits(String(Math.floor(days / 30)))} ماه پیش`
  }

  return `${toPersianDigits(String(Math.floor(days / 365)))} سال پیش`
}

/** Formats a UTC timestamp in Tehran, hiding the Jalali year when it is the current one. */
export function formatTehranDateTime(isoUtc: string, now = new Date()) {
  const date = new Date(isoUtc)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const sameYear = jalaliYear(date) === jalaliYear(now)
  const datePart = (sameYear ? tehranDateWithoutYear : tehranDate).format(date)
  const timePart = tehranTime.format(date)

  return `${datePart}، ساعت ${timePart} · ${relativeTehranDate(date, now)}`
}
