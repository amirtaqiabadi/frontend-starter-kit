import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { FormField } from "@/components/molecules/form-field"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const meta = {
  title: "Atoms/FormControls",
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Validation: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <FormField id="story-name" label="نام" hint="نام و نام خانوادگی">
        <Input id="story-name" placeholder="مثلاً سارا احمدی" />
      </FormField>
      <FormField
        id="story-email"
        label="ایمیل"
        error="ایمیل را کامل وارد کنید."
      >
        <Input
          id="story-email"
          type="email"
          dir="ltr"
          defaultValue="sara@"
          aria-invalid
          className="text-left"
          placeholder="name@example.com"
        />
      </FormField>
      <FormField id="story-city" label="شهر">
        <Select
          defaultValue="tehran"
          items={{ tehran: "تهران", isfahan: "اصفهان" }}
        >
          <SelectTrigger id="story-city" className="w-full">
            <SelectValue placeholder="شهر را انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tehran">تهران</SelectItem>
            <SelectItem value="isfahan">اصفهان</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField id="story-note" label="توضیح">
        <Textarea id="story-note" placeholder="یادداشت کوتاه" />
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox defaultChecked />
        خبرنامه را می‌خواهم
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Switch />
        اعلان‌ها فعال باشد
      </label>
    </div>
  ),
}
