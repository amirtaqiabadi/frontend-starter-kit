"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LoaderCircleIcon } from "lucide-react"

import { FormField } from "@/components/molecules/form-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatTehranDateTime } from "@/lib/datetime"
import { toAsciiDigits, toPersianDigits } from "@/lib/digits"
import {
  formatToman,
  formatTomanInput,
  formatTomanWords,
  limitTomanInput,
  tomanCaretIndex,
  tomanInputToRial,
} from "@/lib/money"
import { CardNumberField } from "@/features/account/card-number-field"
import { cardDigits, CARD_LENGTH } from "@/features/account/card"
import { bankLogoSrc, resolveBankByCard } from "@/features/account/iran-bank"
import { TransactionAmount } from "@/features/account/transaction-amount"
import {
  initiatePayment,
  isUnauthorized,
  isWalletApiError,
  listRefunds,
  listTransactions,
  listWallets,
  requestRefund,
  WalletApiError,
} from "@/features/account/wallet-api"
import {
  CHARGE_DESCRIPTION,
  isWalletOwner,
  MIN_CHARGE_RIAL,
  MAX_CHARGE_TOMAN,
  refundStatusLabel,
  transactionLabel,
  walletDisplayName,
  walletRoleLabel,
  type CardRefund,
  type LedgerTransaction,
  type Wallet,
} from "@/features/account/wallet-model"
import { loginPath } from "@/features/login/redirect-path"

const fieldClassName = "h-11 text-base"

type PendingAction = "" | "charge" | "refund"

export type WalletPanelProps = {
  initialWallets: Wallet[]
  initialTransactions?: LedgerTransaction[]
  initialRefunds?: CardRefund[]
  preview?: boolean
}

/** Wallet list, top-up, history, and card-refund against the payment API. */
export function WalletPanel({
  initialWallets,
  initialTransactions = [],
  initialRefunds = [],
  preview = false,
}: WalletPanelProps) {
  const router = useRouter()
  const [wallets, setWallets] = useState(initialWallets)
  const [selectedTeamId, setSelectedTeamId] = useState(
    () => initialWallets[0]?.teamId ?? 0
  )
  const [transactions, setTransactions] = useState(initialTransactions)
  const [refunds, setRefunds] = useState(initialRefunds)
  const [fetchedTeamId, setFetchedTeamId] = useState(() =>
    preview ? (initialWallets[0]?.teamId ?? 0) : 0
  )
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [detailsFailed, setDetailsFailed] = useState(false)
  const [detailsNonce, setDetailsNonce] = useState(0)
  const [chargeOpen, setChargeOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawError, setWithdrawError] = useState("")
  const [chargeAmount, setChargeAmount] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [chargeError, setChargeError] = useState("")
  const [cardError, setCardError] = useState("")
  const [actionError, setActionError] = useState<WalletApiError | null>(null)
  const [notice, setNotice] = useState("")
  const [pending, setPending] = useState<PendingAction>("")
  const [lockIn, setLockIn] = useState(0)
  const walletLock = useRef(false)
  const allowUnload = useRef(false)
  useBlockUnload(pending !== "", allowUnload)
  useCountdown(lockIn, setLockIn)

  const selected =
    wallets.find((wallet) => wallet.teamId === selectedTeamId) ?? wallets[0]
  const canCharge = !selected || isWalletOwner(selected)
  const canManage = Boolean(selected && isWalletOwner(selected))
  const detailsLoading =
    !preview && canManage && fetchedTeamId !== selectedTeamId
  const walletItems = useMemo(
    () =>
      Object.fromEntries(
        wallets.map((wallet) => [
          String(wallet.teamId),
          walletDisplayName(wallet.displayName),
        ])
      ),
    [wallets]
  )

  useEffect(() => {
    if (preview || !canManage || !selectedTeamId) {
      return
    }

    const teamId = selectedTeamId
    let cancelled = false

    Promise.all([listTransactions(teamId, page), listRefunds(teamId)])
      .then(([nextTransactions, nextRefunds]) => {
        if (cancelled) {
          return
        }
        setTransactions(nextTransactions.transactions)
        setHasNextPage(nextTransactions.hasNextPage)
        setDetailsFailed(false)
        setRefunds(nextRefunds)
        setFetchedTeamId(teamId)
        setActionError(null)
      })
      .catch((reason) => {
        if (cancelled) {
          return
        }
        if (isUnauthorized(reason)) {
          router.replace(loginPath("/wallet"))
          return
        }
        setFetchedTeamId(teamId)
        setDetailsFailed(true)
        setActionError(toWalletError(reason))
      })

    return () => {
      cancelled = true
    }
  }, [preview, canManage, selectedTeamId, detailsNonce, page, router])

  async function runAction(action: PendingAction, work: () => Promise<void>) {
    if (pending || walletLock.current) {
      return
    }

    walletLock.current = true
    setPending(action)
    setActionError(null)
    setNotice("")

    try {
      await work()
    } catch (reason) {
      if (isUnauthorized(reason)) {
        router.replace(loginPath("/wallet"))
        return
      }
      const error = toWalletError(reason)
      setActionError(error)
      if (typeof error.retryAfter === "number" && error.retryAfter > 0) {
        setLockIn(error.retryAfter)
      }
    } finally {
      walletLock.current = false
      setPending("")
    }
  }

  async function refresh(nextTeamId = selected?.teamId) {
    if (preview) {
      setDetailsNonce((value) => value + 1)
      return
    }

    const nextWallets = await listWallets()
    setWallets(nextWallets)
    const kept =
      nextTeamId && nextWallets.some((wallet) => wallet.teamId === nextTeamId)
        ? nextTeamId
        : nextWallets[0]?.teamId
    setPage(1)
    setSelectedTeamId(kept ?? 0)
    setDetailsNonce((value) => value + 1)
  }

  function submitCharge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amountRial = tomanInputToRial(chargeAmount)
    if (!amountRial) {
      setChargeError("مبلغ را به تومان وارد کنید.")
      return
    }
    if (amountRial < MIN_CHARGE_RIAL) {
      setChargeError(
        `حداقل مبلغ ${toPersianDigits(String(MIN_CHARGE_RIAL / 10))} تومان است.`
      )
      return
    }
    if (amountRial > MAX_CHARGE_TOMAN * 10) {
      setChargeError(`حداکثر مبلغ ${formatToman(MAX_CHARGE_TOMAN * 10)} است.`)
      return
    }

    void runAction("charge", async () => {
      if (preview) {
        applyPreviewCharge(amountRial)
        setChargeAmount("")
        setChargeOpen(false)
        setNotice("موجودی افزایش یافت.")
        return
      }

      const result = await initiatePayment({
        amount: amountRial,
        description: CHARGE_DESCRIPTION,
        teamId:
          selected && isWalletOwner(selected) ? selected.teamId : undefined,
      })
      allowUnload.current = true
      window.location.href = result.paymentUrl
    })
  }

  function submitRefund(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !isWalletOwner(selected)) return
    const amount = tomanInputToRial(withdrawAmount)
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setWithdrawError("مبلغ برداشت را وارد کنید.")
      return
    }
    if (amount > selected.availableBalance) {
      setWithdrawError("مبلغ بیشتر از موجودی قابل برداشت است.")
      return
    }
    const digits = cardDigits(cardNumber)
    if (digits.length !== CARD_LENGTH) {
      setCardError("شماره کارت را ۱۶ رقم وارد کنید.")
      return
    }
    const teamId = selected.teamId
    void runAction("refund", async () => {
      if (preview) {
        applyPreviewRefund(teamId, amount, digits)
      } else {
        await requestRefund({ teamId, amount, cardNumber: digits })
      }
      setCardNumber("")
      setWithdrawAmount("")
      setWithdrawOpen(false)
      setNotice("درخواست برداشت ثبت شد و مبلغ از موجودی کسر شد.")
      if (!preview) await refresh(teamId)
    })
  }

  function applyPreviewCharge(amountRial: number) {
    const teamId = selected?.teamId ?? 1
    const nextWallet = selected
      ? {
          ...selected,
          availableBalance: selected.availableBalance + amountRial,
        }
      : previewWallet([], "Personal wallet", teamId, amountRial)

    setWallets((current) =>
      current.length === 0
        ? [nextWallet]
        : current.map((wallet) =>
            wallet.teamId === teamId ? nextWallet : wallet
          )
    )
    setSelectedTeamId(teamId)
    setTransactions((current) => [
      previewCredit(current, amountRial),
      ...current,
    ])
  }

  function applyPreviewRefund(teamId: number, amount: number, digits: string) {
    const transactionId = nextId(transactions.map((row) => row.id))
    const balance = Math.max(0, (selected?.availableBalance ?? 0) - amount)
    setWallets((current) =>
      current.map((wallet) =>
        wallet.teamId === teamId
          ? { ...wallet, availableBalance: balance }
          : wallet
      )
    )
    setTransactions((current) => [
      {
        id: transactionId,
        type: "Refund",
        amount: -amount,
        availableBalanceAfter: balance,
        restrictedBalanceAfter: selected?.restrictedBalance ?? 0,
        gatewayAttemptId: null,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    setRefunds((current) => [
      {
        id: nextId(current.map((row) => row.id)),
        teamId,
        transactionId,
        amount,
        status: "pending",
        cardNumber: `${digits.slice(0, 6)}******${digits.slice(-4)}`,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
      <Card className="lg:col-start-1 lg:row-start-1">
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-base font-medium">موجودی کیف پول</h1>
          </div>
          {wallets.length > 1 ? (
            <FormField id="wallet" label="کیف پول">
              <Select
                value={selected ? String(selected.teamId) : null}
                onValueChange={(value) => {
                  if (value) {
                    setPage(1)
                    setHasNextPage(false)
                    setDetailsFailed(false)
                    setSelectedTeamId(Number(value))
                    setFetchedTeamId(0)
                    setTransactions([])
                    setRefunds([])
                    setNotice("")
                    setActionError(null)
                  }
                }}
                items={walletItems}
              >
                <SelectTrigger id="wallet" className="h-11 w-full">
                  <SelectValue placeholder="کیف پول را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem
                      key={wallet.teamId}
                      value={String(wallet.teamId)}
                    >
                      {walletDisplayName(wallet.displayName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}

          {selected ? (
            <div className="flex flex-col gap-1">
              {selected.role !== "owner" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {walletRoleLabel(selected.role)}
                  </Badge>
                </div>
              ) : null}
              <p className="text-2xl font-medium">
                {formatToman(selected.availableBalance)}
              </p>
              {selected.restrictedBalance > 0 ? (
                <p className="text-sm text-muted-foreground">
                  موجودی محدود: {formatToman(selected.restrictedBalance)}
                </p>
              ) : null}
            </div>
          ) : null}

          {!canCharge ? (
            <p className="text-sm text-muted-foreground">
              فقط مالک می‌تواند شارژ، تاریخچه یا استرداد را ببیند.
            </p>
          ) : null}

          {actionError ? <ErrorNote error={actionError} /> : null}
          {notice ? (
            <p className="text-sm text-muted-foreground" role="status">
              {notice}
            </p>
          ) : null}
        </CardContent>
        {canCharge ? (
          <CardFooter className="gap-4">
            <Dialog
              open={chargeOpen}
              onOpenChange={(open) => {
                setChargeOpen(open)
                if (!open) {
                  setChargeError("")
                }
              }}
            >
              <DialogTrigger
                render={
                  <Button
                    className="h-11 min-w-0 flex-1"
                    disabled={pending !== "" || lockIn > 0}
                  />
                }
              >
                افزایش موجودی
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>افزایش موجودی</DialogTitle>
                </DialogHeader>
                <form className="flex flex-col gap-4" onSubmit={submitCharge}>
                  <TomanField
                    id="charge-amount"
                    label="مبلغ"
                    value={chargeAmount}
                    error={chargeError}
                    onChange={(value) => {
                      setChargeAmount(value)
                      setChargeError("")
                    }}
                  />
                  <DialogFooter>
                    <Button
                      type="submit"
                      className="h-11 w-full"
                      disabled={
                        pending !== "" ||
                        lockIn > 0 ||
                        tomanInputToRial(chargeAmount) < MIN_CHARGE_RIAL
                      }
                    >
                      {pending === "charge" ? (
                        <LoaderCircleIcon className="animate-spin" />
                      ) : null}
                      {pending === "charge" ? "در حال انتقال" : "پرداخت"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            {selected && selected.availableBalance > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 min-w-0 flex-1"
                disabled={pending !== "" || lockIn > 0}
                onClick={() => {
                  setActionError(null)
                  setWithdrawOpen(true)
                }}
              >
                برداشت وجه
              </Button>
            ) : null}
          </CardFooter>
        ) : null}
      </Card>

      {canManage ? (
        <HistorySection
          pagination={
            detailsFailed ? (
              <Button
                variant="outline"
                onClick={() => {
                  setFetchedTeamId(0)
                  setDetailsNonce((value) => value + 1)
                }}
              >
                تلاش دوباره
              </Button>
            ) : page > 1 || hasNextPage ? (
              <nav
                aria-label="صفحه‌بندی تراکنش‌ها"
                className="flex items-center justify-between gap-2"
              >
                <Button
                  variant="outline"
                  disabled={detailsLoading || page === 1}
                  onClick={() => {
                    setFetchedTeamId(0)
                    setPage(page - 1)
                  }}
                >
                  صفحه قبل
                </Button>
                <span>صفحه {toPersianDigits(String(page))}</span>
                <Button
                  variant="outline"
                  disabled={detailsLoading || !hasNextPage}
                  onClick={() => {
                    setFetchedTeamId(0)
                    setPage(page + 1)
                  }}
                >
                  صفحه بعد
                </Button>
              </nav>
            ) : null
          }
          detailsLoading={detailsLoading}
          transactions={transactions}
          refunds={refunds}
        />
      ) : null}

      <Dialog
        open={withdrawOpen}
        onOpenChange={(open) => {
          if (pending === "refund") return
          setWithdrawOpen(open)
          if (!open) {
            setCardError("")
            setWithdrawError("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>برداشت وجه</DialogTitle>
            <DialogDescription>
              مبلغ درخواست نهایتا تا ۷۲ ساعت واریز خواهد شد.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={submitRefund}>
            <TomanField
              id="withdraw-amount"
              label="مبلغ"
              value={withdrawAmount}
              error={withdrawError}
              maxToman={999_999_999_999}
              onChange={(value) => {
                setWithdrawAmount(value)
                setWithdrawError("")
              }}
            />
            <CardNumberField
              value={cardNumber}
              error={cardError}
              onChange={(value) => {
                setCardNumber(value)
                setCardError("")
              }}
            />
            {actionError ? <ErrorNote error={actionError} /> : null}
            <DialogFooter>
              <Button
                type="submit"
                className="h-11 w-full"
                disabled={
                  pending !== "" ||
                  tomanInputToRial(withdrawAmount) <= 0 ||
                  cardDigits(cardNumber).length !== CARD_LENGTH
                }
              >
                {pending === "refund" ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : null}
                {pending === "refund" ? "در حال ثبت" : "ثبت درخواست"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HistorySection({
  pagination,
  detailsLoading,
  transactions,
  refunds,
}: {
  pagination: React.ReactNode
  detailsLoading: boolean
  transactions: LedgerTransaction[]
  refunds: CardRefund[]
}) {
  return (
    <>
      {
        <section className="flex min-w-0 flex-col gap-2 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Card>
            <CardContent className="flex flex-col gap-2">
              <h2 className="text-base font-medium">تراکنش‌ها</h2>
              {detailsLoading ? (
                <Skeleton className="h-24" />
              ) : transactions.length ? (
                <ul className="flex flex-col">
                  {transactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  تراکنشی در این صفحه وجود ندارد.
                </p>
              )}
              {pagination}
            </CardContent>
          </Card>
        </section>
      }
      {
        <section className="flex min-w-0 flex-col gap-2 lg:col-start-1 lg:row-start-2">
          <Card>
            <CardContent className="flex flex-col gap-2">
              <h2 className="text-base font-medium">درخواست‌های برداشت وجه</h2>
              {detailsLoading ? (
                <Skeleton className="h-16" />
              ) : refunds.length ? (
                <ul className="flex flex-col">
                  {refunds.map((refund) => (
                    <RefundRow key={refund.id} refund={refund} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  هنوز درخواست برداشت وجهی ثبت نشده است.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      }
    </>
  )
}

function TransactionRow({ transaction }: { transaction: LedgerTransaction }) {
  return (
    <li className="flex flex-col gap-2 border-b py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Badge variant={transaction.amount >= 0 ? "secondary" : "outline"}>
            {transactionLabel(transaction.type)}
          </Badge>
          <time
            dateTime={transaction.createdAt}
            className="text-xs text-muted-foreground"
          >
            {formatTehranDateTime(transaction.createdAt)}
          </time>
        </div>
        <TransactionAmount amountRial={transaction.amount} />
      </div>
    </li>
  )
}

function RefundRow({ refund }: { refund: CardRefund }) {
  const masked = refund.cardNumber.includes("*")
  const bank = resolveBankByCard(
    masked ? refund.cardNumber.slice(0, 6) : refund.cardNumber
  )
  return (
    <li className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm">{formatToman(refund.amount)}</span>
        <Badge
          variant="outline"
          className={
            refund.status === "pending"
              ? "border-amber-500/40 bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300"
              : undefined
          }
        >
          {refundStatusLabel(refund.status)}
        </Badge>
      </div>
      <div className="flex min-w-0 flex-col items-end gap-1">
        <div className="flex items-center gap-2" dir="ltr">
          {bank ? (
            <Image
              src={bankLogoSrc(bank.logoFile)}
              alt={bank.nameFa}
              width={24}
              height={24}
              className="size-6 object-contain"
            />
          ) : null}
          <span className="font-mono text-xs text-muted-foreground">
            {refund.cardNumber}
          </span>
        </div>
        <time
          dateTime={refund.createdAt}
          className="text-xs text-muted-foreground"
        >
          {formatTehranDateTime(refund.createdAt)}
        </time>
      </div>
    </li>
  )
}

function TomanField({
  id,
  label,
  value,
  error,
  maxToman = MAX_CHARGE_TOMAN,
  onChange,
}: {
  id: string
  label: string
  value: string
  error: string
  maxToman?: number
  onChange: (value: string) => void
}) {
  const words = formatTomanWords(value)
  const describedBy = [error ? `${id}-error` : "", `${id}-hint`, `${id}-suffix`]
    .filter(Boolean)
    .join(" ")
  const placeholder = "مثال: ۹۸.۰۰۰"

  function onAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const caret = input.selectionStart ?? input.value.length
    const digitsBeforeCaret = toAsciiDigits(
      input.value.slice(0, caret)
    ).replace(/\D/g, "").length
    const raw = formatTomanInput(input.value)
    const next = limitTomanInput(input.value, maxToman)
    onChange(next)
    const nextCaret =
      next === raw ? tomanCaretIndex(next, digitsBeforeCaret) : next.length
    window.requestAnimationFrame(() => {
      input.setSelectionRange(nextCaret, nextCaret)
    })
  }

  return (
    <FormField id={id} label={label} error={error}>
      <div className="flex flex-col gap-2">
        <div className="relative" dir="ltr">
          <Input
            id={id}
            name={id}
            className={`${fieldClassName} ps-16 text-end text-xl font-bold placeholder:text-transparent md:text-xl`}
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            value={value}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            onChange={onAmountChange}
          />
          {value ? null : (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5"
            >
              <span
                dir="rtl"
                className="text-base font-normal text-muted-foreground"
              >
                {placeholder}
              </span>
            </span>
          )}
          <span
            id={`${id}-suffix`}
            className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 text-sm text-muted-foreground"
          >
            تومان
          </span>
        </div>
        <div
          id={`${id}-hint`}
          className="flex min-h-5 items-center text-sm leading-5 text-muted-foreground"
        >
          {words ? words : <Skeleton aria-hidden className="h-3 w-36" />}
        </div>
      </div>
    </FormField>
  )
}

function ErrorNote({ error }: { error: WalletApiError }) {
  return (
    <div className="flex flex-col gap-1" role="alert">
      <p className="text-sm text-destructive">{error.message}</p>
      {error.traceId ? (
        <p className="font-mono text-xs text-muted-foreground" dir="ltr">
          {error.traceId}
        </p>
      ) : null}
    </div>
  )
}

function previewWallet(
  wallets: Wallet[],
  displayName: string,
  teamId = nextId(wallets.map((wallet) => wallet.teamId)),
  availableBalance = 0
): Wallet {
  return {
    teamId,
    displayName: displayName || "Wallet",
    role: "owner",
    availableBalance,
    restrictedBalance: 0,
  }
}

function previewCredit(
  transactions: LedgerTransaction[],
  amountRial: number
): LedgerTransaction {
  return {
    id: nextId(transactions.map((row) => row.id)),
    type: "GatewayCredit",
    amount: amountRial,
    availableBalanceAfter: amountRial,
    restrictedBalanceAfter: 0,
    gatewayAttemptId: nextId(
      transactions.flatMap((row) =>
        row.gatewayAttemptId ? [row.gatewayAttemptId] : []
      )
    ),
    createdAt: new Date().toISOString(),
  }
}

function nextId(values: number[]) {
  return (values.length ? Math.max(...values) : 0) + 1
}

function toWalletError(reason: unknown) {
  if (isWalletApiError(reason)) {
    return reason
  }

  return new WalletApiError({
    code: "UNKNOWN",
    message: "درخواست انجام نشد. دوباره تلاش کنید.",
  })
}

/** Warns before refresh or close while a wallet request is in flight. Set allowRef to skip the intended gateway redirect. */
function useBlockUnload(active: boolean, allowRef: { current: boolean }) {
  useEffect(() => {
    if (!active) {
      return
    }

    function blockUnload(event: BeforeUnloadEvent) {
      if (allowRef.current) {
        return
      }
      event.preventDefault()
    }

    window.addEventListener("beforeunload", blockUnload)
    return () => window.removeEventListener("beforeunload", blockUnload)
  }, [active, allowRef])
}

/** Counts a remaining-seconds value down to zero. */
function useCountdown(
  remaining: number,
  setRemaining: (updater: (current: number) => number) => void
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
