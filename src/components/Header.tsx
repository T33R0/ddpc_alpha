import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";

export default function Header() {
  return (
    <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">ddpc alpha</Link>
          <nav className="hidden sm:flex items-center gap-3 text-sm text-gray-600">
            <Link href="/vehicles" className="hover:text-black">Vehicles</Link>
            <Link href="/about" className="hover:text-black">About</Link>
          </nav>
        </div>
        <AuthButtons />
      </div>
    </header>
  );
}
