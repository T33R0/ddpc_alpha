export default function AboutPage() {
  return (
    <main className="relative isolate min-h-screen bg-neutral-950 text-neutral-200">
      {/* Background accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10%] aspect-[2/1] w-[120vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(120,120,120,0.12),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
      </div>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 py-28 sm:py-36">
        <h1 className="text-balance text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          <span className="bg-gradient-to-b from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Your Build. Documented. Shared. Immortalized.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-400">
          ddpc is the system of record for automotive builds—manage, track, and share the full modification lifecycle.
        </p>
      </section>

      {/* Core identity */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          <div className="group rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur transition-colors hover:bg-neutral-900/60">
            <h3 className="text-xl font-semibold tracking-tight text-neutral-100">Precision</h3>
            <p className="mt-3 text-neutral-400">A digital twin of your build, every part and event logged.</p>
          </div>
          <div className="group rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur transition-colors hover:bg-neutral-900/60">
            <h3 className="text-xl font-semibold tracking-tight text-neutral-100">Community</h3>
            <p className="mt-3 text-neutral-400">Connect with enthusiasts, share milestones, and learn from others.</p>
          </div>
          <div className="group rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur transition-colors hover:bg-neutral-900/60">
            <h3 className="text-xl font-semibold tracking-tight text-neutral-100">Legacy</h3>
            <p className="mt-3 text-neutral-400">Preserve the full story of your car for shows, sales, or the next generation.</p>
          </div>
        </div>
      </section>

      {/* Closing line */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-32">
        <p className="text-center text-xl text-neutral-300">
          Every build deserves a record. This is yours.
        </p>
      </section>
    </main>
  );
}


