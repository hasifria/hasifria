import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export function isBase64Image(s: string): boolean {
  return s.startsWith("data:image/");
}

function makePublicId(isbn?: string | null, title?: string | null): string {
  if (isbn) {
    // Strip non-digits for clean ISBN filename
    return `books/${isbn.replace(/\D/g, "")}`;
  }
  const slug = title
    ? title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "").slice(0, 50)
    : "cover";
  return `books/${slug}-${Date.now()}`;
}

export async function uploadBookCover(
  imageData: string,
  opts: { isbn?: string | null; title?: string | null } = {}
): Promise<string> {
  const result = await cloudinary.uploader.upload(imageData, {
    public_id: makePublicId(opts.isbn, opts.title),
    overwrite: true,
    resource_type: "image",
  });
  return result.secure_url;
}
