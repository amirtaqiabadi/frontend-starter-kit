import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Badge } from "./badge"
import { Separator } from "./separator"
import { Skeleton } from "./skeleton"

const meta = {
  title: "Atoms/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: {
    children: "پایه",
    variant: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost"],
    },
    children: { control: "text" },
  },
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Status: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Badge>پایه</Badge>
        <Badge variant="secondary">ثانویه</Badge>
        <Badge variant="outline">خطی</Badge>
        <Badge variant="destructive">خطا</Badge>
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  ),
}
