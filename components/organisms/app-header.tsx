"use client"

import Link from "next/link"
import { ArrowRightIcon, MenuIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { DirectionalIcon } from "@/components/atoms/directional-icon"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const links = [
  { href: "#components", label: "اجزا" },
  { href: "#form", label: "فرم" },
  { href: "#overlays", label: "لایه‌ها" },
  { href: "/login", label: "ورود" },
  { href: "/account", label: "حساب کاربری" },
]

/** Renders an in-page anchor or a crawlable route link. */
function HeaderLink({ href, label }: { href: string; label: string }) {
  const className = "hover:text-foreground"

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    )
  }

  return (
    <a href={href} className={className}>
      {label}
    </a>
  )
}

/** App navigation with a menu, theme toggle, and directional action. */
export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <Link href="/" className="text-base font-medium">
          پایه فرانت‌اند
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {links.map((link) => (
            <HeaderLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:ms-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="icon" aria-label="منو" />}
            >
              <MenuIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {links.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  render={
                    link.href.startsWith("/") ? (
                      <Link href={link.href} />
                    ) : (
                      <a href={link.href} />
                    )
                  }
                >
                  {link.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="icon"
            aria-label="تغییر تم"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            <SunIcon className="hidden dark:block" />
            <MoonIcon className="dark:hidden" />
          </Button>
          <Button>
            ادامه
            <DirectionalIcon icon={ArrowRightIcon} />
          </Button>
        </div>
      </div>
    </header>
  )
}
