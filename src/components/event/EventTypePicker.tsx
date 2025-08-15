'use client';

import * as React from 'react';
// no ssr-specific dynamic imports; we load the icon module once on open
import type { EventType } from '@/types/event-types';

type Props = {
  eventTypes: EventType[];
  value?: string;               // event_type.key
  onChange: (key: string) => void;
  placeholder?: string;
  className?: string;
};

// Minimal cn helper
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

// Local popover + command primitives (simplified to match existing UI kit)
function Popover({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div data-popover data-open={open} className="relative">
      {children}
    </div>
  );
}

function PopoverTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  void asChild;
  return <div>{children}</div>;
}

function PopoverContent({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('absolute z-50 mt-1 rounded-md border bg-white shadow-lg', className)} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

function Command({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }
function CommandInput({ placeholder, onChange }: { placeholder?: string; onChange?: (v: string) => void }) {
  return (
    <input
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full border-b px-3 py-2 text-sm outline-none"
    />
  );
}
function CommandList({ id, children }: { id?: string; children: React.ReactNode }) { return <div id={id} className="max-h-80 w-full overflow-auto">{children}</div>; }
function CommandEmpty({ children }: { children: React.ReactNode }) { return <div className="p-3 text-sm text-gray-500">{children}</div>; }
function CommandGroup({ heading, children }: { heading?: string; children: React.ReactNode }) {
  return (
    <div className="p-2">
      {heading ? <div className="px-2 pb-1 text-xs font-medium text-gray-500">{heading}</div> : null}
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function CommandItem({ value, onSelect, children }: { value?: string; onSelect?: (value: string) => void; children: React.ReactNode }) {
  return (
    <button onClick={() => onSelect?.(value || '')} className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-gray-50">
      {children}
    </button>
  );
}

type IconProps = React.SVGProps<SVGSVGElement>;

const categoryOrder: Record<EventType['category'], number> = {
  ownership: 1, location: 2, status: 3, legal: 4,
  recognition: 5, incident: 6, milestone: 7, customization: 8
};

const categoryLabels: Record<EventType['category'], string> = {
  ownership: 'Ownership',
  location: 'Location & Storage',
  status: 'Condition & Status',
  legal: 'Legal & Regulatory',
  recognition: 'Events & Recognition',
  incident: 'Incidents',
  milestone: 'Milestones',
  customization: 'Customization (Manual)'
};

export function EventTypePicker({ eventTypes, value, onChange, placeholder = "Select event type...", className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const grouped = React.useMemo(() => {
    const map = new Map<string, EventType[]>();
    [...eventTypes]
      .sort((a,b) => (categoryOrder[a.category]-categoryOrder[b.category]) || a.sort_order - b.sort_order)
      .forEach(et => {
        const arr = map.get(et.category) ?? [];
        arr.push(et);
        map.set(et.category, arr);
      });
    return map;
  }, [eventTypes]);

  const selected = eventTypes.find(et => et.key === value) || null;
  const [icons, setIcons] = React.useState<Record<string, React.ComponentType<IconProps>> | null>(null);
  React.useEffect(() => {
    if (!open || icons) return;
    let cancelled = false;
    import('lucide-react').then((m) => {
      if (cancelled) return;
      setIcons(m as unknown as Record<string, React.ComponentType<IconProps>>);
    }).catch(() => {
      // ignore
    });
    return () => { cancelled = true; };
  }, [open, icons]);
  const Icon = selected && icons ? (icons[selected.icon] || icons['Tag']) : null;

  const filteredEntries = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return Array.from(grouped.entries());
    return Array.from(grouped.entries()).map(([cat, items]) => [cat, items.filter(i => `${i.label} ${cat}`.toLowerCase().includes(q)) as EventType[]] as const).filter(([, items]) => items.length > 0);
  }, [grouped, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="event-type-cmd-list"
          onClick={() => setOpen((v) => !v)}
          className={cn("w-full justify-between inline-flex items-center gap-2 rounded-md border bg-bg text-fg px-3 py-2 text-sm", className)}
        >
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="h-4 w-4" /> : null}
            <span className={cn(!selected && "text-muted-foreground")}>{selected ? selected.label : placeholder}</span>
          </div>
          <span className="h-4 w-4 opacity-50">▼</span>
        </button>
      </PopoverTrigger>
      {open && (
        <PopoverContent className="p-0 w-[28rem]">
          <Command>
            <CommandInput placeholder="Search event types…" onChange={setQuery} />
            <CommandList id="event-type-cmd-list">
              {filteredEntries.length === 0 ? (
                <CommandEmpty>No event type found.</CommandEmpty>
              ) : (
                filteredEntries.map(([category, items]) => (
                  <CommandGroup key={category} heading={categoryLabels[category as EventType['category']] }>
                    {items.map((et) => {
                      const ItemIcon = icons ? (icons[et.icon] || icons['Tag']) : null;
                      return (
                        <CommandItem key={et.key} value={`${et.label} ${category}`} onSelect={() => { onChange(et.key); setOpen(false); }}>
                          {ItemIcon ? <ItemIcon className="mr-2 h-4 w-4" /> : null}
                          <span className="flex-1">{et.label}</span>
                          {value === et.key ? <span className="h-4 w-4">✓</span> : null}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ))
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}


