import type { ReactNode } from "react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"

type FormFieldProps = {
  id: string
  label: string
  children: ReactNode
  error?: string
  hint?: string
}

/** Label, control, and optional hint or error for one field. */
export function FormField({
  id,
  label,
  children,
  error = "",
  hint = "",
}: FormFieldProps) {
  const invalid = error.length > 0
  const describedBy = invalid ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div aria-describedby={describedBy}>{children}</div>
      {hint ? (
        <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>
      ) : null}
      {invalid ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  )
}
