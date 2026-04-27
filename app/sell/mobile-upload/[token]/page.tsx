import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import UploadForm from "./UploadForm";

const TOKEN_TTL_MS = 10 * 60 * 1000;

export default async function MobileUploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const upload = await prisma.coverUpload.findUnique({ where: { token } });
  if (!upload) notFound();
  if (Date.now() - upload.created_at.getTime() > TOKEN_TTL_MS) notFound();

  return <UploadForm token={token} />;
}
