import type { Metadata } from "next"

import { AppShell } from "@/components/templates/app-shell"
import { WalletPageHeader } from "@/features/account/wallet-page-header"
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
      <WalletPageHeader />
      <WalletScreen />
    </AppShell>
  )
}
