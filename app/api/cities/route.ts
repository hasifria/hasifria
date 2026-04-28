import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { city: true, address: true },
    });

    const citySet = new Set<string>();

    for (const u of users as any[]) {
      if (u.city?.trim()) {
        citySet.add(u.city.trim());
      }
      if (u.address?.trim()) {
        // Take the first segment before a comma as the city name
        const first = u.address.split(/[,،\-]/)[0].trim();
        if (first.length >= 2) citySet.add(first);
      }
    }

    const cities = Array.from(citySet).sort((a, b) => a.localeCompare(b, "he"));
    return Response.json(cities);
  } catch (err) {
    console.error("[cities]", err);
    return Response.json([]);
  }
}
