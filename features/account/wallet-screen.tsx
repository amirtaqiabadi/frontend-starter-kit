"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { WalletPanel } from "@/features/account/wallet-panel"
import { useWalletSession } from "@/features/account/wallet-session"
import type {
  CardRefund,
  LedgerTransaction,
  Wallet,
} from "@/features/account/wallet-model"
import { loginPath } from "@/features/login/redirect-path"

export type WalletPreview = {
  wallets: Wallet[]
  transactions?: LedgerTransaction[]
  refunds?: CardRefund[]
}

type WalletScreenProps = {
  preview?: WalletPreview | "guest" | "error"
}

/** Wallet tools only. Account profile stays on the account page. */
export function WalletScreen({ preview }: WalletScreenProps) {
  if (preview === "guest") {
    return <WalletGuest />
  }

  if (preview === "error") {
    return (
      <WalletError message="ارتباط با سرور برقرار نشد. دوباره تلاش کنید." />
    )
  }

  if (preview) {
    return (
      <WalletPanel
        initialWallets={preview.wallets}
        initialTransactions={preview.transactions}
        initialRefunds={preview.refunds}
        preview
      />
    )
  }

  return <LiveWallet />
}

function LiveWallet() {
  const session = useWalletSession()

  if (session.status === "loading") {
    return <Skeleton className="h-80" />
  }

  if (session.status === "signed-out") {
    return <WalletGuest />
  }

  if (session.status === "error") {
    return <WalletError message={session.message} onRetry={session.retry} />
  }

  return <WalletPanel initialWallets={session.wallets} />
}

function WalletGuest() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>وارد نشده‌اید</CardTitle>
        <CardDescription>
          برای دیدن کیف پول با شماره موبایل وارد شوید.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          nativeButton={false}
          render={<Link href={loginPath("/wallet")} />}
          className="h-11"
        >
          ورود
        </Button>
      </CardFooter>
    </Card>
  )
}

function WalletError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>کیف پول بارگذاری نشد</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      {onRetry ? (
        <CardFooter>
          <Button className="h-11" onClick={onRetry}>
            تلاش دوباره
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
