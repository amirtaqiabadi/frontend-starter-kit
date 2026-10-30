import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { AppShell } from "./app-shell"

const meta = {
  title: "Templates/AppShell",
  component: AppShell,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof AppShell>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <p className="text-muted-foreground">
        محتوای صفحه داخل پوسته قرار می‌گیرد و منطق دامنه این‌جا نیست.
      </p>
    ),
  },
}
