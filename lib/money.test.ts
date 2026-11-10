import { describe, expect, it } from "vitest"

import { formatTomanWords, limitTomanInput } from "@/lib/money"

describe("formatTomanWords", () => {
  it("spells an empty amount as nothing", () => {
    expect(formatTomanWords("")).toBe("")
    expect(formatTomanWords("۰")).toBe("")
  })

  it("spells ninety-eight thousand toman", () => {
    expect(formatTomanWords("۹۸٬۰۰۰")).toBe("نود و هشت هزار تومان")
    expect(formatTomanWords("98000")).toBe("نود و هشت هزار تومان")
  })

  it("joins thousands, millions, and the remainder", () => {
    expect(formatTomanWords("1000")).toBe("هزار تومان")
    expect(formatTomanWords("1234")).toBe("هزار و دویست و سی و چهار تومان")
    expect(formatTomanWords("2500000")).toBe("دو میلیون و پانصد هزار تومان")
    expect(formatTomanWords("1000000000")).toBe("یک میلیارد تومان")
  })
})

describe("limitTomanInput", () => {
  it("keeps an amount up to one hundred million toman", () => {
    expect(limitTomanInput("100000000", 100_000_000)).toBe("۱۰۰٬۰۰۰٬۰۰۰")
    expect(limitTomanInput("۹۸۰۰۰", 100_000_000)).toBe("۹۸٬۰۰۰")
  })

  it("caps anything above one hundred million toman", () => {
    expect(limitTomanInput("100000001", 100_000_000)).toBe("۱۰۰٬۰۰۰٬۰۰۰")
    expect(limitTomanInput("999999999999", 100_000_000)).toBe("۱۰۰٬۰۰۰٬۰۰۰")
  })
})
