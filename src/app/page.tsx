import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">GitHub for Automobiles (Alpha)</h1>
        <AuthButtons />
      </header>
      <main className="space-y-6">
        <p className="text-gray-700">
          Track vehicles like repos. Plan work, log events, and collaborate with your garage.
        </p>
        <div>
          <Link href="/vehicles" className="inline-block bg-black text-white rounded px-4 py-2 hover:bg-gray-800">
            Go to Vehicles
          </Link>
        </div>
      </main>
    </div>
  );
}
