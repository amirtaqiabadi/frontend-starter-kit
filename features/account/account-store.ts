const STORAGE_KEY = "frontend-starter-kit.account"

export type AccountProfile = {
  phone: string
  name: string
  avatarDataUrl: string
}

function safeAvatar(value: unknown) {
  return typeof value === "string" &&
    value.startsWith("data:image/") &&
    !value.includes('"')
    ? value
    : ""
}

let cachedRaw: string | null | undefined
let cachedAccount: AccountProfile | null = null
const listeners = new Set<() => void>()

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
    cachedAccount = parseAccount(raw)
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
    cachedAccount = parseAccount(event.newValue)
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

/** Opens an account for a phone, keeping the previous profile for that same phone. */
export function signInAccount(phone: string) {
  const current = readAccount()
  if (current?.phone === phone) {
    return current
  }

  const next = {
    phone,
    name: "",
    avatarDataUrl: "",
  }
  saveAccount(next)
  return next
}
