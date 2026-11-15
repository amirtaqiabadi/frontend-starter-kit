import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { InviteFriends } from "./invite-friends"

const meta = {
  title: "Features/InviteFriends",
  component: InviteFriends,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof InviteFriends>

export default meta

type Story = StoryObj<typeof meta>

export const Ready: Story = {
  args: {
    code: "A2C46",
  },
  parameters: {
    docs: {
      description: {
        story:
          "فقط لینک دعوت، کپی لینک و اشتراک‌گذاری دیده می‌شود. توضیح کارت می‌گوید لینک را برای دوستان ارسال کنید.",
      },
    },
  },
}
