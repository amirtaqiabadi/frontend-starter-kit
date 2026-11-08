import type { ChangeEvent, FormEvent, ReactNode } from "react"
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
import { toPersianDigits } from "@/lib/digits"
import {
  formatIranMobile,
  MOBILE_INPUT_MAX,
  MOBILE_LENGTH,
  OTP_LENGTH,
  toAsciiDigits,
} from "@/features/login/phone"
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/features/login/password"

export const fieldClassName = "h-11 text-base"

type LoginStepCardProps = {
  title: string
  description?: ReactNode
  children: ReactNode
}

/** Shared card chrome for one login screen. */
export function LoginStepCard({
  title,
  description,
  children,
}: LoginStepCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
  const describedBy = [error ? "phone-error" : "", "phone-hint"]
    .filter(Boolean)
    .join(" ")
  const phoneComplete =
    toAsciiDigits(phone).replace(/\D/g, "").length === MOBILE_LENGTH

  return (
    <LoginStepCard title="شماره موبایل">
      <form className="flex flex-col gap-(--card-spacing)" onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">
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
              aria-describedby={describedBy}
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
            idleLabel="ادامه"
            disabled={!phoneComplete}
          >
            در حال بررسی
          </PendingButton>
        </CardFooter>
      </form>
    </LoginStepCard>
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
  onEditPhone: () => void
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
  onEditPhone,
}: PasswordStepProps) {
  return (
    <LoginStepCard
      title="رمز عبور"
      description={
        <>
          رمز عبور شماره <bdi dir="ltr">{formatIranMobile(phone)}</bdi> را وارد
          کنید.
        </>
      }
    >
      <form className="flex flex-col gap-(--card-spacing)" onSubmit={onSubmit}>
        <CardContent>
          <FormField id="password" label="رمز عبور" error={error}>
            <Input
              id="password"
              name="password"
              className={fieldClassName}
              dir="ltr"
              type="password"
              autoComplete="current-password"
              autoFocus
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              value={password}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "password-error" : undefined}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </FormField>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2">
          <PendingButton pending={pending} lockIn={lockIn} idleLabel="ورود">
            در حال ورود
          </PendingButton>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            disabled={pending}
            onClick={onForgotPassword}
          >
            فراموشی رمز عبور
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full"
            disabled={pending}
            onClick={onEditPhone}
          >
            ویرایش شماره
          </Button>
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
  onEditPhone: () => void
}

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
  onEditPhone,
}: OtpStepProps) {
  return (
    <LoginStepCard
      title="کد یک‌بارمصرف"
      description={
        <>
          کد {toPersianDigits(String(OTP_LENGTH))} رقمی ارسال‌شده به{" "}
          <bdi dir="ltr">{formatIranMobile(phone)}</bdi> را وارد کنید.
        </>
      }
    >
      <form className="flex flex-col gap-(--card-spacing)" onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-3">
          {devCode ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm" dir="ltr">
              کد توسعه: {devCode}
            </p>
          ) : null}
          <FormField id="otp" label="کد تأیید" error={error}>
            <Input
              id="otp"
              name="otp"
              className={fieldClassName}
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              enterKeyHint="done"
              maxLength={OTP_LENGTH}
              value={otp}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "otp-error" : undefined}
              placeholder="۱۲۳۴۵"
              onChange={(event) => onOtpChange(event.target.value)}
            />
          </FormField>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2">
          <PendingButton pending={pending} lockIn={lockIn} idleLabel="تأیید کد">
            در حال بررسی
          </PendingButton>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            disabled={pending || resendIn > 0}
            onClick={onResend}
          >
            {resendIn > 0
              ? `ارسال دوباره تا ${toPersianDigits(String(resendIn))} ثانیه`
              : "ارسال دوباره"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full"
            disabled={pending}
            onClick={onEditPhone}
          >
            ویرایش شماره
          </Button>
        </CardFooter>
      </form>
    </LoginStepCard>
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
  onSkip?: () => void
}

/** Optional first password, or required replacement after reset OTP. */
export function PasswordCreateStep({
  mode,
  password,
  error,
  pending,
  lockIn,
  onPasswordChange,
  onSubmit,
  onSkip,
}: PasswordCreateStepProps) {
  const isReset = mode === "reset"

  return (
    <LoginStepCard
      title={isReset ? "رمز عبور جدید" : "تنظیم رمز عبور"}
      description={
        isReset
          ? "رمز عبور جدید را وارد کنید. این کار نشست‌های دیگر را می‌بندد."
          : "می‌توانید برای ورودهای بعد یک رمز بگذارید، یا این مرحله را رد کنید."
      }
    >
      <form className="flex flex-col gap-(--card-spacing)" onSubmit={onSubmit}>
        <CardContent>
          <FormField id="new-password" label="رمز عبور" error={error}>
            <Input
              id="new-password"
              name="new-password"
              className={fieldClassName}
              dir="ltr"
              type="password"
              autoComplete="new-password"
              autoFocus
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              value={password}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "new-password-error" : undefined}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </FormField>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2">
          <PendingButton
            pending={pending}
            lockIn={lockIn}
            idleLabel={isReset ? "ذخیره رمز جدید" : "ذخیره رمز"}
          >
            در حال ذخیره
          </PendingButton>
          {onSkip ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full"
              disabled={pending}
              onClick={onSkip}
            >
              الان نه
            </Button>
          ) : null}
        </CardFooter>
      </form>
    </LoginStepCard>
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
