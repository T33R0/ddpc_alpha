'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { EventTypePicker } from './EventTypePicker';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import type { EventType } from '@/types/event-types';

type Props = {
  vehicleId: string;
  eventTypes: EventType[];
  defaultDate?: string; // ISO date
  onSuccess?: () => void;
  onCreated?: (event: { id: string; vehicle_id: string; type: string; title?: string | null; occurred_at: string }) => void;
};

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props;
  return <textarea className={`block w-full rounded-md border bg-bg text-fg px-3 py-2 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] ${className}`} {...rest} />;
}

export function QuickAddEventForm({ vehicleId, eventTypes, defaultDate, onSuccess, onCreated }: Props) {
  const [eventTypeKey, setEventTypeKey] = React.useState<string>('');
  const [title, setTitle] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [whenDate, setWhenDate] = React.useState(defaultDate ?? new Date().toISOString().slice(0,10));
  const [whenTime, setWhenTime] = React.useState<string>('');
  const [timeKnown, setTimeKnown] = React.useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const tzAwareISO = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString();

  const submit = () => {
    if (!eventTypeKey) { toast.error('Select an event type'); return; }
    startTransition(async () => {
      let occurred_at: string | null = null;
      let occurred_on: string | null = null;
      try {
        const [y,m,d] = whenDate.split('-').map(Number);
        const base = new Date(Date.UTC(y, (m||1)-1, d||1, 0, 0, 0));
        if (timeKnown && whenTime) {
          const [hh, mm] = whenTime.split(':').map(Number);
          base.setUTCHours(hh||0, mm||0, 0, 0);
          occurred_at = tzAwareISO(base);
          occurred_on = whenDate;
        } else {
          occurred_on = whenDate;
        }
      } catch {}
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          type: 'NOTE',
          title: title || eventTypeKey,
          notes: notes || null,
          occurred_at,
          occurred_on,
          date_confidence: timeKnown && occurred_at ? 'exact' : 'unknown',
          type_key: eventTypeKey,
        })
      });
      if (!res.ok) {
        const msg = await res.text();
        toast.error(`Failed to add event: ${msg}`);
        return;
      }
      const json = await res.json().catch(() => null);
      toast.success('Event added');
      setTitle(''); setNotes(''); setWhenTime(''); setTimeKnown(false);
      if (json && json.event) onCreated?.(json.event);
      onSuccess?.();
    });
  };

  return (
    <div className="grid gap-3">
      <EventTypePicker
        eventTypes={eventTypes}
        value={eventTypeKey}
        onChange={setEventTypeKey}
        placeholder="Select a manual event type…"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input id="whenDate" name="whenDate" type="date" value={whenDate} onChange={e => setWhenDate(e.target.value)} />
        <div className="flex items-center gap-2">
          <input id="timeKnown" name="timeKnown" type="checkbox" checked={timeKnown} onChange={e => setTimeKnown(e.target.checked)} />
          <label htmlFor="timeKnown" className="text-sm text-muted">Time known</label>
        </div>
        <Input id="whenTime" name="whenTime" type="time" value={whenTime} onChange={e => setWhenTime(e.target.value)} disabled={!timeKnown} />
        <Input id="title" name="title" placeholder="Optional short title (e.g., Entered storage)" value={title} onChange={e=>setTitle(e.target.value)} />
      </div>
      <div>
        <label htmlFor="notes" className="sr-only">Notes</label>
        <Textarea id="notes" name="notes" placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button onClick={submit} disabled={isPending || !eventTypeKey}>Add to Timeline</Button>
      </div>
    </div>
  );
}


