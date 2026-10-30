"use client"

import { useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ImageCropDialogProps = {
  open: boolean
  imageUrl: string
  pending: boolean
  onCancel: () => void
  onConfirm: (crop: Area) => void
}

/** Square crop dialog. The mask is round; the exported image stays square. */
export function ImageCropDialog({
  open,
  imageUrl,
  pending,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pixels, setPixels] = useState<Area | null>(null)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) {
          onCancel()
        }
      }}
    >
      <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>برش تصویر</DialogTitle>
          <DialogDescription>
            ناحیه را جابه‌جا یا بزرگ کنید. پیش‌نمایش دایره است و فایل نهایی مربع
            می‌ماند.
          </DialogDescription>
        </DialogHeader>
        <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted sm:h-80">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_area, croppedPixels) => {
              setPixels(croppedPixels)
            }}
          />
        </div>
        <label className="flex flex-col gap-2 text-sm" htmlFor="avatar-zoom">
          بزرگ‌نمایی
          <input
            id="avatar-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            disabled={pending}
            dir="ltr"
            className="h-11 w-full cursor-pointer accent-primary"
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        <DialogFooter className="flex-col sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={pending}
            onClick={onCancel}
          >
            انصراف
          </Button>
          <Button
            type="button"
            className="h-11"
            disabled={pending || pixels === null}
            onClick={() => {
              if (pixels) {
                onConfirm(pixels)
              }
            }}
          >
            {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
            تأیید
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
