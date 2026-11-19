"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { UserIcon } from "lucide-react"
import {
  getProfile,
  updateProfileName,
  ProfileApiError,
} from "@/features/account/profile-api"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  signOutAccount,
  type AccountProfile,
} from "@/features/account/account-store"
import { InviteFriends } from "@/features/account/invite-friends"
import { requestSignOut } from "@/features/account/sign-out"
import { useWalletSession } from "@/features/account/wallet-session"
import type { Wallet } from "@/features/account/wallet-model"
import { formatToman } from "@/lib/money"
import { formatIranMobile } from "@/features/login/phone"
import { loginPath } from "@/features/login/redirect-path"

const fieldClassName = "h-11 text-base md:text-base"
const MAX_NAME_LENGTH = 80

type AccountPreview = {
  wallets: Wallet[]
  account?: AccountProfile
}

type AccountPanelProps = {
  preview?: "guest" | "error" | AccountPreview
}

/** Profile, wallet entry, invites, and sign-out for the signed-in account. */
export function AccountPanel({ preview }: AccountPanelProps) {
  if (preview === "guest") {
    return <AccountGuest />
  }

  if (preview === "error") {
    return (
      <AccountError message="ارتباط با سرور برقرار نشد. دوباره تلاش کنید." />
    )
  }

  if (preview) {
    return (
      <PreviewAccount
        initialAccount={preview.account ?? emptyPreviewAccount}
        wallets={preview.wallets}
      />
    )
  }

  return <LiveAccount />
}

const emptyPreviewAccount: AccountProfile = {
  phone: "09123456789",
  name: "",
  avatarDataUrl: "",
}

function PreviewAccount({
  initialAccount,
  wallets,
}: {
  initialAccount: AccountProfile
  wallets: Wallet[]
}) {
  const [account, setAccount] = useState(initialAccount)

  return (
    <AccountHome
      account={account}
      wallets={wallets}
      onAccountChange={setAccount}
      preview
    />
  )
}

function LiveAccount() {
  const router = useRouter()
  const session = useWalletSession()
  const [account, setAccount] = useState<AccountProfile | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [profileError, setProfileError] = useState("")
  const [profileNonce, setProfileNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((profile) => {
        if (!cancelled) {
          setAccount({
            phone: profile.phoneNumber,
            name: profile.name ?? "",
            avatarDataUrl: profile.avatarUrl ?? "",
          })
          setInviteCode(profile.token)
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof ProfileApiError && error.status === 401) {
          router.replace(loginPath("/account"))
        } else {
          setProfileError(
            error instanceof Error ? error.message : "دریافت حساب انجام نشد."
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [router, profileNonce])

  useEffect(() => {
    if (session.status === "signed-out") {
      router.replace(loginPath("/account"))
    }
  }, [router, session.status])

  if (session.status === "loading" || session.status === "signed-out") {
    return <Skeleton className="h-48" />
  }

  if (session.status === "error") {
    return <AccountError message={session.message} onRetry={session.retry} />
  }

  return (
    <AccountHome
      account={account}
      wallets={session.wallets}
      inviteCode={profileError ? undefined : inviteCode}
      profileFallback={
        profileError ? (
          <AccountError
            message={profileError}
            onRetry={() => {
              setProfileError("")
              setProfileNonce((value) => value + 1)
            }}
          />
        ) : (
          <Skeleton className="h-48" />
        )
      }
      onAccountChange={async (next) => {
        try {
          const name = await updateProfileName(next.name)
          setAccount({ ...next, name })
        } catch (error) {
          if (error instanceof ProfileApiError && error.status === 401) {
            router.replace(loginPath("/account"))
          }
          throw error
        }
      }}
    />
  )
}

function AccountHome({
  account,
  wallets,
  onAccountChange,
  profileFallback,
  inviteCode,
  preview = false,
}: {
  account: AccountProfile | null
  wallets: Wallet[]
  onAccountChange: (next: AccountProfile) => void | Promise<void>
  profileFallback?: React.ReactNode
  inviteCode?: string | null
  preview?: boolean
}) {
  return (
    <div className="flex flex-col gap-6">
      {account ? (
        <ProfileForm account={account} onAccountChange={onAccountChange} />
      ) : (
        profileFallback
      )}
      <WalletEntry wallets={wallets} />
      {inviteCode === null && !preview ? (
        <Skeleton className="h-64" />
      ) : (
        <InviteFriends code={preview ? "A2C46" : (inviteCode ?? undefined)} />
      )}
      <SignOutButton preview={preview} />
    </div>
  )
}

function ProfileForm({
  account,
  onAccountChange,
}: {
  account: AccountProfile
  onAccountChange: (next: AccountProfile) => void | Promise<void>
}) {
  const [name, setName] = useState(account.name)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [pending, setPending] = useState(false)
  useBlockUnload(pending)

  const savedName = account.name.trim().slice(0, MAX_NAME_LENGTH)
  const draftName = name.trim().slice(0, MAX_NAME_LENGTH)
  const dirty = draftName !== savedName

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || !dirty) {
      return
    }

    if (!draftName) {
      setError("نام باید بین ۱ تا ۸۰ نویسه باشد.")
      return
    }
    setPending(true)
    setError("")
    setNotice("")

    try {
      await onAccountChange({
        ...account,
        name: draftName,
      })
      setNotice("ذخیره شد")
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "ذخیره انجام نشد. دوباره تلاش کنید."
      )
    } finally {
      setPending(false)
    }
  }

  const avatarLabel = draftName ? `تصویر ${draftName}` : "آواتار"
  const phone = formatIranMobile(account.phone)

  return (
    <Card>
      <form
        className="flex flex-col gap-(--card-spacing)"
        onSubmit={saveProfile}
      >
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2">
            <div
              role="img"
              aria-label={avatarLabel}
              className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-muted"
            >
              {account.avatarDataUrl ? (
                // Avatar URLs are supplied by the profile API.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={account.avatarDataUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <UserIcon
                  className="size-10 text-muted-foreground"
                  aria-hidden
                />
              )}
            </div>
          </div>
          <FormField id="phone" label="شماره موبایل">
            <Input
              id="phone"
              name="tel"
              className={`${fieldClassName} text-xl font-bold md:text-xl`}
              dir="ltr"
              type="tel"
              autoComplete="tel"
              value={phone}
              placeholder="شماره موبایل در دسترس نیست"
              disabled
            />
          </FormField>
          <FormField id="name" label="نام" error={error}>
            <div className="flex items-center gap-2">
              <Input
                id="name"
                name="name"
                className={`${fieldClassName} min-w-0 flex-1`}
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
              {dirty ? (
                <Button
                  type="submit"
                  className="h-11 shrink-0"
                  disabled={pending}
                >
                  {pending ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : null}
                  {pending ? "در حال ذخیره" : "ذخیره"}
                </Button>
              ) : null}
            </div>
          </FormField>
          {notice ? (
            <p className="text-sm text-muted-foreground" role="status">
              {notice}
            </p>
          ) : null}
        </CardContent>
      </form>
    </Card>
  )
}

function WalletEntry({ wallets }: { wallets: Wallet[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex w-full flex-wrap items-center gap-3">
          <CardTitle>کیف پول</CardTitle>
          {wallets.length > 0 ? (
            <div className="ms-auto flex flex-wrap items-center gap-3">
              {wallets.map((wallet) => (
                <span key={wallet.teamId} className="text-sm font-medium">
                  {formatToman(wallet.availableBalance)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </CardHeader>
      {wallets.length === 0 ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">هنوز کیف پولی ندارید.</p>
        </CardContent>
      ) : null}
      <CardFooter>
        <Button
          nativeButton={false}
          render={<Link href="/wallet" />}
          className="h-11 w-full sm:w-auto"
        >
          مشاهده کیف پول
        </Button>
      </CardFooter>
    </Card>
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

function AccountError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>حساب بارگذاری نشد</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      {onRetry ? (
        <CardFooter>
          <Button className="h-11" onClick={onRetry}>
            تلاش دوباره
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}

/** Asks for confirmation, then clears the session and returns to login. */
function SignOutButton({ preview = false }: { preview?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  useBlockUnload(pending)

  function closeConfirm() {
    if (pending) {
      return
    }

    setOpen(false)
    setError("")
  }

  async function signOut() {
    if (pending) {
      return
    }

    if (preview) {
      closeConfirm()
      return
    }

    setPending(true)
    setError("")

    try {
      await requestSignOut()
      signOutAccount()
      router.replace("/login")
    } catch {
      setError("خروج انجام نشد. دوباره تلاش کنید.")
      setPending(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-fit self-start"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        خروج از حساب کاربری
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) {
            setOpen(true)
            return
          }
          closeConfirm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>خروج از حساب کاربری</DialogTitle>
            <DialogDescription>
              اگر می‌خواهید خارج شوید بر روی خروج بزنید.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter className="flex-col sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              disabled={pending}
              onClick={closeConfirm}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11 w-full sm:w-auto"
              disabled={pending}
              onClick={() => {
                void signOut()
              }}
            >
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              {pending ? "در حال خروج" : "خروج"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Warns before refresh or close while sign-out is in progress. */
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
