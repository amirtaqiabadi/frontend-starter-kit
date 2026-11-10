import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

type MenuItemStoryArgs = {
  variant: "default" | "destructive"
}

const meta = {
  title: "Atoms/DropdownMenuItem",
  args: {
    variant: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
    },
  },
} satisfies Meta<MenuItemStoryArgs>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => {
    const { variant } = args as MenuItemStoryArgs
    return (
      <DropdownMenu open>
        <DropdownMenuTrigger render={<Button variant="outline" />}>
          فهرست
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem variant={variant}>ویرایش</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}
