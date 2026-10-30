# پایه فرانت‌اند

شروع پروژه Next.js با shadcn/ui، راست‌به‌چپ رسمی، Storybook و Atomic Design.

## معماری

وابستگی فقط از لایه بالاتر به پایین‌تر است. `components/ui` هیچ لایه دیگری را import نمی‌کند.

| لایه | مسیر | مسئولیت |
| --- | --- | --- |
| Primitives | `components/ui` | خروجی CLI شادسی‌ان. دوباره در atoms کپی نمی‌شوند. |
| Atoms | `components/atoms` | رفتار کوچک مخصوص پروژه، مثل `DirectionalIcon`. |
| Molecules | `components/molecules` | ترکیب کوتاه، مثل فیلد فرم. |
| Organisms | `components/organisms` | بخش کامل رابط، مثل هدر. |
| Templates | `components/templates` | پوسته صفحه، بدون منطق دامنه. |
| Features | `features` | ترکیب مربوط به یک قابلیت. |
| Pages | `app` | مسیرها؛ فقط قالب و فیچر را کنار هم می‌گذارند. |

اگر کامپوننتی رفتار تازه‌ای نمی‌خواهد، در همان `components/ui` می‌ماند و استوری‌اش عنوان لایه را می‌گیرد.

## دستورها

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm format
pnpm storybook
pnpm build-storybook
```

## راست‌به‌چپ

`components.json` مقدار `rtl: true` دارد و استایل `base-nova` است. CLI هنگام افزودن کامپوننت، کلاس فیزیکی را به کلاس منطقی تبدیل می‌کند. سند با `lang="fa"` و `dir="rtl"` و `DirectionProvider` تنظیم شده است. جزئیات و استثناها در [docs/rtl-shadcn.md](docs/rtl-shadcn.md) است.

## افزودن کامپوننت shadcn

```bash
pnpm dlx shadcn@latest add card
```

کامپوننت در `components/ui` ساخته می‌شود. اگر رفتار مخصوص پروژه لازم بود، آن را در لایه مناسب ترکیب کنید و استوری را کنار همان فایل بگذارید.

## Storybook

استوری‌ها کنار کامپوننت هستند و عنوان‌شان لایه را نشان می‌دهد، مثلاً `Atoms/Button`. پیش‌فرض Storybook راست‌به‌چپ و فارسی است. نوار ابزار جهت (RTL/LTR) و تم (روشن/تیره) را عوض می‌کند. فونت، توکن‌ها و `globals.css` با اپ مشترک‌اند.
