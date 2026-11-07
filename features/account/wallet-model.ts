export const MIN_CHARGE_RIAL = 1000
export const MAX_WALLET_NAME_LENGTH = 80
export const REVERSE_WINDOW_MS = 30 * 60 * 1000
export const CHARGE_DESCRIPTION = "شارژ کیف پول"

export const WALLET_ROLES = ["owner", "admin", "member", "viewer"] as const
export const REFUND_STATUSES = [
  "pending",
  "processing",
  "paid",
  "rejected",
  "failed",
] as const

export type WalletRole = (typeof WALLET_ROLES)[number]
export type RefundStatus = (typeof REFUND_STATUSES)[number]

export type Wallet = {
  teamId: number
  displayName: string
  role: WalletRole
  availableBalance: number
  restrictedBalance: number
}

export type LedgerTransaction = {
  id: number
  type: string
  amount: number
  availableBalanceAfter: number
  restrictedBalanceAfter: number
  gatewayAttemptId: number | null
  createdAt: string
}

export type CardRefund = {
  id: number
  teamId: number
  transactionId: number
  amount: number
  status: RefundStatus
  cardNumber: string
  createdAt: string
}

const ROLE_SET = new Set<string>(WALLET_ROLES)
const REFUND_STATUS_SET = new Set<string>(REFUND_STATUSES)

const DEFAULT_WALLET_NAMES: Record<string, string> = {
  "Personal wallet": "کیف پول شخصی",
  Wallet: "کیف پول",
}

const ROLE_LABELS: Record<WalletRole, string> = {
  owner: "مالک",
  admin: "مدیر",
  member: "عضو",
  viewer: "بیننده",
}

const TRANSACTION_LABELS: Record<string, string> = {
  GatewayCredit: "افزایش موجودی",
  Reverse: "بازگشت به درگاه",
  Deposit: "واریز",
  Refund: "استرداد",
}

const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  pending: "در انتظار",
  processing: "در حال انجام",
  paid: "پرداخت شد",
  rejected: "رد شد",
  failed: "ناموفق",
}

const PAYMENT_FAILURE_COPY: Record<string, string> = {
  PAYMENT_NOT_VERIFIED: "بانک پرداخت را تأیید نکرد یا خریدار انصراف داد.",
  AMOUNT_MISMATCH: "مبلغ تأییدشده با شارژ هم‌خوان نبود. موجودی افزایش نیافت.",
  ATTEMPT_NOT_FOUND: "این بازگشت با هیچ شارژی جور نیست.",
  INVALID_CALLBACK_SIGNATURE: "لینک بازگشت معتبر نیست.",
  GATEWAY_UNAVAILABLE: "بانک در دسترس نبود. می‌توانید بازیابی را امتحان کنید.",
  RATE_LIMITED:
    "تعداد بازگشت از این شبکه زیاد بود. کیف پول را دوباره باز کنید.",
}

/** True when this session can charge, read history, reverse, or refund. */
export function isWalletOwner(wallet: Wallet) {
  return wallet.role === "owner"
}

/** Maps known English defaults to Persian; otherwise keeps the server name. */
export function walletDisplayName(displayName: string) {
  return DEFAULT_WALLET_NAMES[displayName] ?? displayName
}

/** Persian role label for a wallet membership. */
export function walletRoleLabel(role: WalletRole) {
  return ROLE_LABELS[role]
}

/** Persian ledger label, or the raw type when the API sends an unknown one. */
export function transactionLabel(type: string) {
  return TRANSACTION_LABELS[type] ?? type
}

/** Persian status for a card-refund row. */
export function refundStatusLabel(status: RefundStatus) {
  return REFUND_STATUS_LABELS[status]
}

/** Failure-page copy from the bank-return `code` query. */
export function paymentFailureMessage(code: string) {
  return (
    PAYMENT_FAILURE_COPY[code] ??
    "پرداخت کامل نشد. اگر مبلغ کم شده با پشتیبانی تماس بگیرید."
  )
}

/** True when a refund still blocks gateway reverse. */
export function isOpenRefund(refund: CardRefund) {
  return refund.status !== "rejected" && refund.status !== "failed"
}

/** Finds the refund stored for a ledger credit, if any. */
export function refundForTransaction(
  transactionId: number,
  refunds: CardRefund[]
) {
  return refunds.find((row) => row.transactionId === transactionId)
}

/** True when this credit already has a Reverse row. */
export function wasReversed(
  transaction: LedgerTransaction,
  transactions: LedgerTransaction[]
) {
  const attemptId = transaction.gatewayAttemptId
  if (attemptId == null) {
    return false
  }

  return transactions.some(
    (row) => row.type === "Reverse" && row.gatewayAttemptId === attemptId
  )
}

/** True during the 30-minute reverse window for a credit timestamp. */
export function isWithinReverseWindow(createdAt: string, now = Date.now()) {
  const created = Date.parse(createdAt)
  if (!Number.isFinite(created)) {
    return false
  }

  return now - created >= 0 && now - created < REVERSE_WINDOW_MS
}

/** Reverse is offered on a successful credit that is still inside the window. */
export function canReverseCredit(input: {
  transaction: LedgerTransaction
  transactions: LedgerTransaction[]
  refunds: CardRefund[]
  now?: number
}) {
  const { transaction, transactions, refunds, now } = input
  if (transaction.type !== "GatewayCredit") {
    return false
  }
  if (transaction.gatewayAttemptId == null) {
    return false
  }
  if (wasReversed(transaction, transactions)) {
    return false
  }

  const refund = refundForTransaction(transaction.id, refunds)
  if (refund && isOpenRefund(refund)) {
    return false
  }

  return isWithinReverseWindow(transaction.createdAt, now)
}

/** Card refund is offered after the reverse window, for a credit with no refund. */
export function canRequestRefund(input: {
  transaction: LedgerTransaction
  transactions: LedgerTransaction[]
  refunds: CardRefund[]
  now?: number
}) {
  const { transaction, transactions, refunds, now } = input
  if (transaction.type !== "GatewayCredit") {
    return false
  }
  if (wasReversed(transaction, transactions)) {
    return false
  }
  if (refundForTransaction(transaction.id, refunds)) {
    return false
  }

  return !isWithinReverseWindow(transaction.createdAt, now)
}

/** Narrows an unknown role; unknown values hide owner actions. */
export function readWalletRole(value: unknown): WalletRole {
  return typeof value === "string" && ROLE_SET.has(value)
    ? (value as WalletRole)
    : "viewer"
}

/** Narrows an unknown refund status. */
export function readRefundStatus(value: unknown): RefundStatus | undefined {
  return typeof value === "string" && REFUND_STATUS_SET.has(value)
    ? (value as RefundStatus)
    : undefined
}
