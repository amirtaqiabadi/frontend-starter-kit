const COLOR_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "success",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const

const SPACING_STEPS = [
  ["gap-1", "gap-1"],
  ["gap-2", "gap-2"],
  ["gap-3", "gap-3"],
  ["gap-4", "gap-4"],
  ["gap-5", "gap-5"],
  ["gap-6", "gap-6"],
  ["gap-8", "gap-8"],
] as const

const TYPE_SIZES = [
  ["text-xs", "خیلی کوچک"],
  ["text-sm", "کوچک"],
  ["text-base", "متن"],
  ["text-lg", "درشت"],
  ["text-xl", "بزرگ"],
  ["text-2xl", "عنوان"],
] as const

const TYPE_WEIGHTS = [
  ["font-normal", "معمولی"],
  ["font-medium", "متوسط"],
  ["font-bold", "ضخیم"],
] as const

const SHADOWS = [
  "shadow-xs",
  "shadow-sm",
  "shadow",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-2xl",
] as const

/** Swatches for the theme color tokens. */
export function ColorTokens() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {COLOR_TOKENS.map((token) => (
        <li
          key={token}
          className="flex items-center gap-3 rounded-lg border p-3"
        >
          <span
            className="size-10 shrink-0 rounded-md border"
            style={{ background: `var(--${token})` }}
          />
          <span className="font-mono text-sm">{token}</span>
        </li>
      ))}
    </ul>
  )
}

/** The spacing steps used by forms and cards. */
export function SpacingScale() {
  return (
    <div className="flex flex-col gap-6">
      {SPACING_STEPS.map(([label, className]) => (
        <div key={label} className="flex items-center gap-4">
          <span className="w-16 font-mono text-sm">{label}</span>
          <div className={`flex ${className}`}>
            <span className="size-8 rounded-md bg-primary" />
            <span className="size-8 rounded-md bg-primary" />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4">
        <span className="w-16 font-mono text-sm">card</span>
        <div className="flex gap-(--card-spacing) [--card-spacing:--spacing(4)]">
          <span className="size-8 rounded-md bg-primary" />
          <span className="size-8 rounded-md bg-primary" />
        </div>
      </div>
    </div>
  )
}

/** Persian samples of the type scale and weights. */
export function TypeScale() {
  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-sm text-muted-foreground">font-sans</p>
      {TYPE_SIZES.map(([className, label]) => (
        <p key={className} className={className}>
          {label} — کیف پول
        </p>
      ))}
      <div className="flex flex-col gap-2">
        {TYPE_WEIGHTS.map(([className, label]) => (
          <p key={className} className={`text-base ${className}`}>
            {label}
          </p>
        ))}
      </div>
    </div>
  )
}

/** Tailwind shadow scale on sample cards. */
export function ShadowScale() {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {SHADOWS.map((shadow) => (
        <li
          key={shadow}
          className={`rounded-xl bg-card p-6 text-sm text-card-foreground ${shadow}`}
        >
          <span className="font-mono">{shadow}</span>
        </li>
      ))}
    </ul>
  )
}
