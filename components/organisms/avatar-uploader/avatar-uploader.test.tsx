import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AvatarUploader } from "@/components/organisms/avatar-uploader/avatar-uploader"
import { decodeImageFile } from "@/lib/avatar/decode-image-file"
import { avatarMessages } from "@/lib/avatar/messages"

vi.mock("react-easy-crop", async () => {
  const React = await import("react")

  function MockCropper({
    aspect,
    zoom,
    crop,
    cropShape,
    onCropChange,
    onCropComplete,
  }: {
    aspect: number
    zoom: number
    crop: { x: number; y: number }
    cropShape: string
    onCropChange: (crop: { x: number; y: number }) => void
    onCropComplete?: (
      area: { x: number; y: number; width: number; height: number },
      pixels: { x: number; y: number; width: number; height: number }
    ) => void
  }) {
    const reported = React.useRef(false)
    React.useEffect(() => {
      if (reported.current) {
        return
      }
      reported.current = true
      onCropComplete?.(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 4, y: 6, width: 80, height: 80 }
      )
    }, [onCropComplete])

    return React.createElement("div", {
      "data-testid": "cropper",
      "data-aspect": String(aspect),
      "data-zoom": String(zoom),
      "data-crop-x": String(crop.x),
      "data-crop-shape": cropShape,
      onPointerDown: () => onCropChange({ x: crop.x + 12, y: 8 }),
      onTouchStart: (event: { currentTarget: HTMLDivElement }) => {
        event.currentTarget.dataset.touch = "received"
      },
    })
  }

  return { default: MockCropper }
})

vi.mock("@/lib/avatar/decode-image-file", () => ({
  decodeImageFile: vi.fn(),
}))

const decode = vi.mocked(decodeImageFile)
const EXISTING = "data:image/webp;base64,AAAA"
const originalToBlob = HTMLCanvasElement.prototype.toBlob
let blobBytes = 145 * 1024

/** JPEG header so validation accepts the selected file. */
function jpegFile(name = "photo.jpg", type = "image/jpeg") {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], name, { type })
}

/** Opens the crop dialog with a validated file. */
async function chooseFile(file = jpegFile()) {
  fireEvent.change(screen.getByLabelText("تصویر حساب"), {
    target: { files: [file] },
  })
  expect(await screen.findByRole("dialog")).toBeTruthy()
  return screen.getByTestId("cropper")
}

describe("AvatarUploader", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    HTMLCanvasElement.prototype.toBlob = originalToBlob
  })

  beforeEach(() => {
    blobBytes = 145 * 1024
    decode.mockReset()
    decode.mockResolvedValue({
      bitmap: {
        width: 80,
        height: 80,
        close: vi.fn(),
      } as unknown as ImageBitmap,
      previewBlob: new Blob([new Uint8Array([1])], { type: "image/jpeg" }),
    })
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:avatar-preview")
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () =>
        ({
          fillStyle: "",
          imageSmoothingEnabled: true,
          imageSmoothingQuality: "high",
          fillRect: vi.fn(),
          drawImage: vi.fn(),
        }) as unknown as CanvasRenderingContext2D
    )
    HTMLCanvasElement.prototype.toBlob = function (callback, type) {
      callback?.(new Blob([new Uint8Array(blobBytes)], { type }))
    }
  })

  it("uses a square crop, zoom, and pointer or touch movement", async () => {
    render(
      <AvatarUploader value={EXISTING} onChange={vi.fn()} onRemove={vi.fn()} />
    )
    const cropper = await chooseFile()

    expect(cropper.getAttribute("data-aspect")).toBe("1")
    expect(cropper.getAttribute("data-crop-shape")).toBe("round")
    expect(cropper.style.pointerEvents).not.toBe("none")

    fireEvent.change(screen.getByLabelText("بزرگ‌نمایی"), {
      target: { value: "2" },
    })
    expect(cropper.getAttribute("data-zoom")).toBe("2")

    fireEvent.pointerDown(cropper)
    expect(cropper.getAttribute("data-crop-x")).toBe("12")

    fireEvent.touchStart(cropper)
    expect(cropper.dataset.touch).toBe("received")
  })

  it("confirms the crop with a WebP file at or below 200 KB", async () => {
    const onChange = vi.fn()
    render(
      <AvatarUploader value={EXISTING} onChange={onChange} onRemove={vi.fn()} />
    )
    await chooseFile()
    fireEvent.click(screen.getByRole("button", { name: "تأیید" }))

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    const file = onChange.mock.calls[0]?.[0] as File
    expect(file).toBeInstanceOf(File)
    expect(file.type).toBe("image/webp")
    expect(file.name.endsWith(".webp")).toBe(true)
    expect(file.size).toBeLessThanOrEqual(200 * 1024)
    expect(screen.getByRole("status").textContent).toContain("کیلوبایت")
    expect(
      screen.getByRole("img", { name: "آواتار" }).style.backgroundImage
    ).toContain(EXISTING)
  })

  it("keeps the current avatar when cropping is cancelled", async () => {
    const onChange = vi.fn()
    render(
      <AvatarUploader value={EXISTING} onChange={onChange} onRemove={vi.fn()} />
    )
    await chooseFile()
    fireEvent.click(screen.getByRole("button", { name: "انصراف" }))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(
      screen.getByRole("img", { name: "آواتار" }).style.backgroundImage
    ).toContain(EXISTING)
  })

  it("ignores a second selection while decoding is in progress", async () => {
    let resolveDecode: (
      value: Awaited<ReturnType<typeof decodeImageFile>>
    ) => void = () => {}
    decode.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDecode = resolve
        })
    )
    render(<AvatarUploader onChange={vi.fn()} onRemove={vi.fn()} />)
    const input = screen.getByLabelText("تصویر حساب")
    fireEvent.change(input, { target: { files: [jpegFile()] } })
    fireEvent.change(input, { target: { files: [jpegFile("other.jpg")] } })

    await waitFor(() => expect(decode).toHaveBeenCalledTimes(1))
    expect(screen.getByRole("button", { name: "در حال پردازش" })).toBeTruthy()
    resolveDecode({
      bitmap: { close: vi.fn(), width: 1, height: 1 } as unknown as ImageBitmap,
      previewBlob: new Blob(["x"]),
    })
    expect(await screen.findByRole("dialog")).toBeTruthy()
  })

  it("does not pass an oversized result to onChange", async () => {
    blobBytes = 300 * 1024
    const onChange = vi.fn()
    render(
      <AvatarUploader value={EXISTING} onChange={onChange} onRemove={vi.fn()} />
    )
    await chooseFile()
    fireEvent.click(screen.getByRole("button", { name: "تأیید" }))

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      avatarMessages.outputTooLarge(200)
    )
    expect(onChange).not.toHaveBeenCalled()
    expect(
      screen.getByRole("img", { name: "آواتار" }).style.backgroundImage
    ).toContain(EXISTING)
  })

  it("shows a validation error and leaves the avatar unchanged", async () => {
    const onChange = vi.fn()
    render(
      <AvatarUploader value={EXISTING} onChange={onChange} onRemove={vi.fn()} />
    )
    fireEvent.change(screen.getByLabelText("تصویر حساب"), {
      target: {
        files: [new File(["notes"], "notes.txt", { type: "text/plain" })],
      },
    })

    expect((await screen.findByRole("alert")).textContent).toBe(
      avatarMessages.unsupported
    )
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(decode).not.toHaveBeenCalled()
  })

  it("removes the avatar only through onRemove", () => {
    const onRemove = vi.fn()
    const onChange = vi.fn()
    render(
      <AvatarUploader
        value={EXISTING}
        onChange={onChange}
        onRemove={onRemove}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "حذف تصویر" }))

    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
  })
})
