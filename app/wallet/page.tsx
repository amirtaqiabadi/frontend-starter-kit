import type { Metadata } from "next"
import Link from "next/link"

import { AppShell } from "@/components/templates/app-shell"
import { WalletScreen } from "@/features/account/wallet-screen"

export const metadata: Metadata = {
  title: "کیف پول",
  description: "موجودی کیف پول، شارژ درگاه، تاریخچه، بازگشت و استرداد به کارت.",
  openGraph: {
    title: "کیف پول",
    description:
      "موجودی کیف پول، شارژ درگاه، تاریخچه، بازگشت و استرداد به کارت.",
    locale: "fa_IR",
  },
}

export default function WalletPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <Link href="/account" className="text-sm text-muted-foreground">
          حساب کاربری
        </Link>
        <h1 className="text-2xl font-medium">کیف پول</h1>
        <p className="text-sm text-muted-foreground">
          موجودی، شارژ درگاه، تاریخچه، بازگشت و استرداد به کارت.
        </p>
      </div>
      <WalletScreen />
    </AppShell>
  )
}
