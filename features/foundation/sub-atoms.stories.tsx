import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  ColorTokens,
  ShadowScale,
  SpacingScale,
  TypeScale,
} from "./sub-atoms"

const meta = {
  title: "Sub-atoms",
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Colors: Story = {
  render: () => <ColorTokens />,
}

export const Spacing: Story = {
  render: () => <SpacingScale />,
}

export const Typography: Story = {
  render: () => <TypeScale />,
}

export const Shadows: Story = {
  render: () => <ShadowScale />,
}
