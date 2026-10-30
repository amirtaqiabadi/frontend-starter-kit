"use client"

import Image from "next/image"

import { FormField } from "@/components/molecules/form-field"
import { Input } from "@/components/ui/input"
import { toAsciiDigits } from "@/lib/digits"
import { cardCaretIndex, formatCardInput } from "@/features/account/card"
import { bankLogoSrc, resolveBankByCard } from "@/features/account/iran-bank"

const fieldClassName = "h-11 text-base"

type CardNumberFieldProps = {
  id?: string
  value: string
  error?: string
  onChange: (value: string) => void
}

/** Card number field with the issuing bank logo on the left. */
export function CardNumberField({
  id = "card-number",
  value,
  error = "",
  onChange,
}: CardNumberFieldProps) {
  const bank = resolveBankByCard(value)
  const describedBy = error ? `${id}-error` : undefined

  function onCardChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const caret = input.selectionStart ?? input.value.length
    const digitsBeforeCaret = toAsciiDigits(
      input.value.slice(0, caret)
    ).replace(/\D/g, "").length
    const next = formatCardInput(input.value)
    onChange(next)
    const nextCaret = cardCaretIndex(next, digitsBeforeCaret)
    window.requestAnimationFrame(() => {
      input.setSelectionRange(nextCaret, nextCaret)
    })
  }

  return (
    <FormField id={id} label="شماره کارت" error={error}>
      <div className="relative" dir="ltr">
        <Input
          id={id}
          name="cc-number"
          className={bank ? `${fieldClassName} ps-11` : fieldClassName}
          dir="ltr"
          inputMode="numeric"
          autoComplete="cc-number"
          value={value}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          placeholder="۶۰۳۷ ۹۹۱۹ ۱۲۳۴ ۵۶۷۸"
          onChange={onCardChange}
        />
        {bank ? (
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5">
            <Image
              src={bankLogoSrc(bank.logoFile)}
              alt={bank.nameFa}
              width={24}
              height={24}
              className="size-6 object-contain"
            />
          </span>
        ) : null}
      </div>
    </FormField>
  )
}
