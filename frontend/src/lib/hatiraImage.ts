/** Client-side resize/compress before Hatıra upload to keep storage light. */

const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.72;
const SKIP_IF_UNDER_BYTES = 350_000;

function baseName(fileName: string): string {
  const trimmed = fileName.trim() || "photo";
  const withoutExt = trimmed.replace(/\.[^.]+$/, "");
  return withoutExt || "photo";
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Fallback for browsers that fail createImageBitmap on some formats.
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Görsel okunamadı."));
        el.src = url;
      });
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Sıkıştırma başarısız."));
        else resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Downscales long edge to MAX_EDGE_PX and encodes as JPEG.
 * Small files already under SKIP_IF_UNDER_BYTES are left as-is when already JPEG.
 */
export async function resizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") && file.type !== "") {
    throw new Error("Sadece görsel dosyalar yüklenebilir.");
  }

  // Tiny JPEGs: no need to re-encode.
  if (
    file.size <= SKIP_IF_UNDER_BYTES &&
    (file.type === "image/jpeg" || file.type === "image/jpg")
  ) {
    return file;
  }

  const bitmap = await loadBitmap(file);
  try {
    const { width, height } = bitmap;
    if (width <= 0 || height <= 0) {
      throw new Error("Geçersiz görsel boyutu.");
    }

    const scale = Math.min(1, MAX_EDGE_PX / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas desteklenmiyor.");

    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    let blob = await canvasToJpegBlob(canvas, JPEG_QUALITY);

    // If still large (rare), nudge quality down once.
    if (blob.size > 1_200_000) {
      blob = await canvasToJpegBlob(canvas, 0.58);
    }

    // Prefer original when re-encode somehow grew a small JPEG.
    if (
      blob.size >= file.size &&
      (file.type === "image/jpeg" || file.type === "image/jpg")
    ) {
      return file;
    }

    return new File([blob], `${baseName(file.name)}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

export async function resizeImagesForUpload(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const file of files) {
    out.push(await resizeImageForUpload(file));
  }
  return out;
}
