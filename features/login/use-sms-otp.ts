import { useCallback, useEffect, useRef } from "react"

import { OTP_LENGTH, toAsciiDigits } from "@/features/login/phone"

type SmsCredential = Credential & { code: string }
type SmsCredentialOptions = CredentialRequestOptions & {
  otp: { transport: ["sms"] }
}

/** Starts listening before the SMS request; unsupported browsers keep manual entry. */
export function useSmsOtp(onCode: (code: string) => void) {
  const requestRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stop = useCallback(() => {
    requestRef.current?.abort()
    requestRef.current = null
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (
      requestRef.current ||
      !window.isSecureContext ||
      !("OTPCredential" in window) ||
      !navigator.credentials?.get
    ) {
      return
    }

    const controller = new AbortController()
    requestRef.current = controller
    timerRef.current = setTimeout(stop, 180_000)

    const options: SmsCredentialOptions = {
      otp: { transport: ["sms"] },
      signal: controller.signal,
    }

    void (async () => {
      try {
        const credential = (await navigator.credentials.get(
          options
        )) as SmsCredential | null
        if (controller.signal.aborted || !credential?.code) return

        const code = toAsciiDigits(credential.code)
        if (new RegExp(`^[0-9]{${OTP_LENGTH}}$`).test(code)) {
          onCode(code)
        }
      } catch {
        // Dismissal, timeout, or browser policy leaves manual entry available.
      } finally {
        if (requestRef.current === controller) stop()
      }
    })()
  }, [onCode, stop])

  useEffect(() => stop, [stop])

  return { start, stop }
}
