import { afterEach, describe, expect, it } from "vitest"

import {
  clearInviteToken,
  normalizeInviteToken,
  readInviteToken,
  rememberInviteToken,
} from "@/features/login/invite-token"

afterEach(() => {
  window.sessionStorage.clear()
})

describe("invite token", () => {
  it("stores a hyphenated token in canonical form", () => {
    rememberInviteToken("a2c4-6")

    expect(readInviteToken()).toBe("A2C46")
  })

  it("keeps a token that does not match the alphabet", () => {
    rememberInviteToken("A2C40")

    expect(normalizeInviteToken("A2C40")).toBe("A2C40")
    expect(readInviteToken()).toBe("A2C40")
  })

  it("does not replace a saved token with an empty value", () => {
    rememberInviteToken("A2C46")
    rememberInviteToken("  --  ")

    expect(readInviteToken()).toBe("A2C46")
  })

  it("clears the token after verification", () => {
    rememberInviteToken("A2C46")
    clearInviteToken()

    expect(readInviteToken()).toBe("")
  })
})
