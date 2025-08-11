import Link from "next/link";

export const dynamic = "force-dynamic";

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
          <div className="rounded border p-4">
            <h2 className="font-medium">Free</h2>
            <div className="text-2xl font-semibold mt-1">$0</div>
            <ul className="mt-2 text-sm list-disc list-inside">
              <li>1 garage</li>
              <li>Up to 2 vehicles</li>
              <li>Basic features</li>
            </ul>
            <button className="mt-3 w-full border rounded px-3 py-1">Current</button>
          </div>
          <div className="rounded border p-4">
            <h2 className="font-medium">Pro</h2>
            <div className="text-2xl font-semibold mt-1">$9/mo</div>
            <ul className="mt-2 text-sm list-disc list-inside">
              <li>Unlimited garages</li>
              <li>Unlimited vehicles</li>
              <li>Priority support</li>
            </ul>
            <button className="mt-3 w-full bg-black text-white rounded px-3 py-1">Upgrade</button>
          </div>
          <div className="rounded border p-4">
            <h2 className="font-medium">Team</h2>
            <div className="text-2xl font-semibold mt-1">$29/mo</div>
            <ul className="mt-2 text-sm list-disc list-inside">
              <li>Team roles</li>
              <li>Advanced analytics</li>
              <li>API access</li>
            </ul>
            <button className="mt-3 w-full bg-black text-white rounded px-3 py-1">Contact sales</button>
          </div>
        </div>
      </div>
    </div>
  );
}