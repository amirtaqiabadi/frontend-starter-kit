import type { Metadata } from "next"

import { AppShell } from "@/components/templates/app-shell"
import { AccountPanel } from "@/features/account/account-panel"

export const metadata: Metadata = {
  title: "حساب کاربری",
  description: "نام و تصویر حساب، کیف پول، دعوت دوستان و خروج از حساب کاربری.",
  openGraph: {
    title: "حساب کاربری",
    description:
      "نام و تصویر حساب، کیف پول، دعوت دوستان و خروج از حساب کاربری.",
    locale: "fa_IR",
  },
}

export default function AccountPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-medium">حساب کاربری</h1>
      <AccountPanel />
    </AppShell>
  )
}
