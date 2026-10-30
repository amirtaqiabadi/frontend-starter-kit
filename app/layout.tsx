import type { Metadata } from "next"

import { ThemeProvider } from "@/components/theme-provider"
import { DirectionProvider } from "@/components/ui/direction"
import { TooltipProvider } from "@/components/ui/tooltip"
import { fontMono, fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"

import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "پایه فرانت‌اند",
    template: "%s | پایه فرانت‌اند",
  },
  description: "شروع پروژه با shadcn، راست‌به‌چپ و Storybook",
  openGraph: {
    locale: "fa_IR",
    type: "website",
    siteName: "پایه فرانت‌اند",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        fontMono.variable,
        "font-sans"
      )}
    >
      <body>
        <DirectionProvider direction="rtl">
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </DirectionProvider>
      </body>
    </html>
  )
}
