import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import type { AccountProfile } from "./account-store"
import { AccountPanel } from "./account-panel"
import type { Wallet } from "./wallet-model"

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
    preview: "guest",
  },
}

export const Error: Story = {
  args: {
    preview: "error",
  },
}

export const Empty: Story = {
  args: {
    preview: {
      wallets: [],
    },
  },
}

export const WithWallet: Story = {
  args: {
    preview: {
      account: namedAccount,
      wallets: [ownedWallet],
    },
  },
}

export const Member: Story = {
  args: {
    preview: {
      account: namedAccount,
      wallets: [memberWallet],
    },
  },
}
