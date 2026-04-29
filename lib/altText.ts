export function bookAltText(book: { title: string; author: string; cover_alt?: string | null }): string {
  return book.cover_alt || `${book.title} מאת ${book.author} — ספר יד שנייה`;
}
