import type { Metadata } from "next"

import { AppShell } from "@/components/templates/app-shell"
import { PaymentFailurePanel } from "@/features/account/payment-result"

export const metadata: Metadata = {
  title: "پرداخت ناموفق",
  description: "شارژ کیف پول در درگاه کامل نشد.",
  openGraph: {
    title: "پرداخت ناموفق",
    description: "شارژ کیف پول در درگاه کامل نشد.",
    locale: "fa_IR",
  },
}

export default async function PaymentFailurePage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string | string[]
    traceId?: string | string[]
  }>
}) {
  const { code, traceId } = await searchParams

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">پرداخت ناموفق</h1>
        <p className="text-sm text-muted-foreground">
          مبلغی به کیف پول اضافه نشد. اگر از حساب‌تان کم شده با پشتیبانی تماس
          بگیرید.
        </p>
      </div>
      <PaymentFailurePanel
        code={firstQuery(code)}
        traceId={firstQuery(traceId)}
      />
    </AppShell>
  )
}

function firstQuery(value?: string | string[]) {
  return typeof value === "string"
    ? value
    : Array.isArray(value)
      ? value[0]
      : ""
}
