import { Header } from "@/components/Header";
import BooksLoadingSpinner from "@/components/BooksLoadingSpinner";

export default function SearchLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />
      <div className="bg-[#141414] border-b border-[#2a2a2a] sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="flex-1 h-9 bg-[#1e1e1e] rounded-xl animate-pulse" />
            <div className="w-40 h-9 bg-[#1e1e1e] rounded-xl animate-pulse" />
            <div className="w-20 h-9 bg-[#2a2a2a] rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <BooksLoadingSpinner />
        </div>
      </main>
    </div>
  );
}
