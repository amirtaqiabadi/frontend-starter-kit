import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Input } from "@/components/ui/input"

import { FormField } from "./form-field"

const meta = {
  title: "Molecules/FormField",
  component: FormField,
  tags: ["autodocs"],
  args: {
    id: "sample-field",
    label: "شماره موبایل",
    error: "",
    hint: "",
    labelHidden: false,
    children: null,
  },
  argTypes: {
    labelHidden: { control: "boolean" },
    children: { control: false },
  },
  render: (args) => (
    <FormField {...args}>
      <Input id={args.id} placeholder="۰۹۱۲۳۴۵۶۷۸۹" />
    </FormField>
  ),
} satisfies Meta<typeof FormField>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const HiddenLabel: Story = {
  args: {
    labelHidden: true,
    hint: "برچسب فقط برای صفحه‌خوان است.",
  },
}

export const WithError: Story = {
  args: {
    error: "شماره موبایل معتبر نیست.",
  },
}
