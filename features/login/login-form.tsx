"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { FormField } from "@/components/molecules/form-field"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { signInAccount } from "@/features/account/account-store"
import { requestLoginOtp, verifyLoginOtp } from "@/features/login/login-api"
import {
  OTP_LENGTH,
  RESEND_SECONDS,
  formatIranMobile,
  formatMobileInput,
  MOBILE_INPUT_MAX,
  mobileCaretIndex,
  normalizeIranMobile,
  normalizeOtp,
  toAsciiDigits,
} from "@/features/login/phone"

type LoginStep = "phone" | "otp"

type LoginFormProps = {
  initialStep?: LoginStep
  initialPhone?: string
}

const fieldClassName = "h-11 text-base"

/** Two-step mobile login: phone number, then a one-time code. */
export function LoginForm({
  initialStep = "phone",
  initialPhone = "",
}: LoginFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>(initialStep)
  const [phone, setPhone] = useState(() => formatMobileInput(initialPhone))
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (!pending) {
      return
    }

    function blockUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
    }

    window.addEventListener("beforeunload", blockUnload)
    return () => window.removeEventListener("beforeunload", blockUnload)
  }, [pending])

  useEffect(() => {
    if (resendIn <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setResendIn((current) => current - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [resendIn])

  async function submitPhone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) {
      return
    }

    const normalized = normalizeIranMobile(phone)
    if (!normalized) {
      setError("شماره موبایل را با ۰۹ و ۱۱ رقم وارد کنید.")
      return
    }

    setPending(true)
    setError("")

    try {
      await requestLoginOtp(normalized)
      setPhone(formatMobileInput(normalized))
      setOtp("")
      setStep("otp")
      setResendIn(RESEND_SECONDS)
    } catch {
      setError("ارسال کد انجام نشد. دوباره تلاش کنید.")
    } finally {
      setPending(false)
    }
  }

  async function submitOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) {
      return
    }

    const code = normalizeOtp(otp)
    if (code.length !== OTP_LENGTH) {
      setError(`کد ${OTP_LENGTH} رقمی را کامل وارد کنید.`)
      return
    }

    const normalized = normalizeIranMobile(phone)
    if (!normalized) {
      setError("شماره موبایل معتبر نیست.")
      return
    }

    setPending(true)
    setError("")

    try {
      await verifyLoginOtp({ phone: normalized, code })
      signInAccount(normalized)
      router.push("/account")
    } catch {
      setError("تأیید کد انجام نشد. دوباره تلاش کنید.")
    } finally {
      setPending(false)
    }
  }

  async function resendCode() {
    if (pending || resendIn > 0) {
      return
    }

    setPending(true)
    setError("")

    try {
      await requestLoginOtp(normalizeIranMobile(phone))
      setResendIn(RESEND_SECONDS)
    } catch {
      setError("ارسال دوباره کد انجام نشد.")
    } finally {
      setPending(false)
    }
  }

  function editPhone() {
    if (pending) {
      return
    }

    setStep("phone")
    setPhone(formatMobileInput(phone))
    setOtp("")
    setError("")
    setResendIn(0)
  }

  function onPhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
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

  if (step === "otp") {
    const otpErrorId = error ? "otp-error" : undefined

    return (
      <Card>
        <CardHeader>
          <CardTitle>کد یک‌بارمصرف</CardTitle>
          <CardDescription>
            کد {OTP_LENGTH} رقمی ارسال‌شده به {formatIranMobile(phone)} را وارد
            کنید.
          </CardDescription>
        </CardHeader>
        <form onSubmit={submitOtp}>
          <CardContent>
            <FormField id="otp" label="کد تأیید" error={error}>
              <Input
                id="otp"
                name="otp"
                className={fieldClassName}
                dir="ltr"
                inputMode="numeric"
                autoComplete="one-time-code"
                enterKeyHint="done"
                maxLength={OTP_LENGTH}
                value={otp}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={otpErrorId}
                placeholder="۱۲۳۴۵"
                onChange={(event) => {
                  setOtp(normalizeOtp(event.target.value))
                  setError("")
                }}
              />
            </FormField>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            <Button type="submit" className="h-11 w-full" disabled={pending}>
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              {pending ? "در حال بررسی" : "تأیید کد"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              disabled={pending || resendIn > 0}
              onClick={resendCode}
            >
              {resendIn > 0
                ? `ارسال دوباره تا ${resendIn} ثانیه`
                : "ارسال دوباره"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full"
              disabled={pending}
              onClick={editPhone}
            >
              ویرایش شماره
            </Button>
          </CardFooter>
        </form>
      </Card>
    )
  }

  const phoneDescribedBy = [error ? "phone-error" : "", "phone-hint"]
    .filter(Boolean)
    .join(" ")

  return (
    <Card>
      <CardHeader>
        <CardTitle>شماره موبایل</CardTitle>
        <CardDescription>
          پس از ثبت شماره، کد یک‌بارمصرف از شما خواسته می‌شود.
        </CardDescription>
      </CardHeader>
      <form onSubmit={submitPhone}>
        <CardContent>
          <FormField
            id="phone"
            label="شماره موبایل"
            error={error}
            hint="مثال: ۰۹۱۲ ۳۴۵ ۶۷۸۹"
          >
            <Input
              id="phone"
              name="tel"
              className={fieldClassName}
              dir="ltr"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              autoFocus
              enterKeyHint="next"
              maxLength={MOBILE_INPUT_MAX}
              value={phone}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={phoneDescribedBy}
              placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
              onChange={onPhoneChange}
            />
          </FormField>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="h-11 w-full" disabled={pending}>
            {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
            {pending ? "در حال ارسال" : "دریافت کد"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
