import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useSmsOtp } from "@/features/login/use-sms-otp"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function mockWebOtp() {
  const get = vi.fn<(options: CredentialRequestOptions) => Promise<unknown>>()
  vi.stubGlobal("isSecureContext", true)
  vi.stubGlobal("OTPCredential", class {})
  Object.defineProperty(navigator, "credentials", {
    configurable: true,
    value: { get },
  })
  return get
}

describe("useSmsOtp", () => {
  it("delivers the complete SMS code to React state", async () => {
    const get = mockWebOtp().mockResolvedValue({ code: "۰۱۲۳۴" })
    const onCode = vi.fn()
    const { result } = renderHook(() => useSmsOtp(onCode))

    await act(async () => result.current.start())

    expect(get).toHaveBeenCalledWith({
      otp: { transport: ["sms"] },
      signal: expect.any(AbortSignal),
    })
    expect(onCode).toHaveBeenCalledWith("01234")
  })

  it("ignores a late result from an aborted request after resend", async () => {
    let receiveOld!: (value: unknown) => void
    const get = mockWebOtp()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            receiveOld = resolve
          })
      )
      .mockResolvedValueOnce({ code: "72132" })
    const onCode = vi.fn()
    const { result } = renderHook(() => useSmsOtp(onCode))

    act(() => result.current.start())
    const oldSignal = get.mock.calls[0][0].signal!
    await act(async () => {
      result.current.stop()
      result.current.start()
      receiveOld({ code: "12345" })
    })

    expect(oldSignal.aborted).toBe(true)
    expect(onCode).toHaveBeenCalledExactlyOnceWith("72132")
  })

  it("aborts listening on unmount and after the code lifetime", () => {
    vi.useFakeTimers()
    const get = mockWebOtp().mockImplementation(() => new Promise(() => {}))
    const { result, unmount } = renderHook(() => useSmsOtp(vi.fn()))

    act(() => result.current.start())
    const firstSignal = get.mock.calls[0][0].signal!
    act(() => vi.advanceTimersByTime(180_000))
    expect(firstSignal.aborted).toBe(true)

    act(() => result.current.start())
    const secondSignal = get.mock.calls[1][0].signal!
    unmount()
    expect(secondSignal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("silently falls back when consent is declined or the code is invalid", async () => {
    mockWebOtp()
      .mockRejectedValueOnce(new DOMException("Denied", "NotAllowedError"))
      .mockResolvedValueOnce({ code: "123456" })
    const onCode = vi.fn()
    const { result } = renderHook(() => useSmsOtp(onCode))

    await act(async () => result.current.start())
    await act(async () => result.current.start())

    expect(onCode).not.toHaveBeenCalled()
  })

  it("does not request credentials on an insecure origin", () => {
    const get = mockWebOtp()
    vi.stubGlobal("isSecureContext", false)
    const { result } = renderHook(() => useSmsOtp(vi.fn()))

    act(() => result.current.start())

    expect(get).not.toHaveBeenCalled()
  })
})
