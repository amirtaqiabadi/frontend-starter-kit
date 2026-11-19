import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import LoginPage from "./page"

vi.mock("@/features/login/login-form", () => ({
  LoginForm: ({ inviteToken }: { inviteToken?: string }) => (
    <div data-testid="invite">{inviteToken}</div>
  ),
}))

describe("login invite links", () => {
  it("passes inviteby to the registration form, ahead of a legacy token", async () => {
    render(
      await LoginPage({
        searchParams: Promise.resolve({ inviteby: "NEW", token: "OLD" }),
      })
    )
    expect(screen.getByTestId("invite").textContent).toBe("NEW")
  })

  it("keeps existing links with token working", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ token: "OLD" }) }))
    expect(screen.getByTestId("invite").textContent).toBe("OLD")
  })
})
