"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toPersianDigits } from "@/lib/digits"
import { formatToman } from "@/lib/money"
import {
  isUnauthorized,
  isWalletApiError,
  listWallets,
  recoverPayment,
  WalletApiError,
} from "@/features/account/wallet-api"
import {
  paymentFailureMessage,
  walletDisplayName,
  type Wallet,
} from "@/features/account/wallet-model"
import { loginPath } from "@/features/login/redirect-path"

/** Reloads wallets after a successful bank return and shows the new balances. */
export function PaymentSuccessPanel({
  attemptId,
  traceId,
  previewWallets,
}: {
  attemptId: string
  traceId: string
  previewWallets?: Wallet[]
}) {
  const [wallets, setWallets] = useState<Wallet[] | null>(
    previewWallets ?? null
  )
  const [error, setError] = useState<WalletApiError | null>(null)

  useEffect(() => {
    if (previewWallets) {
      return
    }

    let cancelled = false

    listWallets()
      .then((next) => {
        if (!cancelled) {
          setWallets(next)
        }
      })
      .catch((reason) => {
        if (cancelled) {
          return
        }
        if (isUnauthorized(reason)) {
          window.location.replace(loginPath(successPath(attemptId, traceId)))
          return
        }
        setError(
          isWalletApiError(reason)
            ? reason
            : new WalletApiError({
                code: "UNKNOWN",
                message: "بارگذاری کیف پول انجام نشد.",
              })
        )
      })

    return () => {
      cancelled = true
    }
  }, [attemptId, traceId, previewWallets])

  return (
    <Card>
      <CardHeader>
        <CardTitle>شارژ ثبت شد</CardTitle>
        <CardDescription>
          اگر موجودی هنوز به‌روز نشده، چند لحظه دیگر کیف پول را باز کنید.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {attemptId ? (
          <p className="text-sm text-muted-foreground">
            شماره پیگیری شارژ: {toPersianDigits(attemptId)}
          </p>
        ) : null}
        {traceId ? (
          <p className="font-mono text-xs text-muted-foreground" dir="ltr">
            {traceId}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error.message}
          </p>
        ) : null}
        {wallets ? <WalletBalances wallets={wallets} /> : null}
      </CardContent>
      <CardFooter>
        <Button
          nativeButton={false}
          render={<Link href="/account" />}
          className="h-11"
        >
          مشاهده کیف پول
        </Button>
      </CardFooter>
    </Card>
  )
}

/** Maps a bank-return failure code to copy and offers recover when the gateway was down. */
export function PaymentFailurePanel({
  code,
  traceId,
}: {
  code: string
  traceId: string
}) {
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [wallets, setWallets] = useState<Wallet[] | null>(null)
  const canRecover = code === "GATEWAY_UNAVAILABLE"

  async function recover() {
    if (pending) {
      return
    }

    setPending(true)
    setError("")
    setNotice("")

    try {
      await listWallets()
      const result = await recoverPayment()
      const next = await listWallets()
      setWallets(next)
      setNotice(
        result.recovered > 0
          ? `${toPersianDigits(String(result.recovered))} پرداخت بازیابی شد.`
          : "پرداخت تازه‌ای برای بازیابی پیدا نشد."
      )
    } catch (reason) {
      if (isUnauthorized(reason)) {
        window.location.replace(loginPath(failurePath(code, traceId)))
        return
      }
      setError(
        isWalletApiError(reason)
          ? reason.message
          : "بازیابی انجام نشد. دوباره تلاش کنید."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>پرداخت کامل نشد</CardTitle>
        <CardDescription>{paymentFailureMessage(code)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {traceId ? (
          <p className="font-mono text-xs text-muted-foreground" dir="ltr">
            {traceId}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="text-sm text-muted-foreground" role="status">
            {notice}
          </p>
        ) : null}
        {wallets ? <WalletBalances wallets={wallets} /> : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row">
        {canRecover ? (
          <Button
            className="h-11 w-full sm:w-auto"
            disabled={pending}
            onClick={recover}
          >
            {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
            {pending ? "در حال بازیابی" : "بازیابی پرداخت"}
          </Button>
        ) : null}
        <Button
          nativeButton={false}
          variant={canRecover ? "outline" : "default"}
          render={<Link href="/account" />}
          className="h-11 w-full sm:w-auto"
        >
          مشاهده کیف پول
        </Button>
      </CardFooter>
    </Card>
  )
}

function WalletBalances({ wallets }: { wallets: Wallet[] }) {
  if (wallets.length === 0) {
    return <p className="text-sm text-muted-foreground">کیف پولی پیدا نشد.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {wallets.map((wallet) => (
        <li
          key={wallet.teamId}
          className="flex items-center justify-between gap-3"
        >
          <span className="text-sm">
            {walletDisplayName(wallet.displayName)}
          </span>
          <span className="text-sm font-medium">
            {formatToman(wallet.availableBalance)}
          </span>
        </li>
      ))}
    </ul>
  )
}

function successPath(attemptId: string, traceId: string) {
  const params = new URLSearchParams()
  if (attemptId) {
    params.set("attemptId", attemptId)
  }
  if (traceId) {
    params.set("traceId", traceId)
  }
  const query = params.toString()
  return query ? `/wallet/payment/success?${query}` : "/wallet/payment/success"
}

function failurePath(code: string, traceId: string) {
  const params = new URLSearchParams()
  if (code) {
    params.set("code", code)
  }
  if (traceId) {
    params.set("traceId", traceId)
  }
  const query = params.toString()
  return query ? `/wallet/payment/failure?${query}` : "/wallet/payment/failure"
}
