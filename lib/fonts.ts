import { Geist_Mono, Vazirmatn } from "next/font/google"

/** Persian-capable sans used by the app and Storybook. */
export const fontSans = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
})

/** Mono face for mixed code and Latin samples. */
export const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})
