"use client"

import { useState } from "react"
import { LoaderCircleIcon } from "lucide-react"

import { FormField } from "@/components/molecules/form-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const cities = {
  tehran: "تهران",
  isfahan: "اصفهان",
  shiraz: "شیراز",
}

/** Persian-first sample of the shared component foundation. */
export function FoundationPreview() {
  const [pending, setPending] = useState(false)

  function submitSample() {
    if (pending) {
      return
    }

    setPending(true)
    window.setTimeout(() => setPending(false), 1200)
  }

  return (
    <div className="flex flex-col gap-8">
      <section id="components" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>پایه</Badge>
          <Badge variant="secondary">RTL</Badge>
          <Badge variant="outline">Storybook</Badge>
        </div>
        <h1 className="text-2xl font-medium sm:text-3xl">سیستم اجزای آماده</h1>
        <p className="max-w-2xl text-muted-foreground">
          این صفحه نمونه‌ای فارسی است با عبارت انگلیسی{" "}
          <span className="font-mono text-foreground">shadcn/ui</span> تا چیدمان
          راست‌به‌چپ و متن مخلوط هر دو دیده شوند. مبلغ نمونه: ۱۲٬۵۰۰ تومان.
        </p>
      </section>

      <section id="form" className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>فرم نمونه</CardTitle>
            <CardDescription>برچسب، ورودی و حالت خطا</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField id="name" label="نام" hint="نام و نام خانوادگی">
              <Input id="name" placeholder="مثلاً سارا احمدی" />
            </FormField>
            <FormField
              id="email"
              label="ایمیل"
              error="ایمیل را کامل وارد کنید."
            >
              <Input
                id="email"
                type="email"
                dir="ltr"
                defaultValue="sara@"
                aria-invalid
                className="text-left"
                placeholder="name@example.com"
              />
            </FormField>
            <FormField id="city" label="شهر">
              <Select defaultValue="tehran" items={cities}>
                <SelectTrigger id="city" className="w-full">
                  <SelectValue placeholder="شهر را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tehran">تهران</SelectItem>
                  <SelectItem value="isfahan">اصفهان</SelectItem>
                  <SelectItem value="shiraz">شیراز</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="note" label="توضیح">
              <Textarea id="note" placeholder="یادداشت کوتاه" />
            </FormField>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox defaultChecked />
                خبرنامه را می‌خواهم
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch defaultChecked />
                اعلان‌ها فعال باشد
              </label>
            </div>
          </CardContent>
          <CardFooter>
            <Button disabled={pending} onClick={submitSample}>
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              {pending ? "در حال ارسال" : "ثبت"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>وضعیت‌ها</CardTitle>
            <CardDescription>دکمه، نشان و اسکلت بارگذاری</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button>اصلی</Button>
              <Button variant="secondary">ثانویه</Button>
              <Button variant="outline">خطی</Button>
              <Button variant="destructive">حذف</Button>
              <Button disabled>غیرفعال</Button>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="overlays" className="flex flex-wrap items-center gap-3">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            باز کردن گفتگو
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>گفتگوی نمونه</DialogTitle>
              <DialogDescription>
                این لایه روی بقیه صفحه باز می‌شود و جهت راست‌به‌چپ دارد.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button>تأیید</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            فهرست
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>ویرایش</DropdownMenuItem>
            <DropdownMenuItem>کپی</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">حذف</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" />}>
            راهنما
          </TooltipTrigger>
          <TooltipContent>متن راهنما در جهت سند</TooltipContent>
        </Tooltip>
      </section>
    </div>
  )
}
