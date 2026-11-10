import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { LoginForm } from "./login-form"

const meta = {
  title: "Features/Login",
  component: LoginForm,
  tags: ["autodocs"],
  argTypes: {
    initialStep: {
      control: "select",
      options: ["phone", "password", "otp", "set-password", "reset-password"],
    },
    initialPhone: { control: "text" },
    initialDevCode: { control: "text" },
    inviteToken: { control: "text" },
    next: { control: "text" },
  },
  render: (args) => <LoginForm key={JSON.stringify(args)} {...args} />,
} satisfies Meta<typeof LoginForm>

export default meta

type Story = StoryObj<typeof meta>

export const Phone: Story = {}

export const WithInviteToken: Story = {
  args: {
    initialPhone: "09123456789",
    inviteToken: "a2c4-6",
  },
}

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

export const Password: Story = {
  args: {
    initialStep: "password",
    initialPhone: "09123456789",
  },
}

export const Otp: Story = {
  args: {
    initialStep: "otp",
    initialPhone: "09123456789",
    initialDevCode: "12345",
  },
}

export const SetPassword: Story = {
  args: {
    initialStep: "set-password",
    initialPhone: "09123456789",
  },
}

export const ResetPassword: Story = {
  args: {
    initialStep: "reset-password",
    initialPhone: "09123456789",
  },
}
