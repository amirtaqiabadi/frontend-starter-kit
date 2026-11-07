import { describe, expect, it } from "vitest"

import { passwordError, passwordLengthError } from "@/features/login/password"

describe("passwordError", () => {
  it("rejects short and common passwords", () => {
    expect(passwordError("short")).toBeTruthy()
    expect(passwordError("password")).toBeTruthy()
    expect(passwordError("12345678")).toBeTruthy()
  })

  it("accepts a long enough uncommon password", () => {
    expect(passwordError("correct horse")).toBe("")
  })

  it("allows a common password through on length-only checks", () => {
    expect(passwordLengthError("password")).toBe("")
  })
})
