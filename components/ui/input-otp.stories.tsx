import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { InputOTP, InputOTPGroup, InputOTPSlot } from "./input-otp"

const meta = {
  title: "Atoms/InputOTP",
  component: InputOTP,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof InputOTP>

export default meta

type Story = StoryObj<typeof meta>

function FiveSlots({ invalid = false }: { invalid?: boolean }) {
  return (
    <InputOTP
      maxLength={5}
      defaultValue={invalid ? "123" : ""}
      aria-invalid={invalid || undefined}
      containerClassName="max-w-xs"
    >
      <InputOTPGroup dir="ltr" className="w-full justify-center gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            aria-invalid={invalid || undefined}
            className="size-11 shrink-0 rounded-lg border text-base first:rounded-lg last:rounded-lg"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}

export const FiveDigits: Story = {
  args: { maxLength: 5, children: null },
  render: () => <FiveSlots />,
}

export const Invalid: Story = {
  args: { maxLength: 5, children: null },
  render: () => <FiveSlots invalid />,
}
