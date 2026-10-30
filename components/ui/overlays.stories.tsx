import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "@/components/ui/button"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const meta = {
  title: "Molecules/Overlays",
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Persian: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
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
    </div>
  ),
}
