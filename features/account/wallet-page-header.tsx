import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { DirectionalIcon } from "@/components/atoms/directional-icon"

/** Back link and title shown above the wallet tools. */
export function WalletPageHeader() {
  return (
    <div className="flex flex-col gap-2">
      <Link
        href="/account"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground"
      >
        <DirectionalIcon icon={ArrowLeftIcon} className="size-4" />
        برگشت به حساب کاربری
      </Link>
      <h1 className="text-2xl font-medium">کیف پول</h1>
      <p className="text-sm text-muted-foreground">
        موجودی، لیست تراکنش‌ها و درخواست برداشت وجه
      </p>
    </div>
  )
}
