import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { PaymentFailurePanel, PaymentSuccessPanel } from "./payment-result"

const meta = {
  title: "Features/PaymentResult",
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Success: Story = {
  render: () => (
    <PaymentSuccessPanel
      attemptId="18"
      traceId="8c0d0b0e-3b1e-4f0a-9c2d-1a2b3c4d5e6f"
      previewWallets={[
        {
          teamId: 4,
          displayName: "Travel",
          role: "owner",
          availableBalance: 500_000,
          restrictedBalance: 0,
        },
      ]}
    />
  ),
}

export const Failure: Story = {
  render: () => (
    <PaymentFailurePanel
      code="PAYMENT_NOT_VERIFIED"
      traceId="8c0d0b0e-3b1e-4f0a-9c2d-1a2b3c4d5e6f"
    />
  ),
}

export const GatewayUnavailable: Story = {
  render: () => (
    <PaymentFailurePanel
      code="GATEWAY_UNAVAILABLE"
      traceId="8c0d0b0e-3b1e-4f0a-9c2d-1a2b3c4d5e6f"
    />
  ),
}
