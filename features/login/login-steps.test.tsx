import type { FormEvent } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { OtpStep } from "@/features/login/login-steps"
import type { OtpChannel } from "@/features/login/login-api"

function renderOtp({
  error = "",
  pending = false,
  otp = "12345",
  resendIn = 0,
  devCode = "",
  onResend = vi.fn(),
  onSubmit = (event: FormEvent<HTMLFormElement>) => event.preventDefault(),
}: {
  error?: string
  pending?: boolean
  otp?: string
  resendIn?: number
  devCode?: string
  onResend?: (channel: OtpChannel) => void
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
} = {}) {
  return render(
    <OtpStep
      phone="09123456789"
      otp={otp}
      error={error}
      pending={pending}
      lockIn={0}
      resendIn={resendIn}
      devCode={devCode}
      onOtpChange={vi.fn()}
      onSubmit={onSubmit}
      onResend={onResend}
    />
  )
}

function otpInput() {
  const input = document.getElementById("otp")
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("missing otp input")
  }

  return input
}

describe("OtpStep", () => {
  it("exposes one native input for the iOS code suggestion", () => {
    const { container } = renderOtp({ otp: "" })

    expect(
      container.querySelectorAll('input[autocomplete="one-time-code"]')
    ).toHaveLength(1)
    expect(otpInput().inputMode).toBe("numeric")
    expect(otpInput().maxLength).toBe(5)
  })

  it("selects the last digit after a rejected code", () => {
    const view = renderOtp({ pending: true })
    const input = otpInput()
    input.blur()

    view.rerender(
      <OtpStep
        phone="09123456789"
        otp="12345"
        error="کد نادرست است."
        pending={false}
        lockIn={0}
        resendIn={0}
        devCode=""
        onOtpChange={vi.fn()}
        onSubmit={(event) => event.preventDefault()}
        onResend={vi.fn()}
      />
    )

    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(4)
    expect(input.selectionEnd).toBe(5)
  })

  it("keeps confirmation available independently of the resend cooldown", () => {
    const view = renderOtp({ otp: "1", resendIn: 110 })

    expect(screen.getByRole("button", { name: "تایید کد" })).toHaveProperty(
      "disabled",
      true
    )

    view.rerender(
      <OtpStep
        phone="09123456789"
        otp=""
        error=""
        pending={false}
        lockIn={0}
        resendIn={110}
        devCode=""
        onOtpChange={vi.fn()}
        onSubmit={(event) => event.preventDefault()}
        onResend={vi.fn()}
      />
    )
    expect(screen.queryByRole("button", { name: "تایید کد" })).toBeNull()

    view.rerender(
      <OtpStep
        phone="09123456789"
        otp="12345"
        error=""
        pending={false}
        lockIn={0}
        resendIn={0}
        devCode=""
        onOtpChange={vi.fn()}
        onSubmit={(event) => event.preventDefault()}
        onResend={vi.fn()}
      />
    )
    expect(screen.getByRole("button", { name: "تایید کد" })).toHaveProperty(
      "disabled",
      false
    )
  })

  it("shows SMS and voice actions only after the timer ends", () => {
    const view = renderOtp({ otp: "", resendIn: 110 })
    const waiting = screen.getByRole("button", { name: /ارسال دوباره/ })

    expect(waiting.className).not.toContain("bg-primary")
    expect(waiting).toHaveProperty("disabled", true)
    expect(
      screen.queryByRole("button", { name: "ارسال کد با پیامک" })
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: "ارسال کد با تماس" })
    ).toBeNull()

    view.rerender(
      <OtpStep
        phone="09123456789"
        otp=""
        error=""
        pending={false}
        lockIn={0}
        resendIn={0}
        devCode=""
        onOtpChange={vi.fn()}
        onSubmit={(event) => event.preventDefault()}
        onResend={vi.fn()}
      />
    )

    expect(
      screen.getByRole("button", { name: "ارسال کد با پیامک" }).className
    ).toContain("bg-primary")
    expect(
      screen.getByRole("button", { name: "ارسال کد با تماس" }).className
    ).toContain("bg-secondary")
  })

  it("requests the channel selected by the user", () => {
    const onResend = vi.fn()
    renderOtp({ otp: "", onResend })
    fireEvent.click(screen.getByRole("button", { name: "ارسال کد با پیامک" }))
    fireEvent.click(screen.getByRole("button", { name: "ارسال کد با تماس" }))
    expect(onResend.mock.calls).toEqual([["sms"], ["voice"]])
  })

  it("disables both channels while a request is pending", () => {
    const onResend = vi.fn()
    renderOtp({ otp: "", pending: true, onResend })
    for (const name of ["ارسال کد با پیامک", "ارسال کد با تماس"]) {
      const button = screen.getByRole("button", { name })
      expect(button).toHaveProperty("disabled", true)
      fireEvent.click(button)
    }
    expect(onResend).not.toHaveBeenCalled()
  })

  it("hides the development code after the resend timer ends", () => {
    const view = renderOtp({ otp: "", devCode: "10884", resendIn: 110 })

    expect(screen.getByText("10884")).toBeTruthy()

    view.rerender(
      <OtpStep
        phone="09123456789"
        otp=""
        error=""
        pending={false}
        lockIn={0}
        resendIn={0}
        devCode="10884"
        onOtpChange={vi.fn()}
        onSubmit={(event) => event.preventDefault()}
        onResend={vi.fn()}
      />
    )

    expect(screen.queryByText("10884")).toBeNull()
  })

  it("submits a full code after the resend cooldown and still allows a manual retry", () => {
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
    })

    renderOtp({ otp: "12345", resendIn: 0, onSubmit })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    fireEvent.submit(otpInput().closest("form")!)
    expect(onSubmit).toHaveBeenCalledTimes(2)
  })

  it("keeps a code usable when the cooldown ends without automatically submitting it again", () => {
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
    })
    const onResend = vi.fn()
    const props = {
      phone: "09123456789",
      otp: "12345",
      error: "",
      pending: false,
      lockIn: 0,
      devCode: "",
      onOtpChange: vi.fn(),
      onSubmit,
      onResend,
    }
    const view = render(<OtpStep {...props} resendIn={1} />)
    expect(onSubmit).toHaveBeenCalledTimes(1)

    view.rerender(<OtpStep {...props} resendIn={0} />)

    const confirm = screen.getByRole("button", { name: "تایید کد" })
    expect(confirm).toHaveProperty("disabled", false)
    expect(otpInput().value).toBe("12345")
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onResend).not.toHaveBeenCalled()

    fireEvent.click(confirm)
    expect(onSubmit).toHaveBeenCalledTimes(2)
  })

  it("leaves focus alone while the attempt is still running", () => {
    renderOtp({ pending: true, error: "کد نادرست است." })
    const input = otpInput()

    expect(input.disabled).toBe(true)
    expect(document.activeElement).not.toBe(input)
  })
})
