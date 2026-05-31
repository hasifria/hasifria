export function titleToSlug(title: string): string {
  return title.replace(/\s+/g, '-');
}

export function slugToTitle(slug: string): string {
  return slug.replace(/-/g, ' ');
}

export function isBookId(str: string): boolean {
  return /^[a-zA-Z0-9]{15,}$/.test(str);
}
