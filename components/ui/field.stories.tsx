import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Input } from "./input"
import { Field, FieldLabel } from "./field"

const meta = {
  title: "Atoms/Field",
  component: Field,
  tags: ["autodocs"],
  args: {
    orientation: "vertical",
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal", "responsive"],
    },
  },
} satisfies Meta<typeof Field>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: ({ orientation }) => (
    <Field orientation={orientation} className="max-w-md">
      <FieldLabel htmlFor="field-name">نام</FieldLabel>
      <Input id="field-name" placeholder="مثلاً سارا" />
    </Field>
  ),
}
