import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { WalletPanel } from "@/features/account/wallet-panel"
import {
  listRefunds,
  listTransactions,
  listWallets,
  requestRefund,
} from "@/features/account/wallet-api"
import type { LedgerTransaction, Wallet } from "@/features/account/wallet-model"

vi.mock("next/navigation", () => {
  const router = { replace: vi.fn() }
  return { useRouter: () => router }
})
vi.mock("@/features/account/wallet-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/account/wallet-api")>()),
  listTransactions: vi.fn(),
  listRefunds: vi.fn(),
  listWallets: vi.fn(),
  requestRefund: vi.fn(),
}))

const funded: Wallet = {
  teamId: 4,
  displayName: "Travel",
  role: "owner",
  availableBalance: 24_000,
  restrictedBalance: 0,
}
const credits: LedgerTransaction[] = [10_000, 14_000].map((amount, index) => ({
  id: index + 1,
  type: "GatewayCredit",
  amount,
  availableBalanceAfter: 24_000,
  restrictedBalanceAfter: 0,
  gatewayAttemptId: index + 10,
  createdAt: "2026-01-01T00:00:00.000Z",
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listTransactions).mockResolvedValue(credits)
  vi.mocked(listRefunds).mockResolvedValue([])
  vi.mocked(listWallets).mockResolvedValue([funded])
})

describe("WalletPanel refunds", () => {
  it("offers each eligible credit instead of an arbitrary balance withdrawal", () => {
    render(
      <WalletPanel
        initialWallets={[funded]}
        initialTransactions={credits}
        preview
      />
    )
    expect(screen.queryByRole("button", { name: "برداشت وجه" })).toBeNull()
    expect(
      screen.getAllByRole("button", { name: "استرداد به کارت" })
    ).toHaveLength(2)
  })
  it("does not offer a refund solely because the wallet has a positive balance", () => {
    render(<WalletPanel initialWallets={[funded]} preview />)
    expect(screen.queryByRole("button", { name: "استرداد به کارت" })).toBeNull()
    expect(screen.queryByRole("button", { name: "برداشت وجه" })).toBeNull()
  })
  it("keeps the zero balance visible", () => {
    render(
      <WalletPanel
        initialWallets={[{ ...funded, availableBalance: 0 }]}
        preview
      />
    )
    expect(screen.getByText("۰ تومان")).toBeTruthy()
  })
  it("hides refund actions from a member", () => {
    render(
      <WalletPanel
        initialWallets={[{ ...funded, role: "member" }]}
        initialTransactions={credits}
        preview
      />
    )
    expect(screen.queryByRole("button", { name: "استرداد به کارت" })).toBeNull()
  })
  it("submits the selected transaction ID with a fixed full amount", async () => {
    render(<WalletPanel initialWallets={[funded]} />)
    const buttons = await screen.findAllByRole("button", {
      name: "استرداد به کارت",
    })
    fireEvent.click(buttons[1])
    const dialog = await screen.findByRole("dialog")
    expect(dialog.textContent).toContain("۱٬۴۰۰ تومان")
    expect(within(dialog).queryByRole("textbox", { name: "مبلغ" })).toBeNull()
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "شماره کارت" }),
      { target: { value: "5022291234565995" } }
    )
    fireEvent.click(within(dialog).getByRole("button", { name: "ثبت درخواست" }))
    await waitFor(() =>
      expect(requestRefund).toHaveBeenCalledWith({
        transactionId: 2,
        cardNumber: "۵۰۲۲ ۲۹۱۲ ۳۴۵۶ ۵۹۹۵",
      })
    )
  })
})
