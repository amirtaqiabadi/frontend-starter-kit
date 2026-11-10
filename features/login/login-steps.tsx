import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import {
  ClipboardPasteIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderCircleIcon,
} from "lucide-react"

import { FormField } from "@/components/molecules/form-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { toPersianDigits } from "@/lib/digits"
import {
  formatIranMobile,
  MOBILE_INPUT_MAX,
  MOBILE_LENGTH,
  normalizeOtp,
  otpFromClipboard,
  OTP_LENGTH,
  toAsciiDigits,
} from "@/features/login/phone"
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordRules,
  passwordRulesMet,
  passwordStrength,
  GUESSABLE_PASSWORD_ERROR,
  isGuessablePassword,
  PERSIAN_KEYBOARD_ERROR,
  stripPersianKeyboard,
} from "@/features/login/password"

export const fieldClassName = "h-11 text-base"

const OTP_DIGIT_PATTERN = "^[0-9۰-۹٠-٩]+$"

type LoginStepCardProps = {
  title: string
  description?: ReactNode
  children: ReactNode
}

/** Shared card chrome for one login screen. The step name is the page heading. */
export function LoginStepCard({
  title,
  description,
  children,
}: LoginStepCardProps) {
  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-medium">{title}</h1>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {children}
    </Card>
  )
}

type PhoneStepProps = {
  phone: string
  error: string
  pending: boolean
  lockIn: number
  onPhoneChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

/** Collects the Iranian mobile number and starts identify. */
export function PhoneStep({
  phone,
  error,
  pending,
  lockIn,
  onPhoneChange,
  onSubmit,
}: PhoneStepProps) {
  const phoneComplete =
    toAsciiDigits(phone).replace(/\D/g, "").length === MOBILE_LENGTH

  return (
    <LoginStepCard title="ورود یا ثبت‌نام">
      <form className="flex flex-col gap-(--card-spacing)" onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">
          <FormField id="phone" label="شماره موبایل" error={error}>
            <Input
              id="phone"
              name="tel"
              className={`${fieldClassName} text-xl font-bold md:text-xl`}
              dir="ltr"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              autoFocus
              enterKeyHint="next"
              maxLength={MOBILE_INPUT_MAX}
              value={phone}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "phone-error" : undefined}
              placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
              onChange={onPhoneChange}
            />
          </FormField>
          <p className="text-sm text-muted-foreground">
            با ثبت‌نام، قوانین و مقررات وبسایت را می‌پذیرم.
          </p>
        </CardContent>
        <CardFooter>
          <PendingButton
            pending={pending}
            lockIn={lockIn}
            idleLabel="دریافت کد"
            disabled={!phoneComplete}
          >
            در حال بررسی
          </PendingButton>
        </CardFooter>
      </form>
    </LoginStepCard>
  )
}

type PasswordInputProps = {
  id: string
  name: string
  autoComplete: "current-password" | "new-password"
  value: string
  error: string
  onChange: (value: string) => void
}

/** Password field that rejects Persian input and can reveal its value. */
function PasswordInput({
  id,
  name,
  autoComplete,
  value,
  error,
  onChange,
}: PasswordInputProps) {
  const [keyboardError, setKeyboardError] = useState("")
  const [visible, setVisible] = useState(false)
  const shownError = keyboardError || error

  function changePassword(nextValue: string) {
    const next = stripPersianKeyboard(nextValue)
    setKeyboardError(next.rejected ? PERSIAN_KEYBOARD_ERROR : "")
    onChange(next.value)
  }

  return (
    <FormField id={id} label="رمز عبور" error={shownError}>
      <div className="relative" dir="ltr">
        <Input
          id={id}
          name={name}
          className={`${fieldClassName} pe-12`}
          dir="ltr"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoFocus
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          value={value}
          aria-invalid={Boolean(shownError) || undefined}
          aria-describedby={shownError ? `${id}-error` : undefined}
          onChange={(event) => changePassword(event.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          className="absolute end-0 top-0 h-11 w-11"
          aria-label={visible ? "پنهان کردن رمز" : "نمایش رمز"}
          aria-pressed={visible}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </Button>
      </div>
    </FormField>
  )
}

type PasswordStepProps = {
  phone: string
  password: string
  error: string
  pending: boolean
  lockIn: number
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onForgotPassword: () => void
  onLoginWithCode: () => void
}

/** Password login for accounts that already have a password. */
export function PasswordStep({
  phone,
  password,
  error,
  pending,
  lockIn,
  onPasswordChange,
  onSubmit,
  onForgotPassword,
  onLoginWithCode,
}: PasswordStepProps) {
  return (
    <LoginStepCard title="رمز عبور">
      <form className="flex flex-col gap-(--card-spacing)" onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">
          <FormField id="account-phone" label="شماره موبایل">
            <Input
              id="account-phone"
              name="tel"
              className={`${fieldClassName} text-xl font-bold md:text-xl`}
              dir="ltr"
              type="tel"
              autoComplete="tel"
              value={formatIranMobile(phone)}
              disabled
            />
          </FormField>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            error={error}
            onChange={onPasswordChange}
          />
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2">
          <PendingButton
            pending={pending}
            lockIn={lockIn}
            idleLabel="ورود"
            disabled={password.length < PASSWORD_MIN_LENGTH}
          >
            در حال ورود
          </PendingButton>
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-11 flex-1"
              disabled={pending}
              onClick={onForgotPassword}
            >
              فراموشی رمز عبور
            </Button>
            <span
              aria-hidden
              className="h-6 w-px self-center border-s border-dashed border-border"
            />
            <Button
              type="button"
              variant="ghost"
              className="h-11 flex-1"
              disabled={pending}
              onClick={onLoginWithCode}
            >
              ورود با کد
            </Button>
          </div>
        </CardFooter>
      </form>
    </LoginStepCard>
  )
}

type OtpStepProps = {
  phone: string
  otp: string
  error: string
  pending: boolean
  lockIn: number
  resendIn: number
  devCode: string
  onOtpChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onResend: () => void
}

const OTP_PASTE_INVALID = "کد معتبری برای چسباندن پیدا نشد."
const OTP_PASTE_FAILED = "چسباندن انجام نشد. دوباره تلاش کنید."

/** 5-digit SMS code, with optional development-only code banner. */
export function OtpStep({
  phone,
  otp,
  error,
  pending,
  lockIn,
  resendIn,
  devCode,
  onOtpChange,
  onSubmit,
  onResend,
}: OtpStepProps) {
  const [pasting, setPasting] = useState(false)
  const [pasteError, setPasteError] = useState("")
  const formRef = useRef<HTMLFormElement>(null)
  const submittedCode = useRef("")
  const shownError = pasteError || error

  /** Submits once, when the fifth digit arrives. */
  useEffect(() => {
    if (otp.length !== OTP_LENGTH) {
      submittedCode.current = ""
      return
    }

    if (pending || lockIn > 0 || submittedCode.current === otp) {
      return
    }

    const form = formRef.current
    if (!form) {
      return
    }

    submittedCode.current = otp
    form.requestSubmit()
  }, [lockIn, otp, pending])

  function changeOtp(value: string) {
    setPasteError("")
    onOtpChange(value)
  }

  async function pasteCode() {
    if (pasting || pending) {
      return
    }

    setPasting(true)
    setPasteError("")

    try {
      if (!navigator.clipboard?.readText) {
        throw new Error("clipboard unavailable")
      }

      const code = otpFromClipboard(await navigator.clipboard.readText())
      if (!code) {
        setPasteError(OTP_PASTE_INVALID)
        return
      }

      onOtpChange(code)
    } catch {
      setPasteError(OTP_PASTE_FAILED)
    } finally {
      setPasting(false)
    }
  }

  return (
    <>
      <LoginStepCard
        title="ورود کد"
        description={
          <>
            کد {toPersianDigits(String(OTP_LENGTH))} رقمی ارسال‌شده به{" "}
            <bdi dir="ltr">{formatIranMobile(phone)}</bdi> را وارد کنید.
          </>
        }
      >
        <form
          ref={formRef}
          className="flex flex-col gap-(--card-spacing)"
          onSubmit={onSubmit}
        >
          <CardContent>
            <FormField id="otp" label="کد تأیید" labelHidden error={shownError}>
              <div className="flex flex-wrap items-center justify-center gap-2 text-foreground">
                <InputOTP
                  id="otp"
                  name="otp"
                  maxLength={OTP_LENGTH}
                  value={otp}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  enterKeyHint="done"
                  disabled={pending}
                  pattern={OTP_DIGIT_PATTERN}
                  pasteTransformer={normalizeOtp}
                  aria-invalid={Boolean(shownError) || undefined}
                  aria-describedby={shownError ? "otp-error" : undefined}
                  className="text-base"
                  onChange={changeOtp}
                >
                  <InputOTPGroup dir="ltr" className="justify-center gap-2">
                    {Array.from({ length: OTP_LENGTH }, (_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="size-11 shrink-0 rounded-lg border text-xl font-bold first:rounded-lg last:rounded-lg"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 text-foreground"
                  disabled={pending || pasting}
                  onClick={() => {
                    void pasteCode()
                  }}
                >
                  {pasting ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <ClipboardPasteIcon />
                  )}
                  {pasting ? "در حال چسباندن" : "چسباندن کد"}
                </Button>
              </div>
            </FormField>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            {otp.length > 0 ? (
              <PendingButton
                pending={pending}
                lockIn={lockIn}
                idleLabel="تایید کد"
                disabled={otp.length !== OTP_LENGTH}
              >
                در حال بررسی
              </PendingButton>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full"
              disabled={pending || resendIn > 0}
              onClick={onResend}
            >
              {resendIn > 0
                ? `ارسال دوباره تا ${toPersianDigits(String(resendIn))} ثانیه`
                : "ارسال دوباره"}
            </Button>
          </CardFooter>
        </form>
      </LoginStepCard>
      {devCode ? <DevCodeBanner code={devCode} /> : null}
    </>
  )
}

type PasswordCreateStepProps = {
  mode: "set" | "reset"
  password: string
  error: string
  pending: boolean
  lockIn: number
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

/** First password after signup, or required replacement after reset. */
export function PasswordCreateStep({
  mode,
  password,
  error,
  pending,
  lockIn,
  onPasswordChange,
  onSubmit,
}: PasswordCreateStepProps) {
  const isReset = mode === "reset"
  const guessable = isGuessablePassword(password)
  const fieldError = guessable ? GUESSABLE_PASSWORD_ERROR : error

  return (
    <LoginStepCard
      title={isReset ? "رمز عبور جدید" : "ثبت رمز عبور"}
      description={
        isReset
          ? "رمز عبور جدید را وارد کنید. این کار نشست‌های دیگر را می‌بندد."
          : "برای ورودهای بعدی رمز عبور مشخص کنید."
      }
    >
      <form className="flex flex-col gap-(--card-spacing)" onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">
          <PasswordInput
            id="new-password"
            name="new-password"
            autoComplete="new-password"
            value={password}
            error={fieldError}
            onChange={onPasswordChange}
          />
          <PasswordStrengthMeter password={password} />
          <PasswordChecklist password={password} />
        </CardContent>
        <CardFooter>
          <PendingButton
            pending={pending}
            lockIn={lockIn}
            idleLabel={isReset ? "ذخیره رمز جدید" : "ثبت رمز"}
            disabled={!passwordRulesMet(password) || guessable}
          >
            در حال ذخیره
          </PendingButton>
        </CardFooter>
      </form>
    </LoginStepCard>
  )
}

/** Segmented meter that fills as the password meets more rules. */
function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = passwordStrength(password)
  const segments = passwordRules(password).length
  const fill =
    strength.score <= 1
      ? "bg-destructive"
      : strength.score === 2
        ? "bg-destructive/70"
        : "bg-success"

  return (
    <div className="flex flex-col gap-2">
      {strength.label ? (
        <div className="flex justify-end text-sm">
          <span
            className={
              strength.score > 2
                ? "text-success"
                : strength.score === 1
                  ? "text-destructive"
                  : undefined
            }
          >
            {strength.label}
          </span>
        </div>
      ) : null}
      <div
        className="flex gap-1"
        role="meter"
        aria-label="قدرت رمز"
        aria-valuemin={0}
        aria-valuemax={segments}
        aria-valuenow={strength.score}
        aria-valuetext={strength.label || "وارد نشده"}
      >
        {Array.from({ length: segments }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < strength.score ? fill : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

/** Requirement list that checks itself as the password changes. */
function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-2">
      {passwordRules(password).map((rule) => (
        <li key={rule.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={rule.met}
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none"
          />
          <span className={rule.met ? undefined : "text-muted-foreground"}>
            {rule.label}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Copies the development OTP and shows whether the copy succeeded. */
function DevCodeBanner({ code }: { code: string }) {
  const [phase, setPhase] = useState<"idle" | "copying" | "copied" | "error">(
    "idle"
  )

  useEffect(() => {
    if (phase !== "copied") {
      return
    }

    const timer = window.setTimeout(() => {
      setPhase("idle")
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [phase])

  async function copyCode() {
    if (phase === "copying") {
      return
    }

    setPhase("copying")

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("clipboard unavailable")
      }

      await navigator.clipboard.writeText(code)
      setPhase("copied")
    } catch {
      setPhase("error")
    }
  }

  const label =
    phase === "copying" ? "در حال کپی" : phase === "copied" ? "کپی شد" : "کپی"

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
        <p className="text-sm">
          کد توسعه: <bdi dir="ltr">{code}</bdi>
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0"
          disabled={phase === "copying"}
          onClick={() => {
            void copyCode()
          }}
        >
          {phase === "copying" ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <CopyIcon />
          )}
          {label}
        </Button>
      </div>
      <p className="sr-only" role="status">
        {phase === "copied" ? "کد کپی شد." : ""}
      </p>
      {phase === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          کپی انجام نشد. دوباره تلاش کنید.
        </p>
      ) : null}
    </div>
  )
}

type PendingButtonProps = {
  pending: boolean
  lockIn: number
  idleLabel: string
  disabled?: boolean
  children: ReactNode
}

/** Primary submit control that blocks repeats and shows wait time. */
function PendingButton({
  pending,
  lockIn,
  idleLabel,
  disabled = false,
  children,
}: PendingButtonProps) {
  const locked = lockIn > 0

  return (
    <Button
      type="submit"
      className="h-11 w-full"
      disabled={disabled || pending || locked}
    >
      {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
      {pending
        ? children
        : locked
          ? `صبر کنید ${toPersianDigits(String(lockIn))} ثانیه`
          : idleLabel}
    </Button>
  )
}
