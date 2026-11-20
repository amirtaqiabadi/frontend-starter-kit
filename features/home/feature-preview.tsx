"use client"

import { AvatarUploader } from "@/components/organisms/avatar-uploader/avatar-uploader"
import { InviteFriends } from "@/features/account/invite-friends"
import { WalletPanel } from "@/features/account/wallet-panel"
import { OtpStep } from "@/features/login/login-steps"

const noop = () => {}

/** Read-only examples use the same components as the application. */
export function FeaturePreview({
  type,
}: {
  type: "login" | "wallet" | "avatar" | "invite"
}) {
  return (
    <div
      aria-hidden="true"
      inert
      className="pointer-events-none flex h-64 items-start justify-center overflow-hidden rounded-lg bg-muted/50 p-4"
    >
      <div className="w-full max-w-sm">
        {type === "login" && (
          <OtpStep
            phone="09123456789"
            otp=""
            error=""
            pending={false}
            lockIn={0}
            resendIn={60}
            devCode=""
            onOtpChange={noop}
            onSubmit={noop}
            onResend={noop}
          />
        )}
        {type === "wallet" && (
          <WalletPanel
            preview
            initialWallets={[
              {
                teamId: 1,
                displayName: "کیف پول شخصی",
                role: "owner",
                availableBalance: 3000000,
                restrictedBalance: 0,
              },
            ]}
          />
        )}
        {type === "avatar" && (
          <div className="flex min-h-52 items-center justify-center rounded-xl border bg-card p-6">
            <AvatarUploader onChange={noop} onRemove={noop} />
          </div>
        )}
        {type === "invite" && <InviteFriends code="A2C46" />}
      </div>
    </div>
  )
}
