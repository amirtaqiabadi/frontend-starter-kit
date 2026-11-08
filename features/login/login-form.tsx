"use client"

import {
  useEffect,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react"
import { useRouter } from "next/navigation"

import { signInAccount } from "@/features/account/account-store"
import {
  clearInviteToken,
  readInviteToken,
  rememberInviteToken,
} from "@/features/login/invite-token"
import {
  formatLoginError,
  identifyAccount,
  isLoginApiError,
  loginWithPassword,
  requestOtp,
  resetPassword as submitResetPassword,
  setPassword as submitSetPassword,
  verifyOtp,
  type OtpPurpose,
} from "@/features/login/login-api"
import {
  OtpStep,
  PasswordCreateStep,
  PasswordStep,
  PhoneStep,
} from "@/features/login/login-steps"
import { passwordError, passwordLengthError } from "@/features/login/password"
import {
  formatMobileInput,
  mobileCaretIndex,
  normalizeIranMobile,
  normalizeOtp,
  OTP_LENGTH,
  toAsciiDigits,
} from "@/features/login/phone"
import { safeRedirectPath } from "@/features/login/redirect-path"

export type LoginStep =
  "phone" | "password" | "otp" | "set-password" | "reset-password"

type LoginFormProps = {
  initialStep?: LoginStep
  initialPhone?: string
  next?: string
  inviteToken?: string
}

/** Phone login against the auth API: identify, password or OTP, then optional set/reset. */
export function LoginForm({
  initialStep = "phone",
  initialPhone = "",
  next,
  inviteToken,
}: LoginFormProps) {
  const router = useRouter()
  const redirectTo = safeRedirectPath(next)
  const [step, setStep] = useState<LoginStep>(initialStep)
  const [phone, setPhone] = useState(() => formatMobileInput(initialPhone))
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [lockIn, setLockIn] = useState(0)
  const [devCode, setDevCode] = useState("")
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>(
    initialStep === "reset-password" ? "RESET_PASSWORD" : "LOGIN"
  )
  const [pendingRedirect, setPendingRedirect] = useState(redirectTo)

  useBlockUnload(pending)
  useCountdown(resendIn, setResendIn)
  useCountdown(lockIn, setLockIn)
  useEffect(() => {
    rememberInviteToken(inviteToken)
  }, [inviteToken])

  async function submitPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const phoneNumber = readPhone()
    if (!phoneNumber || pending) {
      return
    }

    await runRequest(async () => {
      const identified = await identifyAccount(phoneNumber)
      if (identified.nextStep === "PASSWORD") {
        setPassword("")
        setStep("password")
        return
      }

      await sendOtp(phoneNumber, "LOGIN")
    })
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const phoneNumber = readPhone()
    if (!phoneNumber || pending) {
      return
    }

    const issue = passwordLengthError(password)
    if (issue) {
      setError(issue)
      return
    }

    await runRequest(async () => {
      const result = await loginWithPassword({
        phoneNumber,
        password,
        next: redirectTo,
      })
      finishLogin(result.redirectTo)
    })
  }

  async function submitOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const phoneNumber = readPhone()
    const code = normalizeOtp(otp)
    if (!phoneNumber || pending) {
      return
    }

    if (code.length !== OTP_LENGTH) {
      setError(`کد ${OTP_LENGTH} رقمی را کامل وارد کنید.`)
      return
    }

    await runRequest(async () => {
      const storedToken = otpPurpose === "LOGIN" ? readInviteToken() : ""
      const result = await verifyOtp({
        phoneNumber,
        code,
        purpose: otpPurpose,
        next: redirectTo,
        token: storedToken || undefined,
      })
      clearInviteToken()
      setPendingRedirect(result.redirectTo)
      setPassword("")

      if (otpPurpose === "RESET_PASSWORD") {
        setStep("reset-password")
        return
      }

      if (!result.hasPassword) {
        setStep("set-password")
        return
      }

      finishLogin(result.redirectTo)
    })
  }

  async function submitNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) {
      return
    }

    const issue = passwordError(password)
    if (issue) {
      setError(issue)
      return
    }

    await runRequest(async () => {
      if (step === "reset-password") {
        await submitResetPassword(password)
      } else {
        await submitSetPassword(password)
      }
      finishLogin(pendingRedirect)
    })
  }

  async function resendCode() {
    const phoneNumber = readPhone()
    if (!phoneNumber || pending || resendIn > 0) {
      return
    }

    await runRequest(async () => {
      await sendOtp(phoneNumber, otpPurpose)
    }, "resend")
  }

  async function forgotPassword() {
    const phoneNumber = readPhone()
    if (!phoneNumber || pending) {
      return
    }

    await runRequest(async () => {
      await sendOtp(phoneNumber, "RESET_PASSWORD")
    })
  }

  function skipSetPassword() {
    if (pending) {
      return
    }

    finishLogin(pendingRedirect)
  }

  function editPhone() {
    if (pending) {
      return
    }

    setStep("phone")
    setPhone(formatMobileInput(phone))
    setOtp("")
    setPassword("")
    setError("")
    setResendIn(0)
    setLockIn(0)
    setDevCode("")
    setOtpPurpose("LOGIN")
  }

  function onPhoneChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const caret = input.selectionStart ?? input.value.length
    const digitsBeforeCaret = toAsciiDigits(
      input.value.slice(0, caret)
    ).replace(/\D/g, "").length
    const digits = toAsciiDigits(input.value).replace(/\D/g, "")
    const prefixed = digits.length > 0 && !digits.startsWith("0")
    const nextCaret = mobileCaretIndex(digitsBeforeCaret + (prefixed ? 1 : 0))

    setPhone(formatMobileInput(input.value))
    setError("")
    window.requestAnimationFrame(() => {
      input.setSelectionRange(nextCaret, nextCaret)
    })
  }

  async function sendOtp(phoneNumber: string, purpose: OtpPurpose) {
    const requested = await requestOtp(phoneNumber)
    setOtpPurpose(purpose)
    setOtp("")
    setPassword("")
    setDevCode(requested.devCode)
    setResendIn(requested.cooldownSeconds)
    setLockIn(0)
    setStep("otp")
  }

  async function runRequest(
    action: () => Promise<void>,
    throttle: "submit" | "resend" = "submit"
  ) {
    if (pending) {
      return
    }

    setPending(true)
    setError("")

    try {
      await action()
    } catch (reason) {
      applyError(reason, throttle)
    } finally {
      setPending(false)
    }
  }

  function applyError(reason: unknown, throttle: "submit" | "resend") {
    if (!isLoginApiError(reason)) {
      setError("درخواست انجام نشد. دوباره تلاش کنید.")
      return
    }

    setError(formatLoginError(reason))

    if (typeof reason.retryAfter === "number" && reason.retryAfter > 0) {
      if (throttle === "resend") {
        setResendIn(reason.retryAfter)
      } else {
        setLockIn(reason.retryAfter)
        if (reason.code !== "LOCKED") {
          setResendIn(reason.retryAfter)
        }
      }
    }

    if (reason.code === "OTP_EXHAUSTED" || reason.code === "OTP_EXPIRED") {
      setOtp("")
      setResendIn(0)
    }

    if (reason.code === "INVALID_PHONE") {
      setStep("phone")
    }

    if (reason.code === "UNAUTHORIZED") {
      setStep("phone")
      setOtp("")
      setPassword("")
    }

    if (reason.code === "RESET_NOT_ALLOWED") {
      setOtpPurpose("RESET_PASSWORD")
      setOtp("")
      setResendIn(0)
      setStep("otp")
    }

    if (reason.code === "PASSWORD_EXISTS") {
      finishLogin(pendingRedirect)
    }
  }

  function readPhone() {
    const phoneNumber = normalizeIranMobile(phone)
    if (!phoneNumber) {
      setError("شماره موبایل را با ۰۹ و ۱۱ رقم وارد کنید.")
      setStep("phone")
      return ""
    }

    return phoneNumber
  }

  function finishLogin(path: string) {
    const phoneNumber = normalizeIranMobile(phone)
    if (phoneNumber) {
      signInAccount(phoneNumber)
    }
    router.push(safeRedirectPath(path))
  }

  if (step === "password") {
    return (
      <PasswordStep
        phone={phone}
        password={password}
        error={error}
        pending={pending}
        lockIn={lockIn}
        onPasswordChange={(value) => {
          setPassword(value)
          setError("")
        }}
        onSubmit={submitPassword}
        onForgotPassword={forgotPassword}
        onEditPhone={editPhone}
      />
    )
  }

  if (step === "otp") {
    return (
      <OtpStep
        phone={phone}
        otp={otp}
        error={error}
        pending={pending}
        lockIn={lockIn}
        resendIn={resendIn}
        devCode={devCode}
        onOtpChange={(value) => {
          setOtp(normalizeOtp(value))
          setError("")
        }}
        onSubmit={submitOtp}
        onResend={resendCode}
        onEditPhone={editPhone}
      />
    )
  }

  if (step === "set-password" || step === "reset-password") {
    return (
      <PasswordCreateStep
        mode={step === "reset-password" ? "reset" : "set"}
        password={password}
        error={error}
        pending={pending}
        lockIn={lockIn}
        onPasswordChange={(value) => {
          setPassword(value)
          setError("")
        }}
        onSubmit={submitNewPassword}
        onSkip={step === "set-password" ? skipSetPassword : undefined}
      />
    )
  }

  return (
    <PhoneStep
      phone={phone}
      error={error}
      pending={pending}
      lockIn={lockIn}
      onPhoneChange={onPhoneChange}
      onSubmit={submitPhone}
    />
  )
}

/** Warns before refresh or close while a login request is in flight. */
function useBlockUnload(active: boolean) {
  useEffect(() => {
    if (!active) {
      return
    }

    function blockUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
    }

    window.addEventListener("beforeunload", blockUnload)
    return () => window.removeEventListener("beforeunload", blockUnload)
  }, [active])
}

/** Counts a remaining-seconds value down to zero. */
function useCountdown(
  remaining: number,
  setRemaining: Dispatch<SetStateAction<number>>
) {
  useEffect(() => {
    if (remaining <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setRemaining((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [remaining, setRemaining])
}
