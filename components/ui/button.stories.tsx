import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { LoaderCircleIcon } from "lucide-react"

import { Button } from "./button"

const meta = {
  title: "Atoms/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "ادامه",
    variant: "default",
    size: "default",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "default", "lg", "icon"],
    },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button>اصلی</Button>
        <Button variant="secondary">ثانویه</Button>
        <Button variant="outline">خطی</Button>
        <Button variant="ghost">شفاف</Button>
        <Button variant="destructive">حذف</Button>
        <Button variant="link">پیوند</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="xs">خیلی کوچک</Button>
        <Button size="sm">کوچک</Button>
        <Button size="default">معمولی</Button>
        <Button size="lg">بزرگ</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled>غیرفعال</Button>
        <Button disabled>
          <LoaderCircleIcon className="animate-spin" />
          در حال ارسال
        </Button>
      </div>
    </div>
  ),
}
