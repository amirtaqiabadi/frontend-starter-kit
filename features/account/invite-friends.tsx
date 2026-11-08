"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { CopyIcon, Share2Icon } from "lucide-react"

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
import { inviteUrl } from "@/features/account/invite-code"
import { fetchAuthToken, isLoginApiError } from "@/features/login/login-api"
import { loginPath } from "@/features/login/redirect-path"

const fieldClassName = "h-11 text-base md:text-base"

type InviteFriendsProps = {
  code?: string
}

/** Invite code, copyable link, and the system share sheet. */
export function InviteFriends({ code }: InviteFriendsProps) {
  if (code) {
    return <InviteCard code={code} />
  }

  return <StoredInvite />
}

function StoredInvite() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchAuthToken()
      .then((token) => {
        if (!cancelled) {
          setCode(token)
          setError("")
        }
      })
      .catch((reason) => {
        if (cancelled) {
          return
        }
        if (isLoginApiError(reason) && reason.code === "UNAUTHORIZED") {
          router.replace(loginPath("/account"))
          return
        }
        setError(
          isLoginApiError(reason)
            ? reason.message
            : "کد دعوت بارگذاری نشد. دوباره تلاش کنید."
        )
      })

    return () => {
      cancelled = true
    }
  }, [nonce, router])

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>دعوت دوستان</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className="h-11"
            onClick={() => {
              setError("")
              setCode("")
              setNonce((value) => value + 1)
            }}
          >
            تلاش دوباره
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (!code) {
    return <Skeleton className="h-64" />
  }

  return <InviteCard code={code} />
}

function InviteCard({ code }: { code: string }) {
  const origin = useSyncExternalStore(subscribeOrigin, readOrigin, emptyOrigin)
  const link = inviteUrl(origin, code)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const lock = useRef(false)

  async function copy(value: string, success: string) {
    if (lock.current) {
      return
    }

    lock.current = true
    setError("")

    try {
      await writeClipboard(value)
      setNotice(success)
    } catch {
      setNotice("")
      setError("کپی انجام نشد. دوباره تلاش کنید.")
    } finally {
      lock.current = false
    }
  }

  async function share() {
    if (lock.current) {
      return
    }

    lock.current = true
    setError("")
    const url = absoluteInviteLink(link, code)

    try {
      if (navigator.share) {
        await navigator.share({
          title: "دعوت دوستان",
          text: `با کد ${code} عضو شو.`,
          url,
        })
        setNotice("")
        return
      }

      await writeClipboard(url)
      setNotice("اشتراک‌گذاری در این مرورگر نیست. لینک کپی شد.")
    } catch (reason) {
      if (isShareCancel(reason)) {
        return
      }

      setNotice("")
      setError("اشتراک‌گذاری انجام نشد. دوباره تلاش کنید.")
    } finally {
      lock.current = false
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>دعوت دوستان</CardTitle>
        <CardDescription>
          کد یا لینک را برای دوستانتان بفرستید تا با آن وارد شوند.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormField id="invite-code" label="کد دعوت">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="invite-code"
              readOnly
              dir="ltr"
              className={fieldClassName}
              value={code}
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full shrink-0 sm:w-auto"
              onClick={() => {
                void copy(code, "کد کپی شد.")
              }}
            >
              <CopyIcon />
              کپی کد
            </Button>
          </div>
        </FormField>
        <FormField id="invite-link" label="لینک دعوت">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <a
              id="invite-link"
              href={link}
              dir="ltr"
              className="flex min-h-11 w-full items-center rounded-lg border border-input px-2.5 py-2 text-base break-all"
            >
              {link}
            </a>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full shrink-0 sm:w-auto"
              onClick={() => {
                void copy(absoluteInviteLink(link, code), "لینک کپی شد.")
              }}
            >
              <CopyIcon />
              کپی لینک
            </Button>
          </div>
        </FormField>
        {notice ? (
          <p className="text-sm text-muted-foreground" role="status">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="h-11 w-full sm:w-auto"
          onClick={() => {
            void share()
          }}
        >
          <Share2Icon />
          اشتراک‌گذاری لینک
        </Button>
      </CardFooter>
    </Card>
  )
}

/** Copies text from the current user gesture. */
async function writeClipboard(value: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("clipboard unavailable")
  }

  await navigator.clipboard.writeText(value)
}

/** Uses the live origin so a copied link is absolute after hydration. */
function absoluteInviteLink(value: string, code: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value
  }

  if (typeof window === "undefined") {
    return value
  }

  return inviteUrl(window.location.origin, code)
}

/** Ignores the share sheet being closed without sending. */
function isShareCancel(reason: unknown) {
  return reason instanceof DOMException && reason.name === "AbortError"
}

function subscribeOrigin() {
  return () => {}
}

function readOrigin() {
  return window.location.origin
}

function emptyOrigin() {
  return ""
}
