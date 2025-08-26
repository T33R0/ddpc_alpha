import Link from "next/link";

export default function YMMSupportPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Vehicle Support</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Can&apos;t find your Year/Make/Model combination?
          </p>
        </div>

        <div className="bg-muted/30 border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">What to do if you can&apos;t find your vehicle:</h2>

          <div className="space-y-3">
            <div>
              <h3 className="font-medium">1. Check the year</h3>
              <p className="text-sm text-muted-foreground">
                Make sure you&apos;re selecting the correct model year (the year shown on your registration or insurance documents).
              </p>
            </div>

            <div>
              <h3 className="font-medium">2. Try alternative spellings</h3>
              <p className="text-sm text-muted-foreground">
                Some manufacturers have multiple naming conventions. Try searching with partial names or common abbreviations.
              </p>
            </div>

            <div>
              <h3 className="font-medium">3. Contact us</h3>
              <p className="text-sm text-muted-foreground">
                If you&apos;re still having trouble, please reach out to our support team with your vehicle&apos;s details and we&apos;ll help you add it manually.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/vehicles"
            className="inline-flex items-center px-4 py-2 bg-brand text-white rounded hover:brightness-95 transition-colors"
          >
            ← Back to Garage
          </Link>
        </div>
      </div>
    </div>
  );
}
