const STORAGE_KEY = "frontend-starter-kit.account"

export type TransactionKind = "deposit" | "withdraw"

export type AccountTransaction = {
  id: string
  kind: TransactionKind
  amountRial: number
  createdAt: string
}

export type AccountProfile = {
  phone: string
  name: string
  avatarDataUrl: string
  balanceRial: number
  transactions: AccountTransaction[]
}

function safeAvatar(value: unknown) {
  return typeof value === "string" &&
    value.startsWith("data:image/") &&
    !value.includes('"')
    ? value
    : ""
}

function isTransaction(value: unknown): value is AccountTransaction {
  if (!value || typeof value !== "object") {
    return false
  }

  const transaction = value as Partial<AccountTransaction>
  return (
    typeof transaction.id === "string" &&
    (transaction.kind === "deposit" || transaction.kind === "withdraw") &&
    typeof transaction.amountRial === "number" &&
    typeof transaction.createdAt === "string"
  )
}

const SAMPLE_TRANSACTIONS: AccountTransaction[] = [
  {
    id: "sample-deposit-1",
    kind: "deposit",
    amountRial: 2_500_000,
    createdAt: "2026-10-20T08:15:00.000Z",
  },
  {
    id: "sample-deposit-2",
    kind: "deposit",
    amountRial: 800_000,
    createdAt: "2026-10-24T14:40:00.000Z",
  },
  {
    id: "sample-withdraw-1",
    kind: "withdraw",
    amountRial: 350_000,
    createdAt: "2026-10-26T11:05:00.000Z",
  },
  {
    id: "sample-deposit-3",
    kind: "deposit",
    amountRial: 150_000,
    createdAt: "2026-10-28T16:20:00.000Z",
  },
  {
    id: "sample-withdraw-2",
    kind: "withdraw",
    amountRial: 100_000,
    createdAt: "2026-10-29T06:45:00.000Z",
  },
]

let cachedRaw: string | null | undefined
let cachedAccount: AccountProfile | null = null
const listeners = new Set<() => void>()

/** Adds the demo transactions that are not already on the account. */
export function withSampleTransactions(account: AccountProfile) {
  const missing = SAMPLE_TRANSACTIONS.filter(
    (sample) => !account.transactions.some((item) => item.id === sample.id)
  )
  if (missing.length === 0) {
    return account
  }

  const addedRial = missing.reduce(
    (sum, item) =>
      sum + (item.kind === "deposit" ? item.amountRial : -item.amountRial),
    0
  )
  const transactions = [...account.transactions, ...missing].sort(
    (left, right) => left.createdAt.localeCompare(right.createdAt)
  )

  return {
    ...account,
    balanceRial: Math.max(0, account.balanceRial + addedRial),
    transactions,
  }
}

/** Reads a stored account and ignores unknown or broken fields. */
function parseAccount(raw: string | null) {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AccountProfile>
    if (!parsed || typeof parsed.phone !== "string" || !parsed.phone) {
      return null
    }

    return {
      phone: parsed.phone,
      name: typeof parsed.name === "string" ? parsed.name : "",
      avatarDataUrl: safeAvatar(parsed.avatarDataUrl),
      balanceRial:
        typeof parsed.balanceRial === "number" && parsed.balanceRial >= 0
          ? parsed.balanceRial
          : 0,
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions.filter(isTransaction)
        : [],
    } satisfies AccountProfile
  } catch {
    return null
  }
}

/** Returns the saved account. The same object is reused until it changes. */
export function readAccount() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === cachedRaw) {
      return cachedAccount
    }

    cachedRaw = raw
    const parsed = parseAccount(raw)
    cachedAccount = parsed ? withSampleTransactions(parsed) : null
    return cachedAccount
  } catch {
    return cachedAccount
  }
}

/** Subscribes to account changes in this tab and other tabs. */
export function subscribeAccount(listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) {
      return
    }

    cachedRaw = event.newValue
    const parsed = parseAccount(event.newValue)
    cachedAccount = parsed ? withSampleTransactions(parsed) : null
    listener()
  }

  listeners.add(listener)
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/** Persists the account in this browser and notifies subscribers. */
export function saveAccount(account: AccountProfile) {
  const raw = JSON.stringify(account)
  window.localStorage.setItem(STORAGE_KEY, raw)
  cachedRaw = raw
  cachedAccount = account
  listeners.forEach((listener) => listener())
}

/** Opens an account for a phone, keeping the previous wallet for that same phone. */
export function signInAccount(phone: string) {
  const current = readAccount()
  if (current?.phone === phone) {
    return current
  }

  const next = withSampleTransactions({
    phone,
    name: "",
    avatarDataUrl: "",
    balanceRial: 0,
    transactions: [],
  })
  saveAccount(next)
  return next
}

/** Adds a deposit and increases the Rial balance. */
export function creditAccount(account: AccountProfile, amountRial: number) {
  return {
    ...account,
    balanceRial: account.balanceRial + amountRial,
    transactions: [
      ...account.transactions,
      {
        id: crypto.randomUUID(),
        kind: "deposit" as const,
        amountRial,
        createdAt: new Date().toISOString(),
      },
    ],
  }
}

/** Reserves a withdrawal when the Rial balance covers it. */
export function debitAccount(account: AccountProfile, amountRial: number) {
  if (amountRial > account.balanceRial) {
    return null
  }

  return {
    ...account,
    balanceRial: account.balanceRial - amountRial,
    transactions: [
      ...account.transactions,
      {
        id: crypto.randomUUID(),
        kind: "withdraw" as const,
        amountRial,
        createdAt: new Date().toISOString(),
      },
    ],
  }
}
