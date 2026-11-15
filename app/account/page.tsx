import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AppShell } from "@/components/templates/app-shell"
import { AccountPanel } from "@/features/account/account-panel"
import { loginPath } from "@/features/login/redirect-path"

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

/** Account home. A missing session cookie goes to login and returns here. */
export default async function AccountPage() {
  const jar = await cookies()
  if (!jar.has("session")) {
    redirect(loginPath("/account"))
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-medium">حساب کاربری</h1>
      <AccountPanel />
    </AppShell>
  )
}
