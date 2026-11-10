import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { WalletPanel } from "@/features/account/wallet-panel"
import type { Wallet } from "@/features/account/wallet-model"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}))

const funded: Wallet = {
  teamId: 4,
  displayName: "Travel",
  role: "owner",
  availableBalance: 24_000,
  restrictedBalance: 0,
}

describe("WalletPanel withdraw", () => {
  it("shows withdraw when the displayed balance is above zero", () => {
    render(<WalletPanel initialWallets={[funded]} preview />)

    expect(screen.getByRole("button", { name: "برداشت وجه" })).toBeTruthy()
  })

  it("hides withdraw when the displayed balance is zero", () => {
    render(
      <WalletPanel
        initialWallets={[{ ...funded, availableBalance: 0 }]}
        preview
      />
    )

    expect(screen.queryByRole("button", { name: "برداشت وجه" })).toBeNull()
    expect(screen.getByText("۰ تومان")).toBeTruthy()
  })

  it("hides withdraw from a member even when the balance is above zero", () => {
    render(
      <WalletPanel initialWallets={[{ ...funded, role: "member" }]} preview />
    )

    expect(screen.queryByRole("button", { name: "برداشت وجه" })).toBeNull()
  })
})
