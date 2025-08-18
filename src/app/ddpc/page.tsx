import Link from "next/link";

export const metadata = {
  title: "ddpc? • What is ddpc",
  description:
    "Daily Driven Project Car — a beautiful, easy-to-use super-solution for people who mod what they drive and drive what they mod.",
};

export default function DdpcWhatPage() {
  return (
    <main className="relative min-h-screen bg-neutral-950 text-neutral-100 print:bg-white print:text-black">
      {/* subtle carbon/stripe backdrop (hidden in print) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 print:hidden [background:radial-gradient(80vw_40vw_at_10%_0%,rgba(255,255,255,0.05),transparent_60%),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:auto,32px_100%,100%_32px]"
      />

      <section className="relative mx-auto max-w-5xl px-6 pb-24 pt-24 sm:pt-28 print:max-w-letter print:px-10 print:py-10">
        {/* Hero */}
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800/60 px-3 py-1 text-xs uppercase tracking-wide text-neutral-400 print:border-black/20">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 print:bg-black" />
            ddpc?
          </div>
          <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">Daily Driven Project Car</h1>
          <p className="mt-5 max-w-3xl text-lg text-neutral-300 print:text-black">
            A beautiful, easy-to-use <span className="font-medium">super-solution</span> for people who mod what they drive and drive what they mod.
          </p>
        </header>

        {/* Culture */}
        <div className="mb-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Daily Driven",
              body: "You actually drive it. Errands, commutes, detours that become drives.",
            },
            {
              title: "Project Car",
              body: "It’s always becoming. Parts arrive faster than excuses.",
            },
            {
              title: "Both",
              body: "You live between unfinished and unforgettable. That’s the point.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-neutral-800/60 p-5 transition-transform duration-200 hover:-translate-y-0.5 print:border-black/20"
            >
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-neutral-300 print:text-black">{c.body}</p>
            </div>
          ))}
        </div>

        {/* Problem */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold">The problem</h2>
          <p className="mt-3 max-w-3xl text-neutral-300 print:text-black">
            The “standard” is a manilla folder, scattered receipts, a maybe-spreadsheet, and a hopeful “I changed the oil every 5k and already did the timing.” Cool story—where’s the record?
          </p>
        </div>

        {/* Solution / Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold">The super-solution</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Plan jobs and estimate costs.",
              "Log installs, maintenance, and changes—on a timeline.",
              "Tie parts directly to your records.",
              "Attach receipts, notes, and photos where they belong.",
              "Get reminders that keep the car honest.",
              "Print clean history/specs or show sheets.",
              "Share a truthful story when it’s time.",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-neutral-800/60 p-4 print:border-black/20"
              >
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-neutral-300 print:bg-black" />
                <span className="text-neutral-300 print:text-black">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* How it feels (micro-wins) */}
        <div className="mb-14">
          <h2 className="text-2xl font-semibold">How it feels</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Add a part → it lives in your history.",
              "Do a job → event on your timeline.",
              "Receipts/photos → attached where they belong.",
              "Show night → print a clean spec.",
              "Selling? → hand off credibility.",
              "Buying? → see more than “trust me.”",
            ].map((line) => (
              <div
                key={line}
                className="rounded-2xl border border-neutral-800/60 p-4 text-neutral-300 transition-transform duration-200 hover:-translate-y-0.5 print:text-black print:border-black/20"
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Personas */}
        <div className="mb-16 grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Bit by the mod bug",
              body: "You can’t leave well enough alone. Good—ddpc keeps the chaos organized.",
            },
            {
              title: "Builder-archivist",
              body: "You want the car’s truth documented. ddpc turns truth into a timeline.",
            },
          ].map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-neutral-800/60 p-5 transition-transform duration-200 hover:-translate-y-0.5 print:border-black/20"
            >
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-neutral-300 print:text-black">{p.body}</p>
            </div>
          ))}
        </div>

        {/* Quiet CTA */}
        <div className="mb-20 flex flex-wrap items-center gap-6">
          <Link
            href="/vehicles"
            className="group inline-flex items-center gap-2 text-neutral-200 underline decoration-neutral-700 underline-offset-4 transition-colors hover:decoration-neutral-300"
          >
            Open your Garage
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="/timeline"
            className="group inline-flex items-center gap-2 text-neutral-400 underline decoration-neutral-800 underline-offset-4 transition-colors hover:text-neutral-200 hover:decoration-neutral-300"
          >
            Peek a Timeline
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {/* Footer line */}
        <footer className="border-t border-neutral-900 pt-8 text-center text-sm text-neutral-400 print:border-black/20 print:text-black">
          Every build deserves a record.
        </footer>
      </section>
    </main>
  );
}
