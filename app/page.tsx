import { CodeXml, KeyRound, UserRound, UsersRound, Wallet } from "lucide-react"

import { AppShell } from "@/components/templates/app-shell"
import { FeaturePreview } from "@/features/home/feature-preview"

const features = [
  {
    title: "ورود به حساب",
    description: "ورود با کد یک‌بارمصرف از طریق پیامک یا تماس صوتی.",
    icon: KeyRound,
    preview: "login",
  },
  {
    title: "کیف پول",
    description: "شارژ کیف پول از طریق درگاه پرداخت و ثبت درخواست برداشت وجه.",
    icon: Wallet,
    preview: "wallet",
  },
  {
    title: "تصویر حساب کاربری",
    description: "بارگذاری و حذف آواتار کاربر در حساب کاربری.",
    icon: UserRound,
    preview: "avatar",
  },
  {
    title: "دعوت دوستان",
    description: "دعوت دوستان از طریق حساب کاربری.",
    icon: UsersRound,
    preview: "invite",
  },
] as const

export default function Page() {
  return (
    <AppShell>
      <section aria-labelledby="features-heading" className="space-y-6">
        <div className="space-y-2">
          <h1 id="features-heading" className="text-2xl font-medium">
            امکانات این نسخه
          </h1>
          <p className="text-muted-foreground">
            قابلیت‌هایی که در این نسخه در دسترس هستند.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ title, description, icon: Icon, preview }) => (
            <div
              key={title}
              className="rounded-xl border bg-card p-5 text-card-foreground"
            >
              <Icon aria-hidden="true" className="mb-4 size-5" />
              <h2 className="font-medium">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {description}
              </p>
              <div className="mt-5">
                <FeaturePreview type={preview} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="repositories-heading" className="space-y-4">
        <h2 id="repositories-heading" className="text-xl font-medium">
          منابع پروژه
        </h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/amirtaqiabadi/frontend-starter-kit"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <CodeXml aria-hidden="true" className="size-4" />
            فرانت‌اند در گیت‌هاب
          </a>
          <a
            href="https://github.com/amirtaqiabadi/backend-starter-kit"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <CodeXml aria-hidden="true" className="size-4" />
            بک‌اند در گیت‌هاب
          </a>
          <a
            href="https://api.starter-kit.ir/docs"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <CodeXml aria-hidden="true" className="size-4" />
            مستندات API (Swagger)
          </a>
        </div>
      </section>
    </AppShell>
  )
}
