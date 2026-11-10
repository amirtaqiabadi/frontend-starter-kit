import { describe, expect, it } from "vitest"

import {
  passwordError,
  passwordLengthError,
  passwordRules,
  passwordRulesMet,
  passwordStrength,
  GUESSABLE_PASSWORD_ERROR,
  isGuessablePassword,
  stripPersianKeyboard,
} from "@/features/login/password"

describe("passwordError", () => {
  it("rejects short and common passwords", () => {
    expect(passwordError("short")).toBeTruthy()
    expect(passwordError("password")).toBeTruthy()
    expect(passwordError("12345678")).toBeTruthy()
  })

  it("rejects a famous password even when symbols are added", () => {
    expect(isGuessablePassword("Password1!")).toBe(true)
    expect(passwordError("Password1!")).toBe(GUESSABLE_PASSWORD_ERROR)
    expect(passwordStrength("Password1!")).toEqual({ score: 1, label: "ضعیف" })
  })

  it("accepts a password with length, both cases, a digit, and a symbol", () => {
    expect(passwordError("Secret12!")).toBe("")
    expect(passwordRulesMet("Secret12!")).toBe(true)
  })

  it("rejects a password that misses a required character class", () => {
    expect(passwordError("correct horse")).toBeTruthy()
    expect(passwordRules("correct horse").map((rule) => rule.met)).toEqual([
      true,
      false,
      false,
      false,
    ])
  })

  it("allows a common password through on length-only checks", () => {
    expect(passwordLengthError("password")).toBe("")
  })
})

describe("passwordStrength", () => {
  it("stays empty until the user types", () => {
    expect(passwordStrength("")).toEqual({ score: 0, label: "" })
  })

  it("rises as more password rules are met", () => {
    expect(passwordStrength("a")).toEqual({ score: 1, label: "ضعیف" })
    expect(passwordStrength("abcdefgZ")).toEqual({ score: 2, label: "متوسط" })
    expect(passwordStrength("Secret12")).toEqual({ score: 3, label: "خوب" })
    expect(passwordStrength("Secret12!")).toEqual({ score: 4, label: "قوی" })
  })
})
describe("stripPersianKeyboard", () => {
  it("drops Persian letters and digits and keeps Latin text", () => {
    expect(stripPersianKeyboard("abسلام12۳۴")).toEqual({
      value: "ab12",
      rejected: true,
    })
  })

  it("leaves a Latin password unchanged", () => {
    expect(stripPersianKeyboard("Secret-12")).toEqual({
      value: "Secret-12",
      rejected: false,
    })
  })
})
