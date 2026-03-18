/**
 * Resize and compress an image file to a square WebP data URL.
 * - Center-crops to square (no stretching)
 * - Resizes to maxSize × maxSize
 * - Compresses as WebP at given quality
 */
export function resizeImage(file: File, maxSize = 200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement("canvas")
      canvas.width = maxSize
      canvas.height = maxSize

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      // Center-crop to square
      const srcSize = Math.min(img.width, img.height)
      const srcX = (img.width - srcSize) / 2
      const srcY = (img.height - srcSize) / 2

      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, maxSize, maxSize)

      resolve(canvas.toDataURL("image/webp", quality))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}
