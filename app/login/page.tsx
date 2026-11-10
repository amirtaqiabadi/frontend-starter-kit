import type { Metadata } from "next"

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
  searchParams: Promise<{
    next?: string | string[]
    token?: string | string[]
  }>
}) {
  const { next, token } = await searchParams

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-4 py-8">
      <LoginForm next={firstQuery(next)} inviteToken={firstQuery(token)} />
    </main>
  )
}

function firstQuery(value?: string | string[]) {
  if (typeof value === "string") {
    return value
  }

  return Array.isArray(value) ? value[0] : undefined
}
