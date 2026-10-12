import { request } from "@/lib/api";
export async function uploadImage(image: File) {
  if (image.size > 5 * 1024 * 1024)
    throw new Error("Image must be 5MB or smaller");
  const extensions: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
  };
  if (
    !extensions[image.type]?.includes(
      image.name.split(".").pop()?.toLowerCase() || "",
    )
  )
    throw new Error("Supported image formats are jpg, jpeg, png and webp");
  const body = new FormData();
  body.append("image", image);
  const result = await request<{ url: string }>("/api/admin/upload-image", {
    method: "POST",
    body,
  });
  if (!result.url) throw new Error("Upload response was missing the image URL");
  return result;
}
