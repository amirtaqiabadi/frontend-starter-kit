import { describe, expect, it } from "vitest"

import { inviteUrl } from "@/features/account/invite-code"

describe("invite links", () => {
  it("builds a token login link and keeps a relative path without an origin", () => {
    expect(inviteUrl("https://app.example.com", "A2C46")).toBe(
      "https://app.example.com/login?token=A2C46"
    )
    expect(inviteUrl("", "A2C46")).toBe("/login?token=A2C46")
  })
})
