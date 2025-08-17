import Link from "next/link";

export default function AboutPage() {
  const demoId = process.env.PUBLIC_VEHICLE_ID?.trim();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-12">
      {/* Hero / Intro */}
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">About ddpc</h1>
        <p className="text-lg text-gray-700">
          ddpc (Daily Driver Project Companion) helps enthusiasts, owners, and garages collaborate on vehicle care
          and builds. Plan work with Tasks, track progress on the Timeline, and keep sensitive details private by default.
        </p>
        {demoId && (
          <p className="text-gray-700">
            Explore a public demo vehicle: {""}
            <Link href={`/v/${demoId}`} className="text-blue-600 hover:underline">View demo</Link>
          </p>
        )}
      </section>

      {/* Mission & Vision */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-xl font-semibold">Our Mission</h2>
          <p className="text-gray-700">
            Empower every vehicle owner and garage to collaborate with clarity and trust—reducing guesswork,
            improving safety, and extending the life of vehicles through well-documented work.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-xl font-semibold">Our Vision</h2>
          <p className="text-gray-700">
            A global, privacy-first network where each vehicle has a living history—searchable, verifiable,
            and portable across owners and shops.
          </p>
        </div>
      </section>

      {/* History */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">History</h2>
        <ol className="relative border-s pl-6">
          <li className="mb-6 ms-6">
            <div className="absolute -start-1.5 h-3 w-3 rounded-full border bg-white" />
            <h3 className="font-medium">2024 — Concept</h3>
            <p className="text-gray-700">Seeded from the frustration of scattered receipts, text threads, and lost maintenance logs.</p>
          </li>
          <li className="mb-6 ms-6">
            <div className="absolute -start-1.5 h-3 w-3 rounded-full border bg-white" />
            <h3 className="font-medium">2025 — ddpc alpha</h3>
            <p className="text-gray-700">Introduced Tasks, Timeline, and public vehicle pages with privacy by default.</p>
          </li>
          <li className="ms-6">
            <div className="absolute -start-1.5 h-3 w-3 rounded-full border bg-white" />
            <h3 className="font-medium">Roadmap</h3>
            <p className="text-gray-700">Deeper parts intelligence, build plans, and collaboration with shops and clubs.</p>
          </li>
        </ol>
      </section>

      {/* Values */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Core Values</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Privacy by Default</h3>
            <p className="text-gray-700">You decide what’s shared. Public pages show high-level updates only.</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Clarity Over Complexity</h3>
            <p className="text-gray-700">Simple workflows for planning work and recording what actually happened.</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Data Portability</h3>
            <p className="text-gray-700">Your vehicle’s history should follow the vehicle—across owners and garages.</p>
          </div>
        </div>
      </section>

      {/* Team (placeholders) */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Team</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Alex Rivera</h3>
            <p className="text-gray-700 text-sm">Founder & Product</p>
            <p className="mt-2 text-gray-700 text-sm">Former shop hand, software PM. Obsessed with build documentation and safety.</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Sam Patel</h3>
            <p className="text-gray-700 text-sm">Engineering</p>
            <p className="mt-2 text-gray-700 text-sm">Full‑stack dev with a soft spot for track day prep and telemetry.</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Jordan Lee</h3>
            <p className="text-gray-700 text-sm">Design</p>
            <p className="mt-2 text-gray-700 text-sm">Designing clear, friendly workflows for owners and garages alike.</p>
          </div>
        </div>
      </section>

      {/* Contact / Press */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-2 text-xl font-semibold">Contact</h2>
        <p className="text-gray-700">Have feedback or want to collaborate? Reach out:</p>
        <ul className="mt-2 list-inside list-disc text-gray-700">
          <li>Email: <a href="mailto:hello@ddpc.app" className="text-blue-600 hover:underline">hello@ddpc.app</a></li>
          <li>Docs: <Link href="/docs" className="text-blue-600 hover:underline">/docs</Link></li>
          {demoId && (
            <li>Demo vehicle: <Link href={`/v/${demoId}`} className="text-blue-600 hover:underline">View demo</Link></li>
          )}
        </ul>
      </section>
    </div>
  );
}


