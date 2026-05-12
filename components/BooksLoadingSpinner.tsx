export default function BooksLoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-icon.png"
        alt=""
        aria-hidden="true"
        width={80}
        height={80}
        style={{ animation: "logo-pulse 1.4s ease-in-out infinite" }}
      />
      <p className="text-[#F5A623] text-sm font-medium">טוען ספרים...</p>
    </div>
  );
}
