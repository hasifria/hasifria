import { prisma } from "./db";

/** Trim, drop niqqud/punctuation, collapse whitespace, lowercase. Works for Hebrew and Latin text. */
export function normalizeBookText(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // niqqud / accents
    .replace(/[^\p{L}\p{N}\s]/gu, "") // punctuation, quotes, geresh, etc.
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function longestWord(normalized: string): string {
  return normalized.split(" ").reduce((a, b) => (b.length > a.length ? b : a), "");
}

/**
 * Finds an existing book whose normalized title AND author equal the given ones.
 * Narrows candidates in SQL by the longest word of the title/author, then compares in JS.
 */
export async function findMatchingBook(title: string, author: string) {
  const nTitle = normalizeBookText(title);
  const nAuthor = normalizeBookText(author);
  if (!nTitle || !nAuthor) return null;

  const titleWord = longestWord(nTitle);
  const authorWord = longestWord(nAuthor);

  const candidates = await prisma.book.findMany({
    where: {
      OR: [
        { title: { contains: titleWord, mode: "insensitive" } },
        { author: { contains: authorWord, mode: "insensitive" } },
      ],
    },
    select: { id: true, isbn: true, title: true, author: true, cover_image: true },
    take: 200,
  });

  return (
    candidates.find(
      (b) => normalizeBookText(b.title) === nTitle && normalizeBookText(b.author) === nAuthor
    ) ?? null
  );
}
