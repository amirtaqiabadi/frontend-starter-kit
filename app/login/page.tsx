import type { Metadata } from "next"
import Link from "next/link"

import { LoginForm } from "@/features/login/login-form"

export const metadata: Metadata = {
  title: "ورود",
  description:
    "با شماره موبایل وارد شوید. اگر رمز ثبت کرده باشید همان را می‌پرسیم؛ وگرنه کد یک‌بارمصرف می‌فرستیم.",
  openGraph: {
    title: "ورود",
    description:
      "با شماره موبایل وارد شوید. اگر رمز ثبت کرده باشید همان را می‌پرسیم؛ وگرنه کد یک‌بارمصرف می‌فرستیم.",
    locale: "fa_IR",
  },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const { next } = await searchParams

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <Link href="/" className="text-sm text-muted-foreground">
          خانه
        </Link>
        <h1 className="text-2xl font-medium">ورود</h1>
        <p className="text-sm text-muted-foreground">
          شماره موبایل خود را وارد کنید. اگر رمز داشته باشید همان را می‌پرسیم؛
          وگرنه کد پیامکی می‌فرستیم.
        </p>
      </div>
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </main>
  )
}
