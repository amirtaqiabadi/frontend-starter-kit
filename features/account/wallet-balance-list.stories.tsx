import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { WalletBalanceList } from "./wallet-balance-list"
import type { Wallet } from "./wallet-model"

const travel: Wallet = {
  teamId: 4,
  displayName: "Travel",
  role: "owner",
  availableBalance: 3_000_000,
  restrictedBalance: 0,
}

const personal: Wallet = {
  teamId: 1,
  displayName: "Personal wallet",
  role: "owner",
  availableBalance: 0,
  restrictedBalance: 0,
}

const meta = {
  title: "Features/WalletBalanceList",
  component: WalletBalanceList,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof WalletBalanceList>

export default meta

type Story = StoryObj<typeof meta>

export const OneWallet: Story = {
  args: {
    wallets: [travel],
  },
}

export const Several: Story = {
  args: {
    wallets: [personal, travel],
  },
}
