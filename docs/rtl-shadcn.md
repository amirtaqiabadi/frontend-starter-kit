# راست‌به‌چپ در shadcn/ui

پشتیبانی راست‌به‌چپ از CLI رسمی می‌آید، نه از یک `direction: rtl` دستی.

## تنظیم پایه

- در `components.json` مقدار `"rtl": true` و `"style": "base-nova"` است. تبدیل خودکار کلاس فقط برای این استایل‌های جدید فعال است.
- `<html lang="fa" dir="rtl">` در `app/layout.tsx`.
- اپ با `DirectionProvider direction="rtl"` از `@/components/ui/direction` پیچیده شده است.
- فونت وزیرمتن در `lib/fonts.ts` است و متغیر `--font-sans` را پر می‌کند. همین ماژول در Storybook هم لود می‌شود.

افزودن کامپوننت:

```bash
pnpm dlx shadcn@latest add button
```

CLI کلاس‌هایی مثل `left` و `ml` را به `start` و `ms` تبدیل می‌کند، تراز متن را منطقی می‌کند، و آیکون‌های پشتیبانی‌شده را با `rtl:rotate-180` می‌چرخاند. انیمیشن `slide-in-from-right` به `slide-in-from-end` تبدیل می‌شود.

## فیلدهای لاتین

ایمیل و مقدارهای لاتین روی خود کنترل `dir="ltr"` می‌گیرند تا ترتیب نویسه‌ها در زمینه راست‌به‌چپ به‌هم نریزد.

`Select` برچسب را فقط وقتی نشان می‌دهد که `items` نقشه مقدار به برچسب را داشته باشد. بدون آن، مقدار خام مثل `tehran` دیده می‌شود.

## آیکون جهت‌دار

از `DirectionalIcon` استفاده کنید. این اتم کلاس `rtl:rotate-180` را می‌گذارد. معادل مستقیم:

```tsx
<ArrowRightIcon className="rtl:rotate-180" />
```

## پورتال‌ها

`DirectionProvider` فقط context ری‌اکت را تنظیم می‌کند و ویژگی `dir` را روی گره پورتال نمی‌گذارد. به‌خاطر مشکل شناخته‌شده `tw-animate-css`، انیمیشن منطقی به `dir` روی خود لایه یا جد آن نیاز دارد.

این محتواها `dir` را از `useDirection()` می‌گیرند، مگر اینکه فراخوان `dir` را خودش پاس بدهد:

- `DialogContent`
- `DropdownMenuContent`
- `SelectContent`
- `TooltipContent`

`html` هم `dir` دارد تا محتوای پورتال‌شده به `document.body` جهت را به ارث ببرد. در Storybook، دکوراتور `documentElement.dir` را با سوییچ RTL/LTR هم‌گام می‌کند.

## استثناهای مهاجرت دستی

این‌ها الان نصب نشده‌اند. اگر بعداً اضافه شوند، CLI همه اصلاحاتشان را انجام نمی‌دهد و باید بخش RTL سند هر کدام جدا بررسی شود:

- Calendar
- Pagination
- Sidebar

بعد از افزودن، `pnpm dlx shadcn@latest migrate rtl` را فقط وقتی اجرا کنید که کامپوننت قبلاً بدون `rtl: true` نصب شده باشد. کامپوننت تازه با `rtl: true` از همان اول تبدیل می‌شود.
