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

## استقرار Docker روی لیارا

فایل `Dockerfile` با Node.js 24 و pnpm 11.9.0، خروجی `standalone` می‌سازد و با کاربر غیر root روی پورت 3000 اجرا می‌کند. فایل‌های `.env*`، وابستگی‌های محلی و خروجی‌های قبلی در Docker و بستهٔ ارسالی لیارا قرار نمی‌گیرند.

```bash
docker build -t frontend-starter-kit .
docker run --rm -p 3000:3000 frontend-starter-kit
liara deploy --no-app-logs
```

فایل `liara.json` برنامهٔ `frontend-satrter-kit` را در تیم مشخص‌شده با محل ساخت آلمان هدف می‌گیرد. CLI باید قبلاً با `liara login` وارد حساب شده باشد.

دو برنامهٔ فرانت‌اند و بک‌اند در شبکهٔ خصوصی `starter-kit` لیارا هستند. در متغیرهای محیطی برنامهٔ فرانت‌اند مقدار `API_ORIGIN=http://backend-starter-kit:3000` تنظیم شده است. تغییر این متغیر به ری‌استارت برنامه نیاز دارد. پراکسی فعلی هدر Host فرانت‌اند را حفظ می‌کند؛ بنابراین برای ارتباط با بک‌اند در لیارا از آدرس داخلی استفاده کنید، چون دامنهٔ عمومی بک‌اند با این هدر دوباره به فرانت‌اند مسیریابی می‌شود.

مقدار `NEXT_PUBLIC_API_ORIGIN` به‌صورت پیش‌فرض خالی است تا مرورگر از پراکسی هم‌دامنهٔ `/api` استفاده کند. اگر اتصال مستقیم مرورگر لازم شد، آن را هنگام ساخت با `--build-arg NEXT_PUBLIC_API_ORIGIN=https://api.example.com` به Docker یا Liara CLI بدهید؛ این مقدار عمومی در فایل‌های مرورگر ثبت می‌شود و به تنظیم CORS و کوکی‌ها در بک‌اند نیاز دارد.

راهنما: [استقرار Docker](https://docs.liara.ir/paas/docker/how-tos/deploy-app/) و [Liara CLI](https://docs.liara.ir/references/cli/deploy-app/).

## راست‌به‌چپ

`components.json` مقدار `rtl: true` دارد و استایل `base-nova` است. CLI هنگام افزودن کامپوننت، کلاس فیزیکی را به کلاس منطقی تبدیل می‌کند. سند با `lang="fa"` و `dir="rtl"` و `DirectionProvider` تنظیم شده است. جزئیات و استثناها در [docs/rtl-shadcn.md](docs/rtl-shadcn.md) است.

## افزودن کامپوننت shadcn

```bash
pnpm dlx shadcn@latest add card
```

کامپوننت در `components/ui` ساخته می‌شود. اگر رفتار مخصوص پروژه لازم بود، آن را در لایه مناسب ترکیب کنید و استوری را کنار همان فایل بگذارید.

## Storybook

استوری‌ها کنار کامپوننت هستند و عنوان‌شان لایه را نشان می‌دهد، مثلاً `Atoms/Button`. پیش‌فرض Storybook راست‌به‌چپ و فارسی است. نوار ابزار جهت (RTL/LTR) و تم (روشن/تیره) را عوض می‌کند. فونت، توکن‌ها و `globals.css` با اپ مشترک‌اند.
