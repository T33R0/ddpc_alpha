'use client'

import { useMemo, useState } from 'react'

type Props = { jobId: string; disabled?: boolean }

type Tab = 'tasks' | 'parts' | 'notes'

export default function JobPanelClient({ jobId, disabled }: Props) {
  const [tab, setTab] = useState<Tab>('parts')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const tabs = useMemo(() => (
    [
      { key: 'tasks', label: 'Tasks' },
      { key: 'parts', label: 'Parts & Costs' },
      { key: 'notes', label: 'Notes' },
    ] as { key: Tab; label: string }[]
  ), [])

  async function onSubmit(formData: FormData) {
    setSubmitting(true)
    setError(null)
    setOk(false)
    try {
      const payload = {
        name: String(formData.get('name') ?? ''),
        brand: (formData.get('brand') ?? '') as string,
        part_number: (formData.get('part_number') ?? '') as string,
        affiliate_url: (formData.get('affiliate_url') ?? '') as string,
        price: formData.get('price') ? Number(formData.get('price')) : null,
        qty: formData.get('qty') ? Number(formData.get('qty')) : null,
      }
      const res = await fetch(`/api/jobs/${jobId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to add part')
      }
      setOk(true)
      ;(document.getElementById(`add-part-form-${jobId}`) as HTMLFormElement | null)?.reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add part')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-2 text-xs">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            className={`px-2 py-1 rounded border ${tab === t.key ? 'bg-gray-100' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'parts' && (
        <div className="space-y-2">
          <div className="text-xs text-gray-600">Add Part</div>
          <form id={`add-part-form-${jobId}`} action={onSubmit} className="grid gap-2" onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)) }}>
            <input name="name" placeholder="Name" required className="border rounded px-2 py-1" disabled={disabled || submitting} />
            <div className="grid grid-cols-2 gap-2">
              <input name="brand" placeholder="Brand" className="border rounded px-2 py-1" disabled={disabled || submitting} />
              <input name="part_number" placeholder="Part #" className="border rounded px-2 py-1" disabled={disabled || submitting} />
            </div>
            <input name="affiliate_url" placeholder="Affiliate URL" className="border rounded px-2 py-1" disabled={disabled || submitting} />
            <div className="grid grid-cols-2 gap-2">
              <input name="price" placeholder="Price" type="number" step="0.01" className="border rounded px-2 py-1" disabled={disabled || submitting} />
              <input name="qty" placeholder="Qty" type="number" step="1" className="border rounded px-2 py-1" disabled={disabled || submitting} />
            </div>
            <button type="submit" className="px-3 py-1 rounded border text-sm" disabled={disabled || submitting}>
              {submitting ? 'Saving…' : 'Add Part'}
            </button>
          </form>
          {disabled && <div className="text-xs text-gray-500">Plan is not open. Adding parts is disabled.</div>}
          {ok && <div className="text-xs text-green-700">Part added.</div>}
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="text-xs text-gray-600">Tasks UI coming soon…</div>
      )}

      {tab === 'notes' && (
        <div className="text-xs text-gray-600">Notes UI coming soon…</div>
      )}
    </div>
  )
}
