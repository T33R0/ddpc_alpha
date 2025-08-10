import Link from "next/link";

export default function AboutPage() {
  const demoId = process.env.PUBLIC_VEHICLE_ID?.trim();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">About ddpc alpha</h1>
      <div className="prose max-w-none text-gray-800">
        <p>
          ddpc is like GitHub for Automobiles: plan work with Tasks and record what happened with the Timeline.
          Collaborate with your garage while keeping sensitive details private by default.
        </p>
        <p>
          Vehicles are private unless you make them public. Public pages show high-level updates without exposing
          private data.
        </p>
        {demoId && (
          <p>
            Explore a public demo vehicle: <Link href={`/v/${demoId}`} className="text-blue-600 hover:underline">View demo</Link>
          </p>
        )}
      </div>
    </div>
  );
}


