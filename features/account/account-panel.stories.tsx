import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { withSampleTransactions, type AccountProfile } from "./account-store"
import { AccountPanel } from "./account-panel"

const emptyAccount: AccountProfile = {
  phone: "09123456789",
  name: "",
  avatarDataUrl: "",
  balanceRial: 0,
  transactions: [],
}

const activeAccount = withSampleTransactions({
  phone: "09123456789",
  name: "سارا محمدی",
  avatarDataUrl: "",
  balanceRial: 0,
  transactions: [],
})

const meta = {
  title: "Features/Account",
  component: AccountPanel,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof AccountPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Guest: Story = {
  args: {
    initialAccount: null,
  },
}

export const Empty: Story = {
  args: {
    initialAccount: emptyAccount,
  },
}

export const WithWallet: Story = {
  args: {
    initialAccount: activeAccount,
  },
}
