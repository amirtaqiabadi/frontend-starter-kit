import { describe, expect, it } from "vitest"

import { formatTehranDateTime } from "@/lib/datetime"

const now = new Date("2026-11-10T20:20:00.000Z")

describe("formatTehranDateTime", () => {
  it("drops the calendar date for today and yesterday", () => {
    expect(formatTehranDateTime("2026-11-10T20:17:09.156Z", now)).toMatch(
      /^ساعت .+ · امروز$/
    )
    expect(formatTehranDateTime("2026-11-09T20:17:09.156Z", now)).toMatch(
      /^ساعت .+ · دیروز$/
    )
  })

  it("keeps the calendar date from the day before yesterday", () => {
    expect(formatTehranDateTime("2026-11-08T08:00:00.000Z", now)).toContain(
      "، ساعت"
    )
  })
})
