"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { LoaderCircleIcon } from "lucide-react"

import { AvatarUploader } from "@/components/organisms/avatar-uploader/avatar-uploader"
import { FormField } from "@/components/molecules/form-field"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatIranMobile } from "@/features/login/phone"
import { loginPath } from "@/features/login/redirect-path"
import {
  readAccount,
  saveAccount,
  subscribeAccount,
  type AccountProfile,
} from "@/features/account/account-store"
import {
  isUnauthorized,
  isWalletApiError,
  listWallets,
} from "@/features/account/wallet-api"
import { WalletPanel } from "@/features/account/wallet-panel"
import type {
  CardRefund,
  LedgerTransaction,
  Wallet,
} from "@/features/account/wallet-model"

const fieldClassName = "h-11 text-base"
const MAX_NAME_LENGTH = 60

/** Reads the optimized WebP into the data URL stored on the account. */
function readOptimizedAvatar(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      if (!result.startsWith("data:image/webp") || result.includes('"')) {
        reject(new Error("invalid avatar"))
        return
      }
      resolve(result)
    }
    reader.onerror = () => {
      reject(new Error("invalid avatar"))
    }
    reader.readAsDataURL(file)
  })
}

export type WalletPreview = {
  wallets: Wallet[]
  transactions?: LedgerTransaction[]
  refunds?: CardRefund[]
}

type AccountPanelProps = {
  initialAccount?: AccountProfile | null
  walletPreview?: WalletPreview
}

/** Account profile editor and live wallet, or a prompt when nobody is signed in. */
export function AccountPanel({
  initialAccount,
  walletPreview,
}: AccountPanelProps) {
  if (initialAccount !== undefined) {
    return (
      <PreviewAccount
        initialAccount={initialAccount}
        walletPreview={walletPreview}
      />
    )
  }

  return <StoredAccount />
}

function PreviewAccount({
  initialAccount,
  walletPreview,
}: {
  initialAccount: AccountProfile | null
  walletPreview?: WalletPreview
}) {
  const [account, setAccount] = useState(initialAccount)
  if (!account) {
    return <AccountGuest />
  }

  return (
    <AccountBody
      account={account}
      onAccountChange={setAccount}
      wallets={walletPreview?.wallets ?? []}
      transactions={walletPreview?.transactions}
      refunds={walletPreview?.refunds}
      preview
    />
  )
}

function StoredAccount() {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    isHydrated,
    isServer
  )
  const account = useSyncExternalStore(
    subscribeAccount,
    readAccount,
    emptyAccount
  )
  const session = useWalletSession()

  if (!hydrated || session.status === "loading") {
    return <AccountSkeleton />
  }

  if (session.status === "signed-out") {
    return <AccountGuest />
  }

  if (session.status === "error") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>کیف پول بارگذاری نشد</CardTitle>
          <CardDescription>{session.message}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="h-11" onClick={session.retry}>
            تلاش دوباره
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <AccountBody
      account={account}
      onAccountChange={saveAccount}
      wallets={session.wallets}
    />
  )
}

function AccountSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className="h-64" />
      <Skeleton className="h-80" />
    </div>
  )
}

function AccountGuest() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>وارد نشده‌اید</CardTitle>
        <CardDescription>
          برای دیدن حساب کاربری و کیف پول با شماره موبایل وارد شوید.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          nativeButton={false}
          render={<Link href={loginPath("/account")} />}
          className="h-11"
        >
          ورود
        </Button>
      </CardFooter>
    </Card>
  )
}

function AccountBody({
  account,
  onAccountChange,
  wallets,
  transactions,
  refunds,
  preview = false,
}: {
  account: AccountProfile | null
  onAccountChange: (next: AccountProfile) => void
  wallets: Wallet[]
  transactions?: LedgerTransaction[]
  refunds?: CardRefund[]
  preview?: boolean
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {account ? (
        <ProfileForm account={account} onAccountChange={onAccountChange} />
      ) : null}
      <WalletPanel
        initialWallets={wallets}
        initialTransactions={transactions}
        initialRefunds={refunds}
        preview={preview}
      />
    </div>
  )
}

function ProfileForm({
  account,
  onAccountChange,
}: {
  account: AccountProfile
  onAccountChange: (next: AccountProfile) => void
}) {
  const [name, setName] = useState(account.name)
  const [avatarDataUrl, setAvatarDataUrl] = useState(account.avatarDataUrl)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [pending, setPending] = useState(false)
  useBlockUnload(pending)

  function onOptimizedAvatar(file: File) {
    void readOptimizedAvatar(file).then(
      (nextAvatar) => {
        setAvatarDataUrl(nextAvatar)
        setNotice("")
      },
      () => {
        setNotice("")
      }
    )
  }

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) {
      return
    }

    setPending(true)
    setError("")
    setNotice("")

    try {
      onAccountChange({
        ...account,
        name: name.trim().slice(0, MAX_NAME_LENGTH),
        avatarDataUrl,
      })
      setNotice("ذخیره شد")
    } catch {
      setError("ذخیره انجام نشد. دوباره تلاش کنید.")
    } finally {
      setPending(false)
    }
  }

  const avatarLabel = name.trim() ? `تصویر ${name.trim()}` : "آواتار"

  return (
    <Card>
      <CardHeader>
        <CardTitle>مشخصات</CardTitle>
        <CardDescription>
          شماره {formatIranMobile(account.phone)}. نام و تصویر را اضافه یا
          ویرایش کنید.
        </CardDescription>
      </CardHeader>
      <form onSubmit={saveProfile}>
        <CardContent className="flex flex-col gap-4">
          <AvatarUploader
            value={avatarDataUrl}
            imageLabel={avatarLabel}
            disabled={pending}
            onChange={onOptimizedAvatar}
            onRemove={() => {
              setAvatarDataUrl("")
              setNotice("")
            }}
          />
          <FormField id="name" label="نام" error={error}>
            <Input
              id="name"
              name="name"
              className={fieldClassName}
              autoComplete="name"
              maxLength={MAX_NAME_LENGTH}
              value={name}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "name-error" : undefined}
              onChange={(event) => {
                setName(event.target.value)
                setError("")
                setNotice("")
              }}
            />
          </FormField>
          {notice ? (
            <p className="text-sm text-muted-foreground" role="status">
              {notice}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="h-11 w-full sm:w-auto"
            disabled={pending}
          >
            {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
            {pending ? "در حال ذخیره" : "ذخیره"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

type WalletSession =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string; retry: () => void }
  | { status: "ready"; wallets: Wallet[] }

/** Loads wallets once; `401` is signed out. */
function useWalletSession(): WalletSession {
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

/** Warns before refresh or close while a save is in progress. */
function useBlockUnload(active: boolean) {
  useEffect(() => {
    if (!active) {
      return
    }

    function blockUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
    }

    window.addEventListener("beforeunload", blockUnload)
    return () => window.removeEventListener("beforeunload", blockUnload)
  }, [active])
}

function subscribeHydration() {
  return () => {}
}

function isHydrated() {
  return true
}

function isServer() {
  return false
}

function emptyAccount() {
  return null
}
