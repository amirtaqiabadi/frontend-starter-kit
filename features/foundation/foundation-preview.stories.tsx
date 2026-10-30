import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { AppShell } from "@/components/templates/app-shell"

import { FoundationPreview } from "./foundation-preview"

const meta = {
  title: "Features/Foundation",
  component: FoundationPreview,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof FoundationPreview>

export default meta

type Story = StoryObj<typeof meta>

export const Page: Story = {
  render: () => (
    <AppShell>
      <FoundationPreview />
    </AppShell>
  ),
}
