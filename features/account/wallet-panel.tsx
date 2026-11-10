"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { FormField } from "@/components/molecules/form-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  canRequestRefund,
  CHARGE_DESCRIPTION,
  isWalletOwner,
  MIN_CHARGE_RIAL,
  MAX_CHARGE_TOMAN,
  refundForTransaction,
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

type PendingAction = "" | "charge" | "refund" | "withdraw"

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
  const [detailsNonce, setDetailsNonce] = useState(0)
  const [chargeOpen, setChargeOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [chargeAmount, setChargeAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawCard, setWithdrawCard] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [chargeError, setChargeError] = useState("")
  const [withdrawError, setWithdrawError] = useState("")
  const [withdrawCardError, setWithdrawCardError] = useState("")
  const [cardError, setCardError] = useState("")
  const [actionError, setActionError] = useState<WalletApiError | null>(null)
  const [notice, setNotice] = useState("")
  const [pending, setPending] = useState<PendingAction>("")
  const [lockIn, setLockIn] = useState(0)
  const [refundTarget, setRefundTarget] = useState<LedgerTransaction | null>(
    null
  )
  const walletLock = useRef(false)
  const allowUnload = useRef(false)
  useBlockUnload(pending !== "", allowUnload)
  useCountdown(lockIn, setLockIn)

  const selected =
    wallets.find((wallet) => wallet.teamId === selectedTeamId) ?? wallets[0]
  const canCharge = !selected || isWalletOwner(selected)
  const canManage = Boolean(selected && isWalletOwner(selected))
  const showWithdraw = Boolean(
    selected &&
    isWalletOwner(selected) &&
    Math.trunc(selected.availableBalance / 10) > 0
  )
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

    Promise.all([listTransactions(teamId), listRefunds(teamId)])
      .then(([nextTransactions, nextRefunds]) => {
        if (cancelled) {
          return
        }
        setTransactions(nextTransactions)
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
        setActionError(toWalletError(reason))
      })

    return () => {
      cancelled = true
    }
  }, [preview, canManage, selectedTeamId, detailsNonce, router])

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
    if (!refundTarget) {
      return
    }
    if (cardDigits(cardNumber).length !== CARD_LENGTH) {
      setCardError("شماره کارت را ۱۶ رقم وارد کنید.")
      return
    }

    const transaction = refundTarget
    void runAction("refund", async () => {
      if (preview) {
        applyPreviewRefund(transaction, cardNumber)
      } else {
        await requestRefund({
          transactionId: transaction.id,
          cardNumber,
        })
        await refresh()
      }
      setCardNumber("")
      setRefundTarget(null)
      setNotice("درخواست استرداد ثبت شد. موجودی الان تغییر نمی‌کند.")
    })
  }

  function submitWithdraw(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amountRial = tomanInputToRial(withdrawAmount)
    if (!amountRial) {
      setWithdrawError("مبلغ را به تومان وارد کنید.")
      return
    }
    if (!selected || amountRial > selected.availableBalance) {
      setWithdrawError("مبلغ برداشت از موجودی بیشتر است.")
      return
    }
    if (cardDigits(withdrawCard).length !== CARD_LENGTH) {
      setWithdrawCardError("شماره کارت را ۱۶ رقم وارد کنید.")
      return
    }

    const transaction = transactions.find(
      (row) =>
        row.amount === amountRial &&
        canRequestRefund({ transaction: row, transactions, refunds })
    )
    if (!transaction) {
      setWithdrawError("برای این مبلغ تراکنش قابل برداشتی نیست.")
      return
    }

    void runAction("withdraw", async () => {
      if (preview) {
        applyPreviewRefund(transaction, withdrawCard)
      } else {
        await requestRefund({
          transactionId: transaction.id,
          cardNumber: withdrawCard,
        })
        await refresh()
      }
      setWithdrawAmount("")
      setWithdrawCard("")
      setWithdrawOpen(false)
      setNotice("درخواست برداشت ثبت شد.")
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

  function applyPreviewRefund(transaction: LedgerTransaction, pan: string) {
    const digits = cardDigits(pan)
    setRefunds((current) => [
      {
        id: nextId(current.map((row) => row.id)),
        teamId: selectedTeamId,
        transactionId: transaction.id,
        amount: Math.abs(transaction.amount),
        status: "pending",
        cardNumber: `${digits.slice(0, 6)}******${digits.slice(-4)}`,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        {wallets.length > 1 ? (
          <FormField id="wallet" label="کیف پول">
            <Select
              value={selected ? String(selected.teamId) : null}
              onValueChange={(value) => {
                if (value) {
                  setSelectedTeamId(Number(value))
                  setFetchedTeamId(0)
                  setTransactions([])
                  setRefunds([])
                  setNotice("")
                  setActionError(null)
                  setWithdrawAmount("")
                  setWithdrawCard("")
                  setWithdrawError("")
                  setWithdrawCardError("")
                }
              }}
              items={walletItems}
            >
              <SelectTrigger id="wallet" className="h-11 w-full">
                <SelectValue placeholder="کیف پول را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.teamId} value={String(wallet.teamId)}>
                    {walletDisplayName(wallet.displayName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ) : null}

        {selected ? (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">موجودی</p>
              {selected.role !== "owner" ? (
                <Badge variant="outline">
                  {walletRoleLabel(selected.role)}
                </Badge>
              ) : null}
            </div>
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

        {canCharge ? (
          <div className="flex flex-col gap-4 sm:flex-row">
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
                    className="h-11 w-full sm:w-auto"
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
            {showWithdraw ? (
              <Dialog
                open={withdrawOpen}
                onOpenChange={(open) => {
                  setWithdrawOpen(open)
                  if (!open) {
                    setWithdrawError("")
                    setWithdrawCardError("")
                  }
                }}
              >
                <DialogTrigger
                  render={
                    <Button
                      variant="outline"
                      className="h-11 w-full sm:w-auto"
                      disabled={pending !== "" || lockIn > 0 || detailsLoading}
                    />
                  }
                >
                  برداشت وجه
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>برداشت وجه</DialogTitle>
                    <DialogDescription>
                      مبلغ و شماره کارت مقصد را وارد کنید.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    className="flex flex-col gap-4"
                    onSubmit={submitWithdraw}
                  >
                    <TomanField
                      id="withdraw-amount"
                      label="مبلغ"
                      value={withdrawAmount}
                      error={withdrawError}
                      maxToman={Math.trunc(
                        (selected?.availableBalance ?? 0) / 10
                      )}
                      onChange={(value) => {
                        setWithdrawAmount(value)
                        setWithdrawError("")
                      }}
                    />
                    <CardNumberField
                      id="withdraw-card"
                      value={withdrawCard}
                      error={withdrawCardError}
                      onChange={(value) => {
                        setWithdrawCard(value)
                        setWithdrawCardError("")
                      }}
                    />
                    <DialogFooter>
                      <Button
                        type="submit"
                        className="h-11 w-full"
                        disabled={
                          pending !== "" ||
                          lockIn > 0 ||
                          tomanInputToRial(withdrawAmount) <= 0 ||
                          cardDigits(withdrawCard).length !== CARD_LENGTH
                        }
                      >
                        {pending === "withdraw" ? (
                          <LoaderCircleIcon className="animate-spin" />
                        ) : null}
                        {pending === "withdraw" ? "در حال ثبت" : "برداشت وجه"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            فقط مالک می‌تواند شارژ، تاریخچه یا استرداد را ببیند.
          </p>
        )}

        {actionError ? <ErrorNote error={actionError} /> : null}
        {notice ? (
          <p className="text-sm text-muted-foreground" role="status">
            {notice}
          </p>
        ) : null}

        {canManage ? (
          <HistorySection
            detailsLoading={detailsLoading}
            pending={pending !== ""}
            transactions={transactions}
            refunds={refunds}
            onRefund={setRefundTarget}
          />
        ) : null}
      </CardContent>

      <Dialog
        open={Boolean(refundTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRefundTarget(null)
            setCardError("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استرداد به کارت</DialogTitle>
            <DialogDescription>
              شماره کارت مقصد را وارد کنید. موجودی الان کم نمی‌شود.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={submitRefund}>
            <CardNumberField
              value={cardNumber}
              error={cardError}
              onChange={(value) => {
                setCardNumber(value)
                setCardError("")
              }}
            />
            <DialogFooter>
              <Button
                type="submit"
                className="h-11 w-full"
                disabled={pending !== ""}
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
    </Card>
  )
}

function HistorySection({
  detailsLoading,
  pending,
  transactions,
  refunds,
  onRefund,
}: {
  detailsLoading: boolean
  pending: boolean
  transactions: LedgerTransaction[]
  refunds: CardRefund[]
  onRefund: (transaction: LedgerTransaction) => void
}) {
  return (
    <>
      {detailsLoading || transactions.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium">تراکنش‌ها</h2>
          {detailsLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <ul className="flex flex-col">
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  transactions={transactions}
                  refunds={refunds}
                  pending={pending}
                  onRefund={onRefund}
                />
              ))}
            </ul>
          )}
        </section>
      ) : null}
      {detailsLoading || refunds.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium">درخواست‌های استرداد</h2>
          {detailsLoading ? (
            <Skeleton className="h-16" />
          ) : (
            <ul className="flex flex-col">
              {refunds.map((refund) => (
                <RefundRow key={refund.id} refund={refund} />
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  )
}

function TransactionRow({
  transaction,
  transactions,
  refunds,
  pending,
  onRefund,
}: {
  transaction: LedgerTransaction
  transactions: LedgerTransaction[]
  refunds: CardRefund[]
  pending: boolean
  onRefund: (transaction: LedgerTransaction) => void
}) {
  const showRefund = canRequestRefund({
    transaction,
    transactions,
    refunds,
  })
  const refund = refundForTransaction(transaction.id, refunds)

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
      {showRefund || refund ? (
        <div className="flex flex-wrap items-center gap-2">
          {showRefund ? (
            <Button
              variant="outline"
              className="h-11"
              disabled={pending}
              onClick={() => onRefund(transaction)}
            >
              استرداد به کارت
            </Button>
          ) : null}
          {refund ? (
            <p className="text-xs text-muted-foreground">
              استرداد: {refundStatusLabel(refund.status)}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

function RefundRow({ refund }: { refund: CardRefund }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-1">
        <Badge variant="outline">{refundStatusLabel(refund.status)}</Badge>
        <p className="font-mono text-xs text-muted-foreground" dir="ltr">
          {refund.cardNumber}
        </p>
        <time
          dateTime={refund.createdAt}
          className="text-xs text-muted-foreground"
        >
          {formatTehranDateTime(refund.createdAt)}
        </time>
      </div>
      <span className="shrink-0 text-sm">{formatToman(refund.amount)}</span>
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
