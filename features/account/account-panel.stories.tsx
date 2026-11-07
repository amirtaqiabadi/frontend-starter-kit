import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import type { AccountProfile } from "./account-store"
import { AccountPanel } from "./account-panel"
import type { LedgerTransaction, Wallet } from "./wallet-model"

const emptyAccount: AccountProfile = {
  phone: "09123456789",
  name: "",
  avatarDataUrl: "",
}

const namedAccount: AccountProfile = {
  phone: "09123456789",
  name: "سارا محمدی",
  avatarDataUrl: "",
}

const ownedWallet: Wallet = {
  teamId: 4,
  displayName: "Travel",
  role: "owner",
  availableBalance: 3_000_000,
  restrictedBalance: 0,
}

const memberWallet: Wallet = {
  teamId: 8,
  displayName: "Team",
  role: "member",
  availableBalance: 500_000,
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

const reverseRow: LedgerTransaction = {
  id: 81,
  type: "Reverse",
  amount: -150_000,
  availableBalanceAfter: 2_350_000,
  restrictedBalanceAfter: 0,
  gatewayAttemptId: 9,
  createdAt: "2026-10-02T09:00:00.000Z",
}

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
    walletPreview: {
      wallets: [],
    },
  },
}

export const WithWallet: Story = {
  args: {
    initialAccount: namedAccount,
    walletPreview: {
      wallets: [ownedWallet],
      transactions: [recentCredit, reverseRow, olderCredit],
      refunds: [],
    },
  },
}

export const Member: Story = {
  args: {
    initialAccount: namedAccount,
    walletPreview: {
      wallets: [memberWallet],
    },
  },
}
