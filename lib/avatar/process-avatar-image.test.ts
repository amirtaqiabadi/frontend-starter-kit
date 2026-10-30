import { afterEach, describe, expect, it, vi } from "vitest"

import { avatarMessages } from "@/lib/avatar/messages"
import { processAvatarImage } from "@/lib/avatar/process-avatar-image"

const formats = ["jpeg", "png", "webp", "heic", "heif"] as const

describe("processAvatarImage", () => {
  const operations: string[] = []
  const drawImage = vi.fn()
  const originalToBlob = HTMLCanvasElement.prototype.toBlob
  let canvasSize = { width: 0, height: 0 }
  let blobBytes = 4 * 1024

  afterEach(() => {
    vi.restoreAllMocks()
    HTMLCanvasElement.prototype.toBlob = originalToBlob
    operations.length = 0
    drawImage.mockClear()
    blobBytes = 4 * 1024
  })

  function installCanvas() {
    const context = {
      fillStyle: "",
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low" as ImageSmoothingQuality,
      fillRect: vi.fn(() => {
        operations.push(`fill:${context.fillStyle}`)
      }),
      drawImage,
    }

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => context as unknown as CanvasRenderingContext2D
    )
    HTMLCanvasElement.prototype.toBlob = function (callback, type) {
      canvasSize = { width: this.width, height: this.height }
      callback?.(new Blob([new Uint8Array(blobBytes)], { type }))
    }
  }

  it.each(formats)(
    "exports a 512×512 WebP from a decoded %s image",
    async () => {
      installCanvas()
      const source = { width: 1200, height: 800 } as CanvasImageSource
      const file = await processAvatarImage({
        source,
        crop: { x: 10, y: 20, width: 400, height: 400 },
      })

      expect(canvasSize).toEqual({ width: 512, height: 512 })
      expect(operations[0]).toBe("fill:#ffffff")
      expect(drawImage).toHaveBeenCalledWith(
        source,
        10,
        20,
        400,
        400,
        0,
        0,
        512,
        512
      )
      expect(file.type).toBe("image/webp")
      expect(file.name.endsWith(".webp")).toBe(true)
      expect(file.size).toBeLessThanOrEqual(200 * 1024)
    }
  )

  it("refuses a file that stays above 200 KB at minimum quality", async () => {
    blobBytes = 300 * 1024
    installCanvas()

    await expect(
      processAvatarImage({
        source: {} as CanvasImageSource,
        crop: { x: 0, y: 0, width: 10, height: 10 },
      })
    ).rejects.toThrow(avatarMessages.outputTooLarge(200))
  })
})
