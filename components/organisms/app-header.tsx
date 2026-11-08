"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useWalletSession } from "@/features/account/wallet-session"

type AppHeaderProps = {
  signedIn?: boolean
}

/** Brand on the start side, and login or account on the end side. */
export function AppHeader({ signedIn }: AppHeaderProps) {
  if (signedIn === undefined) {
    return <LiveHeader />
  }

  return <HeaderBar signedIn={signedIn} />
}

function LiveHeader() {
  const session = useWalletSession()

  if (session.status === "loading") {
    return <HeaderBar pending />
  }

  return <HeaderBar signedIn={session.status !== "signed-out"} />
}

function HeaderBar({
  signedIn = false,
  pending = false,
}: {
  signedIn?: boolean
  pending?: boolean
}) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-2 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <SiteLogo />
          <span className="truncate text-base font-medium">نام وبسایت</span>
        </Link>
        <div className="ms-auto">
          {pending ? (
            <Skeleton className="h-11 w-28" />
          ) : (
            <Button
              nativeButton={false}
              render={<Link href={signedIn ? "/account" : "/login"} />}
              className="h-11"
            >
              {signedIn ? "حساب کاربری" : "ورود"}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

/** Square mark shown beside the site name. */
function SiteLogo() {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className="size-8 shrink-0">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M9 21.5 16 9l7 12.5h-3.4L16 14.4l-3.6 7.1H9Z"
        className="fill-primary-foreground"
      />
    </svg>
  )
}
