import type { ReactNode } from "react"

import { AppHeader } from "@/components/organisms/app-header"

type AppShellProps = {
  children: ReactNode
}

/** Page frame with navigation and a centered content column. */
export function AppShell({ children }: AppShellProps) {
  return (
    <div id="top" className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
