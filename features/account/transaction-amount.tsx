import { cn } from "cn"

import { formatToman } from "@/lib/money"
import type { TransactionKind } from "@/features/account/account-store"

type TransactionAmountProps = {
  amountRial: number
  kind: TransactionKind
}

/** Shows a Toman amount in green when money comes in and red when it goes out. */
export function TransactionAmount({
  amountRial,
  kind,
}: TransactionAmountProps) {
  const positive = kind === "deposit"

  return (
    <span
      className={cn(
        "shrink-0 text-sm",
        positive ? "text-success" : "text-destructive"
      )}
    >
      {formatToman(amountRial)}
    </span>
  )
}
