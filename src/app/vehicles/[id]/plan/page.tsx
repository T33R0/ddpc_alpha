'use client'
import { useEffect, useState, useCallback } from 'react'

const GROUPS = ['planning','purchased','active','complete','canceled'] as const

export default function Page({ params }: { params: { id: string } }) {
  const vehicleId = params.id
  const [data, setData] = useState<{ plan: { id: string; name: string; status: string; total_cost: number }, jobs: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newJob, setNewJob] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/plan`, { cache: 'no-store' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Failed')
      setData(j)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [vehicleId])

  useEffect(() => { void load() }, [load])

  if (error) return <div className="text-red-500">Error.</div>
  if (loading || !data) return <div>Loading…</div>

  const { plan, jobs } = data

  const addJob = async () => {
    if (!newJob.trim()) return
    const res = await fetch(`/api/vehicles/${vehicleId}/plan/jobs`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newJob })
    })
    if (!res.ok) { alert('Failed'); return }
    setNewJob(''); await load()
  }

  return (
    <div className="space-y-6 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{plan.name}</h1>
          <p className="text-sm text-zinc-500">
            <span className="uppercase rounded-md border px-2 py-0.5 mr-2">{plan.status}</span>
            Total: ${Number(plan.total_cost).toFixed(2)}
          </p>
        </div>
        <a className="rounded-lg px-3 py-2 border hover:shadow" href={`/api/reports/${plan.id}/budget`} target="_blank" rel="noreferrer">Export Budget</a>
      </header>

      <div className="flex gap-2">
        <input className="border rounded px-3 py-2 flex-1" placeholder="New job title…"
               disabled={plan.status !== 'open'} value={newJob} onChange={e => setNewJob(e.target.value)} />
        <button className="border rounded px-3 py-2" disabled={plan.status !== 'open'} onClick={addJob}>Add Job</button>
      </div>

      {GROUPS.map((g) => {
        const items = (jobs ?? []).filter((j: any) => j.status === g)
        return (
          <section key={g} className="space-y-2">
            <h2 className="text-lg font-medium capitalize">{g}</h2>
            {items.length === 0 ? <div className="text-sm text-zinc-500">No jobs.</div> : (
              <ul className="grid gap-2">
                {items.map((j: any) => (
                  <li key={j.id} className="rounded-xl border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{j.title}</div>
                      <select className="border rounded px-2 py-1" value={j.status}
                        disabled={plan.status !== 'open'}
                        onChange={async (e) => {
                          await fetch(`/api/jobs/${j.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: e.target.value }) })
                          await load()
                        }}>
                        {GROUPS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Parts inline add */}
                    <form className="grid grid-cols-6 gap-2" onSubmit={async (ev) => {
                      ev.preventDefault()
                      const fd = new FormData(ev.currentTarget); const b = Object.fromEntries(fd.entries())
                      await fetch(`/api/jobs/${j.id}/parts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: b.name, price: Number(b.price || 0), qty: Number(b.qty || 1), affiliate_url: b.affiliate_url }) })
                      ev.currentTarget.reset(); await load()
                    }}>
                      <input name="name" placeholder="Part name" className="col-span-2 border rounded px-2 py-1" disabled={plan.status !== 'open'} />
                      <input name="price" type="number" step="0.01" placeholder="Price" className="border rounded px-2 py-1" disabled={plan.status !== 'open'} />
                      <input name="qty" type="number" defaultValue={1} className="border rounded px-2 py-1" disabled={plan.status !== 'open'} />
                      <input name="affiliate_url" placeholder="Affiliate URL" className="col-span-2 border rounded px-2 py-1" disabled={plan.status !== 'open'} />
                      <button className="border rounded px-3 py-1" disabled={plan.status !== 'open'}>Add Part</button>
                    </form>

                    <div className="text-sm text-zinc-600">
                      {(j.parts ?? []).length ? (j.parts ?? []).map((p: any) => `${p.name || 'Part'} x${p.qty ?? 1} $${p.price ?? 0}`).join(' • ')
                        : 'No parts yet'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}


