import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { AvatarUploader } from "./avatar-uploader"

const sampleAvatar =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

function noop() {}

const meta = {
  title: "Organisms/AvatarUploader",
  component: AvatarUploader,
  tags: ["autodocs"],
  args: {
    value: "",
    disabled: false,
    onChange: noop,
    onRemove: noop,
  },
} satisfies Meta<typeof AvatarUploader>

export default meta

type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const WithImage: Story = {
  args: {
    value: sampleAvatar,
    imageLabel: "تصویر سارا محمدی",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}
