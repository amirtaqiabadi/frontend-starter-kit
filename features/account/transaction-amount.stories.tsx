import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { TransactionAmount } from "./transaction-amount"

const meta = {
  title: "Features/TransactionAmount",
  component: TransactionAmount,
  tags: ["autodocs"],
  args: {
    amountRial: 100_000,
  },
} satisfies Meta<typeof TransactionAmount>

export default meta

type Story = StoryObj<typeof meta>

export const Positive: Story = {
  args: {
    amountRial: 100_000,
  },
}

export const Negative: Story = {
  args: {
    amountRial: -100_000,
  },
}

export const Colors: Story = {
  render: () => (
    <div className="flex w-56 flex-col gap-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span>افزایش موجودی</span>
        <TransactionAmount amountRial={100_000} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span>بازگشت به درگاه</span>
        <TransactionAmount amountRial={-100_000} />
      </div>
    </div>
  ),
}
