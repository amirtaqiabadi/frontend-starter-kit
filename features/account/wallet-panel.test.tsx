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
  vi.mocked(listTransactions).mockResolvedValue({
    transactions: credits,
    hasNextPage: false,
  })
  vi.mocked(listRefunds).mockResolvedValue([])
  vi.mocked(listWallets).mockResolvedValue([funded])
})

describe("WalletPanel refunds", () => {
  it("offers withdrawal for a positive balance without requiring credits", async () => {
    render(<WalletPanel initialWallets={[funded]} preview />)
    fireEvent.click(screen.getByRole("button", { name: "برداشت وجه" }))
    const dialog = await screen.findByRole("dialog", { name: "برداشت وجه" })
    expect(within(dialog).getByRole("textbox", { name: /مبلغ/ })).toBeTruthy()
    expect(
      within(dialog).getByRole("textbox", { name: "شماره کارت" })
    ).toBeTruthy()
  })

  it("requests the next transaction page only when available", async () => {
    vi.mocked(listTransactions).mockResolvedValueOnce({
      transactions: credits,
      hasNextPage: true,
    })
    render(<WalletPanel initialWallets={[funded]} />)
    fireEvent.click(await screen.findByRole("button", { name: "صفحه بعد" }))
    await waitFor(() => expect(listTransactions).toHaveBeenCalledWith(4, 2))
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "صفحه بعد" }) as HTMLButtonElement)
          .disabled
      ).toBe(true)
    )
  })

  it("hides withdrawal for a zero balance or non-owner", () => {
    const { rerender } = render(
      <WalletPanel
        initialWallets={[{ ...funded, availableBalance: 0 }]}
        preview
      />
    )
    expect(screen.queryByRole("button", { name: "برداشت وجه" })).toBeNull()
    rerender(
      <WalletPanel
        key="member"
        initialWallets={[{ ...funded, role: "member" }]}
        preview
      />
    )
    expect(screen.queryByRole("button", { name: "برداشت وجه" })).toBeNull()
  })

  it("sends team ID, rial amount and normalized card then refreshes wallet and history", async () => {
    render(<WalletPanel initialWallets={[funded]} />)
    fireEvent.click(screen.getByRole("button", { name: "برداشت وجه" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByRole("textbox", { name: /مبلغ/ }), {
      target: { value: "۱۵۰۰" },
    })
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "شماره کارت" }),
      { target: { value: "۵۰۲۲۲۹۱۲۳۴۵۶۵۹۹۵" } }
    )
    fireEvent.click(within(dialog).getByRole("button", { name: "ثبت درخواست" }))
    await waitFor(() =>
      expect(requestRefund).toHaveBeenCalledWith({
        teamId: 4,
        amount: 15000,
        cardNumber: "5022291234565995",
      })
    )
    await waitFor(() => expect(listWallets).toHaveBeenCalled())
    await waitFor(() => expect(listTransactions).toHaveBeenCalledTimes(2))
    expect(listRefunds).toHaveBeenCalledTimes(2)
  })

  it("rejects a withdrawal exceeding the available balance", async () => {
    render(<WalletPanel initialWallets={[funded]} preview />)
    fireEvent.click(screen.getByRole("button", { name: "برداشت وجه" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByRole("textbox", { name: /مبلغ/ }), {
      target: { value: "2500" },
    })
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "شماره کارت" }),
      { target: { value: "5022291234565995" } }
    )
    fireEvent.click(within(dialog).getByRole("button", { name: "ثبت درخواست" }))
    expect(
      await within(dialog).findByText("مبلغ بیشتر از موجودی قابل برداشت است.")
    ).toBeTruthy()
    expect(requestRefund).not.toHaveBeenCalled()
  })
})
