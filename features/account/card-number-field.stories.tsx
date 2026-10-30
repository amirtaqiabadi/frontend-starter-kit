import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

import { formatCardInput } from "./card"
import { CardNumberField } from "./card-number-field"

const meta = {
  title: "Features/Account/CardNumber",
  component: CardNumberField,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof CardNumberField>

export default meta

type Story = StoryObj<typeof meta>

/** Keeps one card field's typed value inside the story. */
function FieldPreview({ id, value }: { id: string; value: string }) {
  const [cardNumber, setCardNumber] = useState(value)

  return <CardNumberField id={id} value={cardNumber} onChange={setCardNumber} />
}

export const Banks: Story = {
  args: {
    value: "",
    onChange: () => {},
  },
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <FieldPreview id="card-empty" value="" />
      <FieldPreview id="card-saman" value={formatCardInput("621986")} />
      <FieldPreview id="card-blu" value={formatCardInput("6219861912762001")} />
      <FieldPreview
        id="card-melli"
        value={formatCardInput("6037991912345678")}
      />
    </div>
  ),
}
