import { describe, expect, it } from "vitest"

import {
  canRequestRefund,
  canReverseCredit,
  paymentFailureMessage,
  walletDisplayName,
  type CardRefund,
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

const pendingRefund: CardRefund = {
  id: 3,
  teamId: 4,
  transactionId: 91,
  amount: 50000,
  status: "pending",
  cardNumber: "502229******5995",
  createdAt: "2026-11-07T12:10:00.000Z",
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

  it("offers reverse inside the 30-minute window", () => {
    expect(
      canReverseCredit({
        transaction: credit,
        transactions: [credit],
        refunds: [],
        now,
      })
    ).toBe(true)
    expect(
      canRequestRefund({
        transaction: credit,
        transactions: [credit],
        refunds: [],
        now,
      })
    ).toBe(false)
  })

  it("hides reverse after a Reverse row or an open refund", () => {
    expect(
      canReverseCredit({
        transaction: credit,
        transactions: [reverse, credit],
        refunds: [],
        now,
      })
    ).toBe(false)
    expect(
      canReverseCredit({
        transaction: credit,
        transactions: [credit],
        refunds: [pendingRefund],
        now,
      })
    ).toBe(false)
  })

  it("offers card refund after the reverse window", () => {
    const later = Date.parse("2026-11-07T13:00:00.000Z")
    expect(
      canReverseCredit({
        transaction: credit,
        transactions: [credit],
        refunds: [],
        now: later,
      })
    ).toBe(false)
    expect(
      canRequestRefund({
        transaction: credit,
        transactions: [credit],
        refunds: [],
        now: later,
      })
    ).toBe(true)
  })
})
