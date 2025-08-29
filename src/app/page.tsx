import Link from "next/link";
import Image from "next/image";
import { SignInButton } from "@/components/auth/SignInButton";
import { getServerSupabase } from "@/lib/supabase";
import { Warehouse, Search, CircleHelp, Car, Calendar, Users, Shield, Zap, CheckCircle } from "lucide-react";
import ddpcLogo from "../../media/branding/android-chrome-512x512.png";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const demoId = process.env.PUBLIC_VEHICLE_ID?.trim();
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg via-card/20 to-bg" data-testid="dashboard-hero">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-brand/5" />
          <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
            <div className="text-center space-y-8">
              <div className="flex justify-center mb-8">
                <Image
                  src={ddpcLogo}
                  alt="ddpc logo"
                  width={120}
                  height={120}
                  className="rounded-2xl shadow-lg"
                />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl font-bold text-fg">
                  Track Your <span className="text-brand">Vehicles</span> Like Code
                </h1>
                <p className="text-xl text-muted max-w-3xl mx-auto leading-relaxed">
                  Plan maintenance, log repairs, and collaborate with your garage.
                  Keep your vehicles running smoothly with intelligent tracking and community-driven insights.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <SignInButton className="bg-brand hover:opacity-95 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] transition-all" data-testid="cta-signin-google">
                  Get Started Free
                </SignInButton>
                {demoId && (
                  <Link
                    href={`/v/${demoId}`}
                    className="text-brand hover:text-brand/80 font-semibold text-lg px-8 py-4 border border-brand/20 rounded-lg hover:bg-brand/5 transition-colors"
                    data-testid="cta-demo"
                  >
                    View Demo →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-card/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-fg mb-4">Everything You Need for Vehicle Management</h2>
              <p className="text-lg text-muted max-w-2xl mx-auto">
                From planning your next service to tracking every modification, ddpc keeps your garage organized.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
                  <Car className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-xl font-semibold">Vehicle Tracking</h3>
                <p className="text-muted">Keep detailed records of all your vehicles, from daily drivers to project cars.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-xl font-semibold">Maintenance Planning</h3>
                <p className="text-muted">Schedule services, track deadlines, and never miss an oil change again.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-xl font-semibold">Garage Collaboration</h3>
                <p className="text-muted">Share progress with friends and collaborate on builds with privacy controls.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-xl font-semibold">Discover & Compare</h3>
                <p className="text-muted">Research vehicles, compare specs, and find your next perfect ride.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-xl font-semibold">Privacy First</h3>
                <p className="text-muted">Your data stays yours. Control who sees what with granular privacy settings.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-xl font-semibold">Smart Insights</h3>
                <p className="text-muted">Get recommendations based on your driving habits and maintenance history.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / Alpha Notice */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-card/50 rounded-2xl p-8 border">
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 text-brand">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">Alpha Release</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-fg mb-4">Join Our Growing Community</h3>
              <p className="text-muted mb-6 max-w-2xl mx-auto">
                We&apos;re in active development and love getting feedback from early adopters.
                Help shape the future of vehicle management while keeping your garage organized.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Privacy focused</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Community driven</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-border/50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="flex justify-center mb-6">
              <Image
                src={ddpcLogo}
                alt="ddpc logo"
                width={60}
                height={60}
                className="rounded-lg"
              />
            </div>
            <p className="text-muted mb-4">© 2024 ddpc alpha. Built for vehicle enthusiasts.</p>
            <div className="flex justify-center gap-6 text-sm">
              <Link href="/about" className="text-muted hover:text-fg transition-colors">
                About
              </Link>
              <Link href="/community" className="text-muted hover:text-fg transition-colors">
                Community
              </Link>
              <Link href="/ddpc" className="text-muted hover:text-fg transition-colors">
                FAQ
              </Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }
  return (
    <div className="relative min-h-[70vh] flex items-center justify-center text-fg">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Image src={ddpcLogo} alt="" className="opacity-40 w-[72%] h-auto select-none" />
      </div>
      <div className="relative grid grid-cols-3 gap-6 sm:gap-8">
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
        <Link href="/ddpc" aria-label="ddpc?" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">
          <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl border bg-card/70 backdrop-blur flex items-center justify-center hover:bg-card transition-colors">
            <CircleHelp className="w-12 h-12 md:w-16 md:h-16" />
          </div>
        </Link>
      </div>
    </div>
  );
}
