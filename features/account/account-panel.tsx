"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { LoaderCircleIcon, UserIcon } from "lucide-react"

import { FormField } from "@/components/molecules/form-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatTehranDateTime } from "@/lib/datetime"
import { toAsciiDigits } from "@/lib/digits"
import {
  formatToman,
  formatTomanInput,
  tomanCaretIndex,
  tomanInputToRial,
} from "@/lib/money"
import { formatIranMobile } from "@/features/login/phone"
import {
  creditAccount,
  debitAccount,
  readAccount,
  saveAccount,
  subscribeAccount,
  type AccountProfile,
  type AccountTransaction,
} from "@/features/account/account-store"
import {
  cardCaretIndex,
  cardDigits,
  CARD_LENGTH,
  formatCardInput,
} from "@/features/account/card"
import { TransactionAmount } from "@/features/account/transaction-amount"

const fieldClassName = "h-11 text-base"
const MAX_AVATAR_BYTES = 350 * 1024
const MAX_NAME_LENGTH = 60

type AccountPanelProps = {
  initialAccount?: AccountProfile | null
}

/** Warns before refresh or close while a save is in progress. */
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

function subscribeHydration() {
  return () => {}
}

function isHydrated() {
  return true
}

function isServer() {
  return false
}

function emptyAccount() {
  return null
}

/** Account profile editor and wallet, or a prompt when nobody is signed in. */
export function AccountPanel({ initialAccount }: AccountPanelProps) {
  if (initialAccount !== undefined) {
    return <PreviewAccount initialAccount={initialAccount} />
  }

  return <StoredAccount />
}

function PreviewAccount({
  initialAccount,
}: {
  initialAccount: AccountProfile | null
}) {
  const [account, setAccount] = useState(initialAccount)
  if (!account) {
    return <AccountGuest />
  }

  return <AccountBody account={account} onAccountChange={setAccount} />
}

function StoredAccount() {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    isHydrated,
    isServer
  )
  const account = useSyncExternalStore(
    subscribeAccount,
    readAccount,
    emptyAccount
  )

  if (!hydrated) {
    return <AccountSkeleton />
  }

  if (!account) {
    return <AccountGuest />
  }

  return <AccountBody account={account} onAccountChange={saveAccount} />
}

function AccountSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className="h-64" />
      <Skeleton className="h-80" />
    </div>
  )
}

function AccountGuest() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>وارد نشده‌اید</CardTitle>
        <CardDescription>
          برای دیدن حساب کاربری با شماره موبایل وارد شوید.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          nativeButton={false}
          render={<Link href="/login" />}
          className="h-11"
        >
          ورود
        </Button>
      </CardFooter>
    </Card>
  )
}

function AccountBody({
  account,
  onAccountChange,
}: {
  account: AccountProfile
  onAccountChange: (next: AccountProfile) => void
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileForm account={account} onAccountChange={onAccountChange} />
      <WalletSection account={account} onAccountChange={onAccountChange} />
    </div>
  )
}

function ProfileForm({
  account,
  onAccountChange,
}: {
  account: AccountProfile
  onAccountChange: (next: AccountProfile) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(account.name)
  const [avatarDataUrl, setAvatarDataUrl] = useState(account.avatarDataUrl)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [pending, setPending] = useState(false)
  useBlockUnload(pending)

  function onAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      setError("فقط تصویر مجاز است.")
      setNotice("")
      return
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setError("حجم تصویر باید کمتر از ۳۵۰ کیلوبایت باشد.")
      setNotice("")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      if (!result.startsWith("data:image/") || result.includes('"')) {
        setError("فقط تصویر مجاز است.")
        setNotice("")
        return
      }

      setAvatarDataUrl(result)
      setError("")
      setNotice("")
    }
    reader.readAsDataURL(file)
  }

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) {
      return
    }

    setPending(true)
    setError("")
    setNotice("")

    try {
      onAccountChange({
        ...account,
        name: name.trim().slice(0, MAX_NAME_LENGTH),
        avatarDataUrl,
      })
      setNotice("ذخیره شد")
    } catch {
      setError("ذخیره انجام نشد. دوباره تلاش کنید.")
    } finally {
      setPending(false)
    }
  }

  const avatarLabel = name.trim() ? `تصویر ${name.trim()}` : "آواتار"

  return (
    <Card>
      <CardHeader>
        <CardTitle>مشخصات</CardTitle>
        <CardDescription>
          شماره {formatIranMobile(account.phone)}. نام و تصویر را اضافه یا
          ویرایش کنید.
        </CardDescription>
      </CardHeader>
      <form onSubmit={saveProfile}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div
              role="img"
              aria-label={avatarLabel}
              className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted bg-cover bg-center"
              style={
                avatarDataUrl.startsWith("data:image/")
                  ? { backgroundImage: `url("${avatarDataUrl}")` }
                  : undefined
              }
            >
              {avatarDataUrl.startsWith("data:image/") ? null : (
                <UserIcon className="text-muted-foreground" aria-hidden />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                id="avatar"
                name="avatar"
                type="file"
                accept="image/*"
                aria-label="تصویر حساب"
                className="sr-only"
                onChange={onAvatarChange}
              />
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={pending}
                onClick={() => fileRef.current?.click()}
              >
                {avatarDataUrl ? "تغییر تصویر" : "افزودن تصویر"}
              </Button>
              {avatarDataUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11"
                  disabled={pending}
                  onClick={() => {
                    setAvatarDataUrl("")
                    setNotice("")
                  }}
                >
                  حذف تصویر
                </Button>
              ) : null}
            </div>
          </div>
          <FormField id="name" label="نام" error={error}>
            <Input
              id="name"
              name="name"
              className={fieldClassName}
              autoComplete="name"
              maxLength={MAX_NAME_LENGTH}
              value={name}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "name-error" : undefined}
              onChange={(event) => {
                setName(event.target.value)
                setError("")
                setNotice("")
              }}
            />
          </FormField>
          {notice ? (
            <p className="text-sm text-muted-foreground" role="status">
              {notice}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="h-11 w-full sm:w-auto"
            disabled={pending}
          >
            {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
            {pending ? "در حال ذخیره" : "ذخیره"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function WalletSection({
  account,
  onAccountChange,
}: {
  account: AccountProfile
  onAccountChange: (next: AccountProfile) => void
}) {
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [depositError, setDepositError] = useState("")
  const [withdrawError, setWithdrawError] = useState("")
  const [cardError, setCardError] = useState("")
  const [notice, setNotice] = useState("")
  const [pending, setPending] = useState<"deposit" | "withdraw" | "">("")
  const walletLock = useRef(false)
  useBlockUnload(pending !== "")
  const transactions = [...account.transactions].reverse()

  function applyChange(next: AccountProfile) {
    try {
      onAccountChange(next)
      return ""
    } catch {
      return "ثبت تراکنش انجام نشد. دوباره تلاش کنید."
    }
  }

  function finishWalletAction() {
    window.setTimeout(() => {
      walletLock.current = false
      setPending("")
    }, 250)
  }

  function submitDeposit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || walletLock.current) {
      return
    }

    const amountRial = tomanInputToRial(depositAmount)
    if (!amountRial) {
      setDepositError("مبلغ را به تومان وارد کنید.")
      setNotice("")
      return
    }

    walletLock.current = true
    setPending("deposit")
    setDepositError("")
    setNotice("")
    const failure = applyChange(creditAccount(account, amountRial))
    if (failure) {
      setDepositError(failure)
    } else {
      setDepositAmount("")
      setDepositOpen(false)
      setNotice("موجودی افزایش یافت.")
    }
    finishWalletAction()
  }

  function submitWithdraw(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || walletLock.current) {
      return
    }

    const amountRial = tomanInputToRial(withdrawAmount)
    if (!amountRial) {
      setWithdrawError("مبلغ را به تومان وارد کنید.")
      setNotice("")
      return
    }

    if (cardDigits(cardNumber).length !== CARD_LENGTH) {
      setCardError("شماره کارت را ۱۶ رقم وارد کنید.")
      setNotice("")
      return
    }

    const next = debitAccount(account, amountRial)
    if (!next) {
      setWithdrawError("مبلغ برداشت از موجودی بیشتر است.")
      setNotice("")
      return
    }

    walletLock.current = true
    setPending("withdraw")
    setWithdrawError("")
    setNotice("")
    const failure = applyChange(next)
    if (failure) {
      setWithdrawError(failure)
    } else {
      setWithdrawAmount("")
      setCardNumber("")
      setWithdrawOpen(false)
      setNotice("درخواست برداشت ثبت شد.")
    }
    finishWalletAction()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>کیف پول</CardTitle>
        <CardDescription>مبلغ‌ها به تومان نمایش داده می‌شوند.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">موجودی</p>
          <p className="text-2xl font-medium">
            {formatToman(account.balanceRial)}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Dialog
            open={depositOpen}
            onOpenChange={(open) => {
              setDepositOpen(open)
              if (!open) {
                setDepositError("")
              }
            }}
          >
            <DialogTrigger
              render={
                <Button className="h-11 w-full" disabled={pending !== ""} />
              }
            >
              افزایش موجودی
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>افزایش موجودی</DialogTitle>
                <DialogDescription>
                  مبلغ را به تومان وارد کنید.
                </DialogDescription>
              </DialogHeader>
              <form className="flex flex-col gap-4" onSubmit={submitDeposit}>
                <TomanField
                  id="deposit-amount"
                  label="مبلغ"
                  value={depositAmount}
                  error={depositError}
                  onChange={(value) => {
                    setDepositAmount(value)
                    setDepositError("")
                    setNotice("")
                  }}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="h-11 w-full"
                    disabled={pending !== ""}
                  >
                    {pending === "deposit" ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : null}
                    {pending === "deposit" ? "در حال افزایش" : "افزایش موجودی"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog
            open={withdrawOpen}
            onOpenChange={(open) => {
              setWithdrawOpen(open)
              if (!open) {
                setWithdrawError("")
                setCardError("")
              }
            }}
          >
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className="h-11 w-full"
                  disabled={pending !== ""}
                />
              }
            >
              درخواست برداشت
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>درخواست برداشت</DialogTitle>
                <DialogDescription>
                  مبلغ و شماره کارت مقصد را وارد کنید.
                </DialogDescription>
              </DialogHeader>
              <form className="flex flex-col gap-4" onSubmit={submitWithdraw}>
                <TomanField
                  id="withdraw-amount"
                  label="مبلغ"
                  value={withdrawAmount}
                  error={withdrawError}
                  onChange={(value) => {
                    setWithdrawAmount(value)
                    setWithdrawError("")
                    setNotice("")
                  }}
                />
                <CardField
                  value={cardNumber}
                  error={cardError}
                  onChange={(value) => {
                    setCardNumber(value)
                    setCardError("")
                    setNotice("")
                  }}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="h-11 w-full"
                    disabled={pending !== ""}
                  >
                    {pending === "withdraw" ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : null}
                    {pending === "withdraw" ? "در حال ثبت" : "درخواست برداشت"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {notice ? (
          <p className="text-sm text-muted-foreground" role="status">
            {notice}
          </p>
        ) : null}
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium">تراکنش‌ها</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              تراکنشی ثبت نشده است.
            </p>
          ) : (
            <ul className="flex flex-col">
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  )
}

function TomanField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string
  label: string
  value: string
  error: string
  onChange: (value: string) => void
}) {
  const describedBy = [error ? `${id}-error` : "", `${id}-suffix`]
    .filter(Boolean)
    .join(" ")

  function onAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const caret = input.selectionStart ?? input.value.length
    const digitsBeforeCaret = toAsciiDigits(
      input.value.slice(0, caret)
    ).replace(/\D/g, "").length
    const next = formatTomanInput(input.value)
    onChange(next)
    const nextCaret = tomanCaretIndex(next, digitsBeforeCaret)
    window.requestAnimationFrame(() => {
      input.setSelectionRange(nextCaret, nextCaret)
    })
  }

  return (
    <FormField id={id} label={label} error={error}>
      <div className="relative" dir="ltr">
        <Input
          id={id}
          name={id}
          className={`${fieldClassName} ps-16 text-end`}
          dir="ltr"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          onChange={onAmountChange}
        />
        <span
          id={`${id}-suffix`}
          className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 text-sm text-muted-foreground"
        >
          تومان
        </span>
      </div>
    </FormField>
  )
}

function CardField({
  value,
  error,
  onChange,
}: {
  value: string
  error: string
  onChange: (value: string) => void
}) {
  const describedBy = error ? "card-number-error" : undefined

  function onCardChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const caret = input.selectionStart ?? input.value.length
    const digitsBeforeCaret = toAsciiDigits(
      input.value.slice(0, caret)
    ).replace(/\D/g, "").length
    const next = formatCardInput(input.value)
    onChange(next)
    const nextCaret = cardCaretIndex(next, digitsBeforeCaret)
    window.requestAnimationFrame(() => {
      input.setSelectionRange(nextCaret, nextCaret)
    })
  }

  return (
    <FormField id="card-number" label="شماره کارت" error={error}>
      <Input
        id="card-number"
        name="cc-number"
        className={fieldClassName}
        dir="ltr"
        inputMode="numeric"
        autoComplete="cc-number"
        value={value}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        placeholder="۶۰۳۷ ۹۹۱۹ ۱۲۳۴ ۵۶۷۸"
        onChange={onCardChange}
      />
    </FormField>
  )
}

function TransactionRow({ transaction }: { transaction: AccountTransaction }) {
  const isDeposit = transaction.kind === "deposit"

  return (
    <li className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-1">
        <Badge variant={isDeposit ? "secondary" : "outline"}>
          {isDeposit ? "افزایش موجودی" : "برداشت"}
        </Badge>
        <time
          dateTime={transaction.createdAt}
          className="text-xs text-muted-foreground"
        >
          {formatTehranDateTime(transaction.createdAt)}
        </time>
      </div>
      <TransactionAmount
        amountRial={transaction.amountRial}
        kind={transaction.kind}
      />
    </li>
  )
}
