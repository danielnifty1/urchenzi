import type { StoreImageInput } from "@/types/vendorStore";

export async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

/** Base64 data URL + metadata — used for images, PDFs, and other uploads the API nests under `image`. */
export async function imagePayloadFromFile(
  file: File,
  description = "upload",
): Promise<StoreImageInput> {
  const mime =
    file.type ||
    (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream");
  return {
    data: await fileToDataUrl(file),
    fileName: file.name || "file",
    mimeType: mime,
    description,
  };
}
