import Link from "next/link";
import {
  Warehouse,
  Search,
  CircleHelp,
  Users,
  Calendar,
  CheckSquare,
  User,
  Target,
  Car,
  TrendingUp
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const navigationItems = [
    {
      href: "/vehicles",
      icon: Warehouse,
      ariaLabel: "Garage",
      gradient: "from-blue-500/20 to-blue-600/20"
    },
    {
      href: "/discover",
      icon: Search,
      ariaLabel: "Discover",
      gradient: "from-green-500/20 to-green-600/20"
    },
    {
      href: "/community",
      icon: Users,
      ariaLabel: "Community",
      gradient: "from-purple-500/20 to-purple-600/20"
    },
    {
      href: "/timeline",
      icon: Calendar,
      ariaLabel: "Timeline",
      gradient: "from-orange-500/20 to-orange-600/20"
    },
    {
      href: "/tasks",
      icon: CheckSquare,
      ariaLabel: "Tasks",
      gradient: "from-teal-500/20 to-teal-600/20"
    },
    {
      href: "/profile",
      icon: User,
      ariaLabel: "Profile",
      gradient: "from-indigo-500/20 to-indigo-600/20"
    },
    {
      href: "/hunts",
      icon: Target,
      ariaLabel: "Hunts",
      gradient: "from-red-500/20 to-red-600/20"
    },
    {
      href: "/ddpc",
      icon: CircleHelp,
      ariaLabel: "Help",
      gradient: "from-yellow-500/20 to-yellow-600/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-card/10 to-bg flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Main Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.ariaLabel}
                className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-3xl"
              >
                <div className={`relative w-full aspect-square rounded-3xl border bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card hover:scale-105 transition-all duration-300 overflow-hidden ${item.gradient}`}>
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/10 to-transparent" />

                  {/* Icon */}
                  <IconComponent className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-fg/80 group-hover:text-fg group-hover:scale-110 transition-all duration-300 relative z-10" />

                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br from-white/20 via-transparent to-transparent blur-xl" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats Row - Optional */}
        <div className="mt-12 flex justify-center">
          <div className="bg-card/50 rounded-2xl p-6 border backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-muted">
                <Car className="w-5 h-5" />
                <span className="text-sm">Your Garage</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2 text-muted">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm">Activity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
