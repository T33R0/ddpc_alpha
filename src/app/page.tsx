import Link from "next/link";
import Image from "next/image";
import { SignInButton } from "@/components/auth/SignInButton";
import { getServerSupabase } from "@/lib/supabase";
import { Warehouse, Search, User as UserIcon, CircleHelp } from "lucide-react";
import ddpcLogo from "../../media/branding/Fiverr Premium Kit/PNG Logo Files/Original Logo.png";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const demoId = process.env.PUBLIC_VEHICLE_ID?.trim();
    return (
      <div className="min-h-screen p-8 space-y-6" data-testid="dashboard-hero">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">ddpc alpha</h1>
          <div />
        </header>
        <div className="space-y-4">
          <p className="text-muted max-w-2xl">Track vehicles like repos. Plan work with Tasks and log what actually happened on the Timeline. Collaborate with your garage with privacy by default.</p>
          <div className="flex items-center gap-3">
            <SignInButton className="bg-brand text-white rounded px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" data-testid="cta-signin-google" />
            {demoId && (<Link href={`/v/${demoId}`} className="text-brand hover:underline" data-testid="cta-demo">See a public demo</Link>)}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative min-h-[70vh] flex items-center justify-center text-fg">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Image src={ddpcLogo} alt="" className="opacity-40 w-[60%] h-auto select-none" />
      </div>
      <div className="relative grid grid-cols-2 gap-6 sm:gap-8">
        <Link href="/vehicles" aria-label="Garage" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">
          <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl border bg-card/70 backdrop-blur flex items-center justify-center hover:bg-card transition-colors">
            <Warehouse className="w-12 h-12 md:w-16 md:h-16" />
          </div>
        </Link>
        <Link href="/discover" aria-label="Discover" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">
          <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl border bg-card/70 backdrop-blur flex items-center justify-center hover:bg-card transition-colors">
            <Search className="w-12 h-12 md:w-16 md:h-16" />
          </div>
        </Link>
        <Link href="/profile" aria-label="Profile" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">
          <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl border bg-card/70 backdrop-blur flex items-center justify-center hover:bg-card transition-colors">
            <UserIcon className="w-12 h-12 md:w-16 md:h-16" />
          </div>
        </Link>
        <Link href="/ddpc" aria-label="ddpc?" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">
          <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl border bg-card/70 backdrop-blur flex items-center justify-center hover:bg-card transition-colors">
            <CircleHelp className="w-12 h-12 md:w-16 md:h-16" />
          </div>
        </Link>
      </div>
    </div>
  );
}
