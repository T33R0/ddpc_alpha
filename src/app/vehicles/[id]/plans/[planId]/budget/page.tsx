import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BudgetPrintablePage({ params }: { params: Promise<{ id: string; planId: string }> }) {
  const { id: vehicleId, planId } = await params

  const res = await fetch(`${process.env.BASE_URL ?? ''}/api/reports/${planId}/budget`, { cache: 'no-store' })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Budget</h1>
          <Link href={`/vehicles/${vehicleId}/plans/${planId}`} className="text-sm text-blue-600 hover:underline">Back</Link>
        </div>
        <div className="text-red-600 text-sm">Failed to load budget: {j.error || res.statusText}</div>
      </div>
    )
  }

  const data = await res.json() as {
    plan: { id: string; name: string; status: string; total: number }
    jobs: { id: string; title: string; status: string; parts: { job_id: string; name: string; brand: string | null; part_number: string | null; affiliate_url: string | null; price: number | null; qty: number | null }[] }[]
  }

  return (
    <div className="p-6 space-y-6 print:p-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{data.plan.name}</h1>
          <div className="text-sm text-gray-600">Status: {data.plan.status}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold">Total: ${data.plan.total.toLocaleString()}</div>
          <Link href={`/vehicles/${vehicleId}/plans/${planId}`} className="text-sm text-blue-600 hover:underline no-print">Back</Link>
          <button onClick={() => typeof window !== 'undefined' && window.print()} className="text-sm px-3 py-1 rounded border no-print">Print</button>
        </div>
      </div>

      <div className="space-y-6">
        {data.jobs.map(job => {
          const subtotal = job.parts.reduce((sum, p) => sum + (p.price ?? 0) * (p.qty ?? 1), 0)
          return (
            <div key={job.id} className="border rounded">
              <div className="p-3 flex items-center justify-between bg-gray-50">
                <div className="font-medium">{job.title}</div>
                <div className="text-sm text-gray-700">Subtotal: ${subtotal.toLocaleString()}</div>
              </div>
              <div className="divide-y">
                {job.parts.length === 0 && <div className="p-3 text-sm text-gray-600">No parts.</div>}
                {job.parts.map((p, idx) => (
                  <div key={idx} className="p-3 text-sm grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-600">{[p.brand, p.part_number].filter(Boolean).join(' • ')}</div>
                      {p.affiliate_url && (
                        <a href={p.affiliate_url} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">Link</a>
                      )}
                    </div>
                    <div className="col-span-2">Qty: {p.qty ?? 1}</div>
                    <div className="col-span-3">Price: ${((p.price ?? 0)).toLocaleString()}</div>
                    <div className="col-span-3 text-right">Line: ${(((p.price ?? 0) * (p.qty ?? 1))).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`@media print { .no-print { display: none } body { background: white } }`}</style>
    </div>
  )
}
