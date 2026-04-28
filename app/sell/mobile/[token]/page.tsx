import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import MobileListing from "./MobileListing";

const TOKEN_TTL_MS = 30 * 60 * 1000;

export default async function MobileListingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = await prisma.mobileListingSession.findUnique({ where: { token } });
  if (!record) notFound();
  if (Date.now() - record.created_at.getTime() > TOKEN_TTL_MS) notFound();

  return <MobileListing token={token} />;
}
