import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { WalletPanel } from "./wallet-panel"
import type { CardRefund, LedgerTransaction, Wallet } from "./wallet-model"

const ownedWallet: Wallet = {
  teamId: 4,
  displayName: "Travel",
  role: "owner",
  availableBalance: 3_000_000,
  restrictedBalance: 200_000,
}

const personalWallet: Wallet = {
  teamId: 1,
  displayName: "Personal wallet",
  role: "owner",
  availableBalance: 0,
  restrictedBalance: 0,
}

const recentCredit: LedgerTransaction = {
  id: 91,
  type: "GatewayCredit",
  amount: 500_000,
  availableBalanceAfter: 3_000_000,
  restrictedBalanceAfter: 0,
  gatewayAttemptId: 18,
  createdAt: new Date().toISOString(),
}

const olderCredit: LedgerTransaction = {
  id: 80,
  type: "GatewayCredit",
  amount: 800_000,
  availableBalanceAfter: 2_500_000,
  restrictedBalanceAfter: 0,
  gatewayAttemptId: 12,
  createdAt: "2026-10-01T12:00:00.000Z",
}

const pendingRefund: CardRefund = {
  id: 3,
  teamId: 4,
  transactionId: 80,
  amount: 800_000,
  status: "pending",
  cardNumber: "502229******5995",
  createdAt: "2026-10-01T12:10:00.000Z",
}

const meta = {
  title: "Features/Wallet",
  component: WalletPanel,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
  args: {
    preview: true,
    initialWallets: [ownedWallet],
  },
} satisfies Meta<typeof WalletPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    initialWallets: [],
  },
}

export const Owner: Story = {
  args: {
    initialWallets: [personalWallet, ownedWallet],
    initialTransactions: [recentCredit, olderCredit],
    initialRefunds: [pendingRefund],
  },
}

export const Member: Story = {
  args: {
    initialWallets: [
      {
        ...ownedWallet,
        role: "member",
      },
    ],
  },
}
