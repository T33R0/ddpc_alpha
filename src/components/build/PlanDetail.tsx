'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'

type JobPart = {
  id: string
  job_id: string
  name: string
  brand: string | null
  part_number: string | null
  affiliate_url: string | null
  price: number | null
  qty: number | null
  created_at: string
}

type Job = {
  id: string
  title: string
  description: string | null
  status: 'planning' | 'purchased' | 'active' | 'complete' | 'canceled'
  created_at: string
  updated_at: string
  parts: JobPart[]
}

type PlanPayload = {
  plan: { id: string; name: string; status: 'open'|'closed'|'archived'; total_cost: number }
  jobs: Job[]
}

const GROUPS = ['planning','purchased','active','complete','canceled'] as const

export default function PlanDetail({ planId }: { planId: string }) {
  const { success, error: errorToast } = useToast()
  const [data, setData] = useState<PlanPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [newJob, setNewJob] = useState('')

  const isOpen = data?.plan.status === 'open'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/build-plans/${planId}`, { cache: 'no-store' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Failed to load plan')
      setData(j as PlanPayload)
    } catch (e) {
      errorToast(e instanceof Error ? e.message : 'Failed to load plan')
    } finally {
      setLoading(false)
    }
  }, [planId, errorToast])

  useEffect(() => { void load() }, [load])

  const grouped = useMemo(() => {
    const out: Record<typeof GROUPS[number], Job[]> = {
      planning: [], purchased: [], active: [], complete: [], canceled: [],
    }
    for (const j of (data?.jobs ?? [])) {
      const key = (GROUPS as readonly string[]).includes(j.status) ? j.status : 'planning'
      out[key as typeof GROUPS[number]].push(j)
    }
    return out
  }, [data])

  async function addJob() {
    if (!newJob.trim()) return
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ build_plan_id: data?.plan.id, title: newJob.trim() }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Failed to add job')
      setNewJob('')
      success('Job added')
      await load()
    } catch (e) {
      errorToast(e instanceof Error ? e.message : 'Failed to add job')
    }
  }

  async function updateJob(id: string, patch: Partial<Pick<Job, 'title'|'description'|'status'>>) {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Failed to update job')
      success('Job updated')
      await load()
    } catch (e) {
      errorToast(e instanceof Error ? e.message : 'Failed to update job')
    }
  }

  async function addPart(jobId: string, form: HTMLFormElement) {
    try {
      const fd = new FormData(form)
      const payload = {
        name: String(fd.get('name') ?? ''),
        brand: String(fd.get('brand') ?? ''),
        part_number: String(fd.get('part_number') ?? ''),
        affiliate_url: String(fd.get('affiliate_url') ?? ''),
        price: fd.get('price') ? Number(fd.get('price')) : null,
        qty: fd.get('qty') ? Number(fd.get('qty')) : null,
      }
      const res = await fetch(`/api/jobs/${jobId}/parts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Failed to add part')
      form.reset()
      success('Part added')
      await load()
    } catch (e) {
      errorToast(e instanceof Error ? e.message : 'Failed to add part')
    }
  }

  if (loading) return <div className="p-3 text-sm text-muted">Loading…</div>
  if (!data) return <div className="p-3 text-sm text-red-600">Failed to load.</div>

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 mr-2">{data.plan.status}</span>
          <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">Total: ${Number(data.plan.total_cost ?? 0).toLocaleString()}</span>
        </div>
        <a href={`/vehicles/_/plans/${planId}/budget`.replace('/_/', '')} className="text-sm px-3 py-1 rounded border">Export Budget</a>
      </div>

      {/* Add Job */}
      <div className="flex gap-2">
        <input
          disabled={!isOpen}
          value={newJob}
          onChange={(e) => setNewJob(e.target.value)}
          placeholder="New job title…"
          className="flex-1 border rounded px-3 py-2"
        />
        <button disabled={!isOpen} onClick={() => void addJob()} className="border rounded px-3 py-2 text-sm">Add Job</button>
      </div>

      {/* Groups */}
      {(GROUPS as readonly string[]).map((g) => {
        const items = (grouped as Record<string, Job[]>)[g] || []
        return (
          <section key={g} className="space-y-2">
            <div className="text-xs uppercase text-gray-600">{g}</div>
            {items.length === 0 ? (
              <div className="text-xs text-gray-500">No jobs.</div>
            ) : (
              <ul className="grid md:grid-cols-2 gap-3">
                {items.map((j) => (
                  <li key={j.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{j.title}</div>
                      <select
                        disabled={!isOpen}
                        className="border rounded px-2 py-1 text-sm"
                        value={j.status}
                        onChange={(e) => void updateJob(j.id, { status: e.target.value as Job['status'] })}
                      >
                        {GROUPS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Parts summary */}
                    <div className="text-xs text-gray-600">
                      {(j.parts ?? []).length
                        ? (j.parts ?? []).map((p) => `${p.name || 'Part'} x${p.qty ?? 1} $${p.price ?? 0}`).join(' • ')
                        : 'No parts yet'}
                    </div>

                    {/* Add Part */}
                    <form
                      className="grid grid-cols-6 gap-2"
                      onSubmit={async (e) => { e.preventDefault(); await addPart(j.id, e.currentTarget) }}
                    >
                      <input name="name" placeholder="Part name" className="col-span-2 border rounded px-2 py-1" disabled={!isOpen} />
                      <input name="price" type="number" step="0.01" placeholder="Price" className="border rounded px-2 py-1" disabled={!isOpen} />
                      <input name="qty" type="number" defaultValue={1} className="border rounded px-2 py-1" disabled={!isOpen} />
                      <input name="affiliate_url" placeholder="Affiliate URL" className="col-span-2 border rounded px-2 py-1" disabled={!isOpen} />
                      <button className="border rounded px-3 py-1 text-sm" disabled={!isOpen}>Add Part</button>
                    </form>
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


