"use client";

import { useState, useEffect } from "react";

type Book = {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  cover_image: string | null;
  cover_alt: string | null;
  _count: { listings: number };
};

type EditValues = {
  title: string;
  author: string;
  isbn: string;
  cover_image: string;
  cover_alt: string;
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({ title: "", author: "", isbn: "", cover_image: "", cover_alt: "" });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/books")
      .then((r) => r.json())
      .then((data) => { setBooks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const startEdit = (book: Book) => {
    setEditingId(book.id);
    setEditValues({
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? "",
      cover_image: book.cover_image ?? "",
      cover_alt: book.cover_alt ?? "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/books/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editValues.title,
          author: editValues.author,
          isbn: editValues.isbn || null,
          cover_image: editValues.cover_image || null,
          cover_alt: editValues.cover_alt || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBooks((prev) => prev.map((b) => b.id === editingId ? { ...b, ...updated } : b));
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async (id: string, title: string) => {
    if (!window.confirm(`למחוק את "${title}"? פעולה זו תמחק גם את כל המודעות שלו.`)) return;
    const res = await fetch(`/api/admin/books/${id}`, { method: "DELETE" });
    if (res.ok) setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const set = (field: keyof EditValues, val: string) =>
    setEditValues((v) => ({ ...v, [field]: val }));

  const visible = filter
    ? books.filter((b) =>
        b.title.toLowerCase().includes(filter.toLowerCase()) ||
        b.author.toLowerCase().includes(filter.toLowerCase()) ||
        (b.isbn ?? "").includes(filter)
      )
    : books;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F0F0F0]">ספרים ({books.length})</h1>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="חפש לפי שם, סופר, ISBN..."
          className="px-4 py-2 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-sm w-72"
        />
      </div>

      {loading ? (
        <div className="text-[#555] text-sm">טוען...</div>
      ) : (
        <div className="space-y-2">
          {visible.map((book) => (
            <div key={book.id} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl overflow-hidden">
              {/* Row */}
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-[#2a2a2a] flex items-center justify-center border border-[#3a3a3a]">
                  {book.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.cover_image}
                      alt={book.cover_alt || `${book.title} מאת ${book.author}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg opacity-30">📕</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#F0F0F0] text-sm truncate">{book.title}</p>
                  <p className="text-xs text-[#888] truncate">{book.author}</p>
                  <p className="text-xs text-[#555] mt-0.5">
                    {book.isbn ? `ISBN: ${book.isbn} · ` : ""}
                    {book._count.listings} מודעות
                    {book.cover_image && !book.cover_alt && (
                      <span className="text-amber-600 mr-2">· חסר alt text</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => editingId === book.id ? setEditingId(null) : startEdit(book)}
                    className="px-3 py-1.5 text-xs font-medium border border-[#3a3a3a] hover:border-[#F5A623] text-[#888] hover:text-[#F5A623] rounded-lg transition-colors"
                  >
                    {editingId === book.id ? "ביטול" : "ערוך"}
                  </button>
                  <button
                    onClick={() => deleteBook(book.id, book.title)}
                    className="px-3 py-1.5 text-xs font-medium border border-[#3a3a3a] hover:border-red-700 text-[#888] hover:text-red-400 rounded-lg transition-colors"
                  >
                    מחק
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === book.id && (
                <div className="border-t border-[#2a2a2a] p-4 bg-[#141414] space-y-4">
                  {/* Cover preview + alt text */}
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center">
                      {editValues.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={editValues.cover_image}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                        />
                      ) : (
                        <span className="text-2xl opacity-20">📕</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-[#555] mb-1">
                        תיאור תמונה (alt text) — לנגישות ו-SEO
                      </label>
                      <input
                        type="text"
                        value={editValues.cover_alt}
                        onChange={(e) => set("cover_alt", e.target.value)}
                        placeholder={`${editValues.title || book.title} מאת ${editValues.author || book.author} — ספר יד שנייה`}
                        className="w-full px-3 py-2 rounded-lg border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-sm"
                        dir="rtl"
                      />
                      <p className="text-xs text-[#555] mt-1">
                        ריק = יווצר אוטומטית: &ldquo;{editValues.title || book.title} מאת {editValues.author || book.author} — ספר יד שנייה&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Other fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(["title", "author", "isbn", "cover_image"] as const).map((field) => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-[#555] mb-1">
                          {field === "title" ? "שם ספר" : field === "author" ? "סופר" : field === "isbn" ? "ISBN" : "כתובת תמונה (URL)"}
                        </label>
                        <input
                          type="text"
                          value={editValues[field]}
                          onChange={(e) => set(field, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="px-5 py-2 bg-[#F5A623] hover:bg-[#e0941a] disabled:opacity-60 text-black text-sm font-bold rounded-xl transition-colors"
                  >
                    {saving ? "שומר..." : "שמור"}
                  </button>
                </div>
              )}
            </div>
          ))}
          {visible.length === 0 && !loading && (
            <p className="text-center text-[#555] py-10 text-sm">לא נמצאו ספרים</p>
          )}
        </div>
      )}
    </div>
  );
}
