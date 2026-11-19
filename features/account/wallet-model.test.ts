import { describe, expect, it } from "vitest"

import {
  canReverseCredit,
  paymentFailureMessage,
  walletDisplayName,
  type LedgerTransaction,
} from "@/features/account/wallet-model"

const credit: LedgerTransaction = {
  id: 91,
  type: "GatewayCredit",
  amount: 50000,
  availableBalanceAfter: 50000,
  restrictedBalanceAfter: 0,
  gatewayAttemptId: 18,
  createdAt: "2026-11-07T12:00:00.000Z",
}

const reverse: LedgerTransaction = {
  id: 92,
  type: "Reverse",
  amount: -50000,
  availableBalanceAfter: 0,
  restrictedBalanceAfter: 0,
  gatewayAttemptId: 18,
  createdAt: "2026-11-07T12:05:00.000Z",
}

describe("walletDisplayName", () => {
  it("maps known English defaults", () => {
    expect(walletDisplayName("Personal wallet")).toBe("کیف پول شخصی")
    expect(walletDisplayName("Travel")).toBe("Travel")
  })
})

describe("paymentFailureMessage", () => {
  it("maps known bank-return codes", () => {
    expect(paymentFailureMessage("PAYMENT_NOT_VERIFIED")).toContain("بانک")
    expect(paymentFailureMessage("UNKNOWN_CODE")).toContain("کامل نشد")
  })
})

describe("credit actions", () => {
  const now = Date.parse("2026-11-07T12:10:00.000Z")
  it("offers reverse only for an unreversed credit within the window", () => {
    expect(
      canReverseCredit({ transaction: credit, transactions: [credit], now })
    ).toBe(true)
    expect(
      canReverseCredit({
        transaction: credit,
        transactions: [reverse, credit],
        now,
      })
    ).toBe(false)
    expect(
      canReverseCredit({
        transaction: credit,
        transactions: [credit],
        now: Date.parse("2026-11-07T13:00:00.000Z"),
      })
    ).toBe(false)
  })
})
