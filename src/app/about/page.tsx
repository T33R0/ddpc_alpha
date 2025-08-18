export default function AboutPage() {
  return (
    <main className="relative isolate min-h-screen bg-neutral-950 text-neutral-200 print:bg-white print:text-black print:min-h-0">
      {/* Background accents (hidden in print) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 print:hidden">
        <div className="absolute left-1/2 top-[-10%] aspect-[2/1] w-[120vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(120,120,120,0.10),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-28 print:max-w-letter print:px-10 print:py-10">
        {/* 1) Intro / Why */}
        <section className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Why ddpc exists</h1>
          <p className="text-lg leading-relaxed text-neutral-300 print:text-black">
            ddpc answers questions car people have never had wonderful answers for.
          </p>
          <p className="text-lg leading-relaxed text-neutral-300 print:text-black">
            What did this build actually cost? What was really done and when?
          </p>
          <p className="text-lg leading-relaxed text-neutral-300 print:text-black">
            We love building, tinkering, redesigning, driving. Records would be awesome—but there’s never been a standard.
          </p>
        </section>

        {/* Divider */}
        <div className="my-12 h-px bg-neutral-900/60 print:bg-black/10" />

        {/* 2) The Problem */}
        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">The Problem</h2>
          <p className="text-base leading-relaxed text-neutral-300 print:text-black">
            The current “standard” is a manilla folder with random receipts, maybe a spreadsheet, and if you’re lucky a Google Photos album. Most people don’t even get that far. The folks who do tend to be… a bit intense to deal with.
          </p>
          <p className="text-base leading-relaxed text-neutral-300 print:text-black">
            Used cars come with hand-wavy lines like “I changed the oil every 5k” and “I already did the timing.” Cool story—where’s the record?
          </p>
          <p className="text-base leading-relaxed text-neutral-300 print:text-black">
            There hasn’t been a clean, consistent way to plan, document, and transfer a vehicle’s real history. Until now.
          </p>
        </section>

        {/* Divider */}
        <div className="my-12 h-px bg-neutral-900/60 print:bg-black/10" />

        {/* 3) What ddpc Does */}
        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What ddpc Does</h2>
          <ul className="list-outside space-y-3 text-base text-neutral-300 print:text-black">
            <li>Organizes your build from idea to install to aftercare—parts, jobs, events, photos.</li>
            <li>Connects parts directly to your records so the story and the source live together.</li>
            <li>Lets you plan jobs, estimate costs, and track actuals.</li>
            <li>Builds a maintenance schedule with reminders you’ll actually use.</li>
            <li>Prints clean paperwork to validate history and specs.</li>
            <li>Generates show sheets without the night-before scramble.</li>
            <li>Makes it easier to learn: see how others build, compare details, improve your own.</li>
          </ul>
        </section>

        {/* Divider */}
        <div className="my-12 h-px bg-neutral-900/60 print:bg-black/10" />

        {/* 4) How You Use It */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How You Use It</h2>
          <div className="grid grid-cols-1 gap-3">
            <div><span className="font-semibold text-neutral-100 print:text-black">Plan</span> — Outline jobs, parts, and budget.</div>
            <div><span className="font-semibold text-neutral-100 print:text-black">Do</span> — Log installs, maintenance, and changes as events.</div>
            <div><span className="font-semibold text-neutral-100 print:text-black">Prove</span> — Attach receipts, notes, and photos where they belong.</div>
            <div><span className="font-semibold text-neutral-100 print:text-black">Share</span> — Publish a clean history when you sell or show.</div>
            <div><span className="font-semibold text-neutral-100 print:text-black">Keep Going</span> — Reminders keep the car honest and the story continuous.</div>
          </div>
        </section>

        {/* Divider */}
        <div className="my-12 h-px bg-neutral-900/60 print:bg-black/10" />

        {/* 5) For Buyers & Sellers */}
        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">For Buyers & Sellers</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-neutral-900/40 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_20px_-12px_rgba(0,0,0,0.8)] ring-1 ring-neutral-800 print:shadow-none print:ring-0 print:bg-white">
              <h3 className="text-lg font-semibold">If you’re selling</h3>
              <p className="mt-2 text-neutral-300 print:text-black">Hand over a verified record: what, when, why, and how much. No guesswork, no storytelling. Just credibility.</p>
            </div>
            <div className="rounded-xl bg-neutral-900/40 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_20px_-12px_rgba(0,0,0,0.8)] ring-1 ring-neutral-800 print:shadow-none print:ring-0 print:bg-white">
              <h3 className="text-lg font-semibold">If you’re buying</h3>
              <p className="mt-2 text-neutral-300 print:text-black">See the real history. Not “probably” or “I think.” The car’s life—documented.</p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="my-12 h-px bg-neutral-900/60 print:bg-black/10" />

        {/* 6) Our Take / Promise */}
        <section>
          <blockquote className="border-l border-neutral-800 pl-5 text-lg italic text-neutral-300 print:text-black">
            We’re here to replace the manilla folder—so you, and whoever owns the car after you, actually know what’s been done. No fluff. Just the record.
          </blockquote>
        </section>

        {/* 7) Footer line */}
        <footer className="mt-16 text-center text-sm text-neutral-500 print:text-black">
          Every build deserves a record.
        </footer>
      </div>
    </main>
  );
}


