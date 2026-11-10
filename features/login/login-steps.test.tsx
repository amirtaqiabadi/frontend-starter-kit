import type { FormEvent } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { OtpStep } from "@/features/login/login-steps"

function renderOtp({
  error = "",
  pending = false,
  otp = "12345",
  resendIn = 0,
  devCode = "",
  onSubmit = (event: FormEvent<HTMLFormElement>) => event.preventDefault(),
}: {
  error?: string
  pending?: boolean
  otp?: string
  resendIn?: number
  devCode?: string
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
      onResend={vi.fn()}
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

  it("shows confirm only while a digit is entered and the resend timer is running", () => {
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
    expect(screen.queryByRole("button", { name: "تایید کد" })).toBeNull()
  })

  it("makes resend the primary action after the timer ends", () => {
    const view = renderOtp({ otp: "", resendIn: 110 })
    const waiting = screen.getByRole("button", { name: /ارسال دوباره/ })

    expect(waiting.className).not.toContain("bg-primary")

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
      screen.getByRole("button", { name: "ارسال دوباره" }).className
    ).toContain("bg-primary")
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

  it("does not submit a full code after the resend timer ends", () => {
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
    })

    renderOtp({ otp: "12345", resendIn: 0, onSubmit })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("leaves focus alone while the attempt is still running", () => {
    renderOtp({ pending: true, error: "کد نادرست است." })
    const input = otpInput()

    expect(input.disabled).toBe(true)
    expect(document.activeElement).not.toBe(input)
  })
})
