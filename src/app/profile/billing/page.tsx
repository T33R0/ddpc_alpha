import Link from "next/link";

export const dynamic = "force-dynamic";

const plans = [
  {
    id: "driver",
    name: "Driver",
    blurb: "Free Tier",
    price: "$0",
    cadence: "/ Free",
    features: [
      "2 garage slots and basic maintenance records",
      "50 receipts per month with standard categorization",
      "Community access and basic sharing features",
      "Strategic limitations to encourage upgrades without frustrating users",
      "You could log maintenance on the same two vehicles forever and never pay a cent",
    ],
    cta: "Get Started",
    emphasis: "outline",
  },
  {
    id: "builder",
    name: "Builder",
    blurb: "Recommended",
    price: "$12.99",
    cadence: "/ month",
    priceNote: "or $129.99/year",
    features: [
      "Unlimited garage slots and advanced maintenance tracking",
      "Mod build lists and wishlists with detailed project planning",
      "Enhanced sharing features and community integration",
      "500 receipts monthly with 2GB photo storage",
      "Basic analytics and insights on spending patterns",
    ],
    cta: "Start Your Build",
    emphasis: "primary",
    badge: "Most Popular",
  },
  {
    id: "pro",
    name: "Pro",
    blurb: "Premium",
    price: "$24.99",
    cadence: "/ month",
    priceNote: "or $239.99/year",
    features: [
      "Everything in Builder plus advanced project management",
      "Comprehensive budget tracking with detailed cost analysis",
      "Mobile app access (launching Year 1)",
      "Unlimited receipts with 10GB photo storage",
      "Advanced analytics dashboard and export capabilities",
      "Priority email support and API access",
    ],
    cta: "Go Pro",
    emphasis: "primary",
  },
];

export default function BillingPage() {
  return (
    <div className="min-h-screen p-8" data-testid="billing-page">
      <div className="max-w-3xl mx-auto rounded-2xl border bg-card p-6 shadow-sm space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Billing</h1>
          <Link href="/profile" className="text-sm text-brand hover:underline">Back to profile</Link>
        </header>
        <p className="text-sm text-muted">Choose a plan. Payments integration coming soon.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded border p-4 bg-card">
              {plan.badge && (
                <div className="mb-2">
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full border">{plan.badge}</span>
                </div>
              )}
              <h2 className="font-medium">{plan.name}</h2>
              <div className="text-xs text-muted">{plan.blurb}</div>
              <div className="text-2xl font-semibold mt-2">
                {plan.price} <span className="text-sm font-normal text-muted">{plan.cadence}</span>
              </div>
              {plan.priceNote && (
                <div className="text-xs text-muted mt-1">{plan.priceNote}</div>
              )}
              <ul className="mt-3 text-sm list-disc list-inside space-y-1">
                {plan.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <button
                className={
                  plan.emphasis === "primary"
                    ? "mt-3 w-full rounded px-3 py-1 bg-black text-white"
                    : "mt-3 w-full rounded px-3 py-1 border"
                }
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
