import { apiPath } from "@/lib/api-path"

export type UserProfile = {
  name: string | null
  phoneNumber: string
  avatarUrl: string | null
  hasPassword: boolean
  token: string
  walletIds: number[]
}

export function parseUserProfile(value: unknown): UserProfile | undefined {
  if (!value || typeof value !== "object") return undefined
  const data = value as Partial<UserProfile>
  if (
    typeof data.phoneNumber !== "string" ||
    typeof data.hasPassword !== "boolean" ||
    (data.name !== null && typeof data.name !== "string") ||
    (data.avatarUrl !== null && typeof data.avatarUrl !== "string") ||
    typeof data.token !== "string" ||
    !Array.isArray(data.walletIds) ||
    !data.walletIds.every((id) => Number.isSafeInteger(id) && id > 0)
  )
    return undefined
  return {
    name: data.name,
    phoneNumber: data.phoneNumber,
    avatarUrl: data.avatarUrl,
    hasPassword: data.hasPassword,
    token: data.token,
    walletIds: data.walletIds,
  }
}

export class ProfileApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

async function requestProfile(method: "GET" | "PATCH", name?: string) {
  let response: Response
  try {
    const cookie = document.cookie
      .split("; ")
      .find((part) => part.startsWith("csrf-token="))
    const token = cookie
      ? decodeURIComponent(cookie.slice("csrf-token=".length))
      : ""
    response = await fetch(apiPath("/user"), {
      method,
      credentials: "include",
      cache: "no-store",
      ...(method === "PATCH"
        ? {
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": token,
            },
            body: JSON.stringify({ name }),
          }
        : {}),
    })
  } catch {
    throw new ProfileApiError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.", 0)
  }
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const body = data as { error?: { message?: unknown } } | null
    throw new ProfileApiError(
      typeof body?.error?.message === "string"
        ? body.error.message
        : `درخواست انجام نشد (خطای ${response.status}). دوباره تلاش کنید.`,
      response.status
    )
  }
  return data
}

export async function getProfile(): Promise<UserProfile> {
  const data = parseUserProfile(await requestProfile("GET"))
  if (!data) {
    throw new ProfileApiError("اطلاعات حساب معتبر نیست. دوباره تلاش کنید.", 200)
  }
  return data
}

export async function updateProfileName(name: string): Promise<string> {
  const data = (await requestProfile("PATCH", name)) as {
    name?: unknown
  } | null
  if (typeof data?.name !== "string")
    throw new ProfileApiError("پاسخ سرور معتبر نیست.", 200)
  return data.name
}
