import type { Metadata } from "next"

import { AppShell } from "@/components/templates/app-shell"
import { PaymentSuccessPanel } from "@/features/account/payment-result"

export const metadata: Metadata = {
  title: "پرداخت موفق",
  description: "شارژ کیف پول با موفقیت در درگاه تأیید شد.",
  openGraph: {
    title: "پرداخت موفق",
    description: "شارژ کیف پول با موفقیت در درگاه تأیید شد.",
    locale: "fa_IR",
  },
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    attemptId?: string | string[]
    traceId?: string | string[]
  }>
}) {
  const { attemptId, traceId } = await searchParams

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">پرداخت موفق</h1>
        <p className="text-sm text-muted-foreground">
          شارژ کیف پول ثبت شد. موجودی به‌روز را این‌جا ببینید.
        </p>
      </div>
      <PaymentSuccessPanel
        attemptId={firstQuery(attemptId)}
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
