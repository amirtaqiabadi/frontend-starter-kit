import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { LoginForm } from "./login-form"

const meta = {
  title: "Features/Login",
  component: LoginForm,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof LoginForm>

export default meta

type Story = StoryObj<typeof meta>

export const Phone: Story = {}

export const LeadingZero: Story = {
  args: {
    initialPhone: "912",
  },
}

export const Pattern: Story = {
  args: {
    initialPhone: "9123456789",
  },
}

export const Otp: Story = {
  args: {
    initialStep: "otp",
    initialPhone: "09123456789",
  },
}
