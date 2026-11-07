import { toPersianDigits } from "@/lib/digits"

import { safeRedirectPath } from "@/features/login/redirect-path"

export type NextAuthStep = "PASSWORD" | "OTP"
export type OtpPurpose = "LOGIN" | "RESET_PASSWORD"

export type LoginApiErrorInit = {
  code: string
  message: string
  status?: number
  attemptsRemaining?: number
  retryAfter?: number
}

const FALLBACK_MESSAGE = "درخواست انجام نشد. دوباره تلاش کنید."
const NETWORK_MESSAGE = "ارتباط با سرور برقرار نشد. دوباره تلاش کنید."
const DEFAULT_COOLDOWN_SECONDS = 120

/** Auth failure the screens branch on by `code` and display by `message`. */
export class LoginApiError extends Error {
  readonly code: string
  readonly status: number
  readonly attemptsRemaining?: number
  readonly retryAfter?: number

  constructor({
    code,
    message,
    status = 0,
    attemptsRemaining,
    retryAfter,
  }: LoginApiErrorInit) {
    super(message)
    this.name = "LoginApiError"
    this.code = code
    this.status = status
    this.attemptsRemaining = attemptsRemaining
    this.retryAfter = retryAfter
  }
}

/** Narrows unknown failures to a login API error. */
export function isLoginApiError(value: unknown): value is LoginApiError {
  return value instanceof LoginApiError
}

/** Builds the on-screen copy, including remaining OTP attempts when present. */
export function formatLoginError(error: LoginApiError) {
  if (
    error.code === "OTP_MISMATCH" &&
    typeof error.attemptsRemaining === "number"
  ) {
    return `${error.message} ${toPersianDigits(String(error.attemptsRemaining))} تلاش باقی مانده.`
  }

  return error.message
}

/** Chooses password or OTP after the phone number is submitted. */
export async function identifyAccount(phoneNumber: string) {
  const data = await authPost("/api/auth/identify", { phoneNumber })
  const nextStep = readString(data, "nextStep")
  if (nextStep !== "PASSWORD" && nextStep !== "OTP") {
    throw new LoginApiError({
      code: "UNKNOWN",
      message: FALLBACK_MESSAGE,
      status: 200,
    })
  }

  return { nextStep } satisfies { nextStep: NextAuthStep }
}

/** Signs in with phone and password and returns the server redirect path. */
export async function loginWithPassword(input: {
  phoneNumber: string
  password: string
  next?: string
}) {
  const data = await authPost("/api/auth/password/login", {
    phoneNumber: input.phoneNumber,
    password: input.password,
    ...optionalNext(input.next),
  })

  return { redirectTo: readRedirectTo(data) }
}

/** Asks the SMS provider for a 5-digit login or reset code. */
export async function requestOtp(phoneNumber: string) {
  const data = await authPost("/api/auth/otp/request", { phoneNumber })
  const cooldown = readNumber(data, "cooldownSeconds")
  const devCode = readString(data, "devCode")

  return {
    cooldownSeconds:
      typeof cooldown === "number" && cooldown >= 0
        ? Math.floor(cooldown)
        : DEFAULT_COOLDOWN_SECONDS,
    devCode: devCode && /^\d{5}$/.test(devCode) ? devCode : "",
  }
}

/** Confirms the SMS code and creates the session cookie. */
export async function verifyOtp(input: {
  phoneNumber: string
  code: string
  purpose?: OtpPurpose
  next?: string
}) {
  const data = await authPost("/api/auth/otp/verify", {
    phoneNumber: input.phoneNumber,
    code: input.code,
    purpose: input.purpose ?? "LOGIN",
    ...optionalNext(input.next),
  })

  return {
    hasPassword: readValue(data, "hasPassword") === true,
    redirectTo: readRedirectTo(data),
  }
}

/** Sets the first password on an account that does not have one. */
export async function setPassword(password: string) {
  await authPost("/api/auth/password/set", { password })
}

/** Replaces the password after a RESET_PASSWORD OTP. */
export async function resetPassword(password: string) {
  await authPost("/api/auth/password/reset", { password })
}

/** Posts one JSON object to an auth route with the session cookie. */
async function authPost(path: string, body: Record<string, unknown>) {
  let response: Response

  try {
    response = await fetch(path, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    throw new LoginApiError({ code: "NETWORK", message: NETWORK_MESSAGE })
  }

  const data = await readJson(response)
  if (!response.ok) {
    throw readError(data, response)
  }

  return data
}

/** Reads JSON and returns null when the body is empty or invalid. */
async function readJson(response: Response) {
  try {
    return (await response.json()) as unknown
  } catch {
    return null
  }
}

/** Reads the auth error envelope and ignores unknown extra fields. */
function readError(data: unknown, response: Response) {
  const error = asRecord(asRecord(data)?.error)
  const retryAfterHeader = response.headers.get("retry-after")

  return new LoginApiError({
    code: typeof error?.code === "string" ? error.code : "UNKNOWN",
    message:
      typeof error?.message === "string" && error.message
        ? error.message
        : FALLBACK_MESSAGE,
    status: response.status,
    attemptsRemaining: readFinite(error?.attemptsRemaining),
    retryAfter:
      readFinite(error?.retryAfter) ?? parseRetryAfter(retryAfterHeader),
  })
}

/** Keeps `next` off the body when the caller did not pass a path. */
function optionalNext(next?: string) {
  return next ? { next } : {}
}

/** Reads redirectTo and rejects values the router must not follow. */
function readRedirectTo(data: unknown) {
  return safeRedirectPath(readString(data, "redirectTo"))
}

function readString(data: unknown, key: string) {
  const value = readValue(data, key)
  return typeof value === "string" ? value : undefined
}

function readNumber(data: unknown, key: string) {
  return readFinite(readValue(data, key))
}

function readValue(data: unknown, key: string) {
  return asRecord(data)?.[key]
}

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined
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
