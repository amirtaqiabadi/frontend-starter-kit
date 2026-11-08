"use client"

import { useEffect, useState } from "react"

import {
  isUnauthorized,
  isWalletApiError,
  listWallets,
} from "@/features/account/wallet-api"
import type { Wallet } from "@/features/account/wallet-model"

export type WalletSession =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string; retry: () => void }
  | { status: "ready"; wallets: Wallet[] }

/** Loads wallets once; `401` is signed out. */
export function useWalletSession(): WalletSession {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "signed-out" }
    | { status: "error"; message: string }
    | { status: "ready"; wallets: Wallet[] }
  >({ status: "loading" })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false

    listWallets()
      .then((wallets) => {
        if (!cancelled) {
          setState({ status: "ready", wallets })
        }
      })
      .catch((reason) => {
        if (cancelled) {
          return
        }
        if (isUnauthorized(reason)) {
          setState({ status: "signed-out" })
          return
        }
        setState({
          status: "error",
          message: isWalletApiError(reason)
            ? reason.message
            : "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.",
        })
      })

    return () => {
      cancelled = true
    }
  }, [nonce])

  if (state.status === "error") {
    return {
      ...state,
      retry: () => {
        setState({ status: "loading" })
        setNonce((value) => value + 1)
      },
    }
  }

  return state
}
