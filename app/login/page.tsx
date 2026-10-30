import type { Metadata } from "next"
import Link from "next/link"

import { LoginForm } from "@/features/login/login-form"

export const metadata: Metadata = {
  title: "ورود",
  description:
    "با شماره موبایل وارد شوید. پس از ثبت شماره، کد یک‌بارمصرف از شما خواسته می‌شود.",
  openGraph: {
    title: "ورود",
    description:
      "با شماره موبایل وارد شوید. پس از ثبت شماره، کد یک‌بارمصرف از شما خواسته می‌شود.",
    locale: "fa_IR",
  },
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <Link href="/" className="text-sm text-muted-foreground">
          خانه
        </Link>
        <h1 className="text-2xl font-medium">ورود</h1>
        <p className="text-sm text-muted-foreground">
          شماره موبایل خود را وارد کنید. در گام بعد کد یک‌بارمصرف را می‌پرسیم.
        </p>
      </div>
      <LoginForm />
    </main>
  )
}
