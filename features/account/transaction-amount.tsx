import { cn } from "cn"

import { formatToman } from "@/lib/money"

type TransactionAmountProps = {
  amountRial: number
}

/** Shows a signed Toman amount: green for credits, red for debits. */
export function TransactionAmount({ amountRial }: TransactionAmountProps) {
  const positive = amountRial >= 0

  return (
    <span
      className={cn(
        "shrink-0 text-sm",
        positive ? "text-success" : "text-destructive"
      )}
    >
      {positive
        ? formatToman(amountRial)
        : `−${formatToman(Math.abs(amountRial))}`}
    </span>
  )
}
