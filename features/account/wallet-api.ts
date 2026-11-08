import { apiPath } from "@/lib/api-path"

import {
  readRefundStatus,
  readWalletRole,
  type CardRefund,
  type LedgerTransaction,
  type Wallet,
} from "@/features/account/wallet-model"

export type WalletErrorType =
  "VALIDATION_ERROR" | "DOMAIN_ERROR" | "SYSTEM_ERROR"

export type WalletApiErrorInit = {
  code: string
  message: string
  status?: number
  type?: string
  traceId?: string
  retryAfter?: number
}

const FALLBACK_MESSAGE = "درخواست انجام نشد. دوباره تلاش کنید."
const NETWORK_MESSAGE = "ارتباط با سرور برقرار نشد. دوباره تلاش کنید."
const ERROR_TYPES = new Set<string>([
  "VALIDATION_ERROR",
  "DOMAIN_ERROR",
  "SYSTEM_ERROR",
])

/** Wallet/payment failure the screens branch on by `code` and display by `message`. */
export class WalletApiError extends Error {
  readonly code: string
  readonly status: number
  readonly type?: WalletErrorType
  readonly traceId?: string
  readonly retryAfter?: number

  constructor({
    code,
    message,
    status = 0,
    type,
    traceId,
    retryAfter,
  }: WalletApiErrorInit) {
    super(message)
    this.name = "WalletApiError"
    this.code = code
    this.status = status
    this.type =
      type && ERROR_TYPES.has(type) ? (type as WalletErrorType) : undefined
    this.traceId = traceId
    this.retryAfter = retryAfter
  }
}

/** Narrows unknown failures to a wallet API error. */
export function isWalletApiError(value: unknown): value is WalletApiError {
  return value instanceof WalletApiError
}

/** True when the session cookie is missing or expired. */
export function isUnauthorized(error: unknown) {
  return isWalletApiError(error) && error.code === "UNAUTHORIZED"
}

/** Lists wallets for the signed-in user. `401` means signed out. */
export async function listWallets() {
  const data = await walletGet(apiPath("/wallets"))
  const wallets = asRecord(data)?.wallets
  if (!Array.isArray(wallets)) {
    return []
  }

  return wallets.flatMap((row) => {
    const wallet = parseWallet(row)
    return wallet ? [wallet] : []
  })
}

/** Creates a wallet. An empty name becomes "Wallet" on the server. */
export async function createWallet(displayName?: string) {
  const trimmed = displayName?.trim() ?? ""
  const data = await walletPost(
    apiPath("/wallets"),
    trimmed ? { displayName: trimmed } : {}
  )
  const wallet = parseWallet(data)
  if (!wallet) {
    throw unknownError(201)
  }

  return wallet
}

/** Starts a Zarinpal charge and returns the URL the browser must open. */
export async function initiatePayment(input: {
  amount: number
  description: string
  teamId?: number
}) {
  const data = await walletPost(apiPath("/payment/initiate"), {
    amount: input.amount,
    description: input.description,
    ...(typeof input.teamId === "number" ? { teamId: input.teamId } : {}),
  })
  const paymentUrl = readPaymentUrl(asRecord(data)?.paymentUrl)
  if (!paymentUrl) {
    throw unknownError(200)
  }

  return {
    paymentUrl,
    attemptId: readPositiveInt(asRecord(data)?.attemptId),
  }
}

/** Newest-first ledger for an owned wallet. */
export async function listTransactions(teamId: number) {
  const data = await walletGet(apiPath(`/wallets/${teamId}/transactions`))
  const transactions = asRecord(data)?.transactions
  if (!Array.isArray(transactions)) {
    return []
  }

  return transactions.flatMap((row) => {
    const transaction = parseTransaction(row)
    return transaction ? [transaction] : []
  })
}

/** Asks the gateway to reverse a successful top-up. */
export async function reversePayment(attemptId: number) {
  await walletPost(apiPath("/payment/reverse"), { attemptId })
}

/** Stores a manual card payout request. Does not change the balance. */
export async function requestRefund(input: {
  transactionId: number
  cardNumber: string
}) {
  const data = await walletPost(apiPath("/payment/refunds"), {
    transactionId: input.transactionId,
    cardNumber: input.cardNumber,
  })
  const refund = parseRefund(data)
  if (!refund) {
    throw unknownError(201)
  }

  return refund
}

/** Newest-first card refunds for an owned wallet. */
export async function listRefunds(teamId: number) {
  const data = await walletGet(apiPath(`/payment/refunds?teamId=${teamId}`))
  const refunds = asRecord(data)?.refunds
  if (!Array.isArray(refunds)) {
    return []
  }

  return refunds.flatMap((row) => {
    const refund = parseRefund(row)
    return refund ? [refund] : []
  })
}

/** Verifies missed gateway payments. Omit authority to scan this user's attempts. */
export async function recoverPayment(authority?: string) {
  const trimmed = authority?.trim() ?? ""
  const data = await walletPost(
    apiPath("/payment/recover"),
    trimmed ? { authority: trimmed } : {}
  )
  const recovered = readInt(asRecord(data)?.recovered)

  return {
    recovered: typeof recovered === "number" && recovered >= 0 ? recovered : 0,
  }
}

/** GET a wallet route with the session cookie. No CSRF header. */
async function walletGet(path: string) {
  let response: Response

  try {
    response = await fetch(path, {
      credentials: "include",
      cache: "no-store",
    })
  } catch {
    throw new WalletApiError({ code: "NETWORK", message: NETWORK_MESSAGE })
  }

  const data = await readJson(response)
  if (!response.ok) {
    throw readError(data, response)
  }

  return data
}

/** POST a JSON object with CSRF. Reloads wallets and retries once on INVALID_CSRF. */
async function walletPost(
  path: string,
  body: Record<string, unknown>,
  retried = false
): Promise<unknown> {
  let response: Response

  try {
    response = await fetch(path, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken(),
        "x-request-id": crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new WalletApiError({ code: "NETWORK", message: NETWORK_MESSAGE })
  }

  const data = await readJson(response)
  if (response.ok) {
    return data
  }

  const error = readError(data, response)
  if (error.code === "INVALID_CSRF" && !retried) {
    await listWallets()
    return walletPost(path, body, true)
  }

  throw error
}

/** Reads the non-HttpOnly CSRF cookie set at login or on a wallet GET. */
function csrfToken() {
  if (typeof document === "undefined") {
    return ""
  }

  const row = document.cookie
    .split("; ")
    .find((part) => part.startsWith("csrf-token="))

  return row ? decodeURIComponent(row.slice("csrf-token=".length)) : ""
}

/** Reads JSON and returns null when the body is empty or invalid. */
async function readJson(response: Response) {
  try {
    return (await response.json()) as unknown
  } catch {
    return null
  }
}

/** Reads the wallet error envelope and ignores unknown extra fields. */
function readError(data: unknown, response: Response) {
  const error = asRecord(asRecord(data)?.error)
  const retryAfterHeader = response.headers.get("retry-after")
  const requestId = response.headers.get("x-request-id")

  return new WalletApiError({
    code: typeof error?.code === "string" ? error.code : "UNKNOWN",
    message:
      typeof error?.message === "string" && error.message
        ? error.message
        : FALLBACK_MESSAGE,
    status: response.status,
    type: typeof error?.type === "string" ? error.type : undefined,
    traceId:
      (typeof error?.traceId === "string" && error.traceId) ||
      requestId ||
      undefined,
    retryAfter:
      readFinite(error?.retryAfter) ?? parseRetryAfter(retryAfterHeader),
  })
}

function unknownError(status: number) {
  return new WalletApiError({
    code: "UNKNOWN",
    message: FALLBACK_MESSAGE,
    status,
  })
}

function parseWallet(value: unknown): Wallet | null {
  const row = asRecord(value)
  const teamId = readPositiveInt(row?.teamId)
  if (!teamId) {
    return null
  }

  const available = readInt(row?.availableBalance)
  const restricted = readInt(row?.restrictedBalance)

  return {
    teamId,
    displayName:
      typeof row?.displayName === "string" && row.displayName
        ? row.displayName
        : "Personal wallet",
    role: readWalletRole(row?.role),
    availableBalance:
      typeof available === "number" && available >= 0 ? available : 0,
    restrictedBalance:
      typeof restricted === "number" && restricted >= 0 ? restricted : 0,
  }
}

function parseTransaction(value: unknown): LedgerTransaction | null {
  const row = asRecord(value)
  const id = readPositiveInt(row?.id)
  const type = typeof row?.type === "string" ? row.type : ""
  const amount = readInt(row?.amount)
  const createdAt = typeof row?.createdAt === "string" ? row.createdAt : ""
  if (!id || !type || amount === undefined || !createdAt) {
    return null
  }

  const availableAfter = readInt(row?.availableBalanceAfter)
  const restrictedAfter = readInt(row?.restrictedBalanceAfter)

  return {
    id,
    type,
    amount,
    availableBalanceAfter:
      typeof availableAfter === "number" ? availableAfter : 0,
    restrictedBalanceAfter:
      typeof restrictedAfter === "number" ? restrictedAfter : 0,
    gatewayAttemptId: readPositiveInt(row?.gatewayAttemptId) ?? null,
    createdAt,
  }
}

function parseRefund(value: unknown): CardRefund | null {
  const row = asRecord(value)
  const id = readPositiveInt(row?.id)
  const teamId = readPositiveInt(row?.teamId)
  const transactionId = readPositiveInt(row?.transactionId)
  const amount = readInt(row?.amount)
  const status = readRefundStatus(row?.status)
  const cardNumber = typeof row?.cardNumber === "string" ? row.cardNumber : ""
  const createdAt = typeof row?.createdAt === "string" ? row.createdAt : ""
  if (
    !id ||
    !teamId ||
    !transactionId ||
    amount === undefined ||
    !status ||
    !cardNumber ||
    !createdAt
  ) {
    return null
  }

  return {
    id,
    teamId,
    transactionId,
    amount,
    status,
    cardNumber,
    createdAt,
  }
}

function readPaymentUrl(value: unknown) {
  if (typeof value !== "string" || !value) {
    return undefined
  }

  try {
    const url = new URL(value)
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return undefined
    }

    return url.href
  } catch {
    return undefined
  }
}

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined
}

function readPositiveInt(value: unknown) {
  const parsed = readInt(value)
  return typeof parsed === "number" && parsed > 0 ? parsed : undefined
}

function readInt(value: unknown) {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    Number.isSafeInteger(value)
  ) {
    return value
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) ? parsed : undefined
  }

  return undefined
}

function readFinite(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function parseRetryAfter(value: string | null) {
  if (!value || !/^\d+$/.test(value)) {
    return undefined
  }

  return Number(value)
}
