import banksFile from "iran-bank-card/data/banks.json"

import { toAsciiDigits } from "@/lib/digits"

type BankRecord = {
  nameFa: string
  logoFile: string
}

type BanksFile = {
  bluBins: string[]
  bins: Record<string, string>
  banks: Record<string, BankRecord>
}

const banks = banksFile as BanksFile

export type CardBank = {
  id: string
  nameFa: string
  logoFile: string
}

/** Looks up the issuing bank in the iran-bank-card BIN table, including Blu's 8-digit exception. */
export function resolveBankByCard(cardNumber: string): CardBank | null {
  const digits = toAsciiDigits(cardNumber).replace(/\D/g, "")
  if (!digits) {
    return null
  }

  const bankId = banks.bins[digits.slice(0, 6)]
  if (!bankId) {
    return null
  }

  const id =
    bankId === "saman" && banks.bluBins.includes(digits.slice(0, 8))
      ? "blu"
      : bankId
  const record = banks.banks[id]
  if (!record) {
    return null
  }

  return { id, nameFa: record.nameFa, logoFile: record.logoFile }
}

/** Public path for a logo file shipped in iran-bank-card. */
export function bankLogoSrc(logoFile: string) {
  return `/bank-logos/${logoFile}`
}
