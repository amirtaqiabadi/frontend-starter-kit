import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { DirectionalIcon } from "@/components/atoms/directional-icon"
import { buttonVariants } from "@/components/ui/button"
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
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className={buttonVariants({
            variant: "ghost",
            className: "h-11 w-fit",
          })}
        >
          <DirectionalIcon icon={ArrowLeftIcon} />
          برگشت
        </Link>
        <h1 className="text-2xl font-medium">ورود</h1>
      </div>
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
