import { useLayoutEffect, type ReactNode } from "react"
import type { Preview } from "@storybook/nextjs-vite"

import { DirectionProvider } from "../components/ui/direction"
import { TooltipProvider } from "../components/ui/tooltip"
import { ThemeProvider } from "../components/theme-provider"
import { fontMono, fontSans } from "../lib/fonts"

import "../app/globals.css"

type Direction = "rtl" | "ltr"
type Theme = "light" | "dark"

type StoryFrameProps = {
  direction: Direction
  theme: Theme
  children: ReactNode
}

/** Applies the shared font, direction, and theme inside Storybook. */
function StoryFrame({ direction, theme, children }: StoryFrameProps) {
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dir = direction
    root.lang = direction === "rtl" ? "fa" : "en"
    root.classList.add(fontSans.variable, fontMono.variable, "font-sans")
  }, [direction])

  return (
    <DirectionProvider direction={direction}>
      <ThemeProvider forcedTheme={theme}>
        <TooltipProvider>
          <div className="min-h-svh bg-background p-6 text-foreground">
            {children}
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </DirectionProvider>
  )
}

const preview: Preview = {
  initialGlobals: {
    direction: "rtl",
    theme: "light",
  },
  globalTypes: {
    direction: {
      description: "جهت متن",
      toolbar: {
        title: "Direction",
        icon: "globe",
        items: [
          { value: "rtl", title: "RTL" },
          { value: "ltr", title: "LTR" },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: "تم",
      toolbar: {
        title: "Theme",
        icon: "contrast",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
  },
  decorators: [
    (Story, context) => {
      const direction: Direction =
        context.globals.direction === "ltr" ? "ltr" : "rtl"
      const theme: Theme = context.globals.theme === "dark" ? "dark" : "light"

      return (
        <StoryFrame direction={direction} theme={theme}>
          <Story />
        </StoryFrame>
      )
    },
  ],
}

export default preview
