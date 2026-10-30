import type { Metadata } from "next"

import { AppShell } from "@/components/templates/app-shell"
import { AccountPanel } from "@/features/account/account-panel"

export const metadata: Metadata = {
  title: "حساب کاربری",
  description:
    "نام و تصویر حساب را ویرایش کنید. موجودی کیف پول، تراکنش‌ها، افزایش موجودی و درخواست برداشت اینجاست.",
  openGraph: {
    title: "حساب کاربری",
    description:
      "نام و تصویر حساب را ویرایش کنید. موجودی کیف پول، تراکنش‌ها، افزایش موجودی و درخواست برداشت اینجاست.",
    locale: "fa_IR",
  },
}

export default function AccountPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">حساب کاربری</h1>
        <p className="text-sm text-muted-foreground">
          نام و تصویر را اضافه یا ویرایش کنید و کیف پول را مدیریت کنید.
        </p>
      </div>
      <AccountPanel />
    </AppShell>
  )
}
