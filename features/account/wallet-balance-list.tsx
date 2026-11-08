import { formatToman } from "@/lib/money"
import { walletDisplayName, type Wallet } from "@/features/account/wallet-model"

/** Lists each wallet name with its available balance in Toman. */
export function WalletBalanceList({ wallets }: { wallets: Wallet[] }) {
  if (wallets.length === 0) {
    return null
  }

  return (
    <ul className="flex flex-col gap-2">
      {wallets.map((wallet) => (
        <li
          key={wallet.teamId}
          className="flex items-center justify-between gap-3"
        >
          <span className="text-sm">
            {walletDisplayName(wallet.displayName)}
          </span>
          <span className="text-sm font-medium">
            {formatToman(wallet.availableBalance)}
          </span>
        </li>
      ))}
    </ul>
  )
}
