export default function BooksLoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <div className="flex items-end gap-3">
        {([0, 150, 300] as number[]).map((delay) => (
          <span
            key={delay}
            className="text-3xl animate-bounce select-none"
            style={{ animationDelay: `${delay}ms` }}
          >
            📚
          </span>
        ))}
      </div>
      <p className="text-[#F5A623] text-sm font-medium">טוען ספרים...</p>
    </div>
  );
}
