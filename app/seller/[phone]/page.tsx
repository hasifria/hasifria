import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import Dashboard from "./Dashboard";

type Props = { params: Promise<{ phone: string }> };

export default async function SellerPage({ params }: Props) {
  const { phone } = await params;

  const seller = await prisma.user.findUnique({
    where: { phone },
    include: {
      listings: {
        include: { book: true },
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!seller) notFound();

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const isOwner = session.userId === seller.id;

  const serialized = {
    ...seller,
    created_at: seller.created_at.toISOString(),
    listings: seller.listings.map((l: any) => ({
      ...l,
      price: Number(l.price),
      created_at: l.created_at.toISOString(),
      book: {
        ...l.book,
        created_at: l.book.created_at.toISOString(),
      },
    })),
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Dashboard seller={serialized} isOwner={isOwner} />
    </div>
  );
}
