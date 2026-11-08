import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { WalletScreen } from "./wallet-screen"
import type { LedgerTransaction, Wallet } from "./wallet-model"

const ownedWallet: Wallet = {
  teamId: 4,
  displayName: "Travel",
  role: "owner",
  availableBalance: 3_000_000,
  restrictedBalance: 0,
}

const recentCredit: LedgerTransaction = {
  id: 91,
  type: "GatewayCredit",
  amount: 500_000,
  availableBalanceAfter: 3_000_000,
  restrictedBalanceAfter: 0,
  gatewayAttemptId: 18,
  createdAt: "2026-11-08T08:00:00.000Z",
}

const meta = {
  title: "Features/WalletScreen",
  component: WalletScreen,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof WalletScreen>

export default meta

type Story = StoryObj<typeof meta>

export const Guest: Story = {
  args: {
    preview: "guest",
  },
}

export const Error: Story = {
  args: {
    preview: "error",
  },
}

export const Ready: Story = {
  args: {
    preview: {
      wallets: [ownedWallet],
      transactions: [recentCredit],
      refunds: [],
    },
  },
}
