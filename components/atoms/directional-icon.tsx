import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type DirectionalIconProps = {
  icon: LucideIcon
  className?: string
}

/** Flips a directional icon when the document is RTL. */
export function DirectionalIcon({
  icon: Icon,
  className,
}: DirectionalIconProps) {
  return <Icon aria-hidden className={cn("rtl:rotate-180", className)} />
}
