type Props = {
  lastActivityISO: string | null;
  openTaskCount: number;
  doneTaskCount: number;
  eventCount: number;
};

export default function VehicleQuickStats({ lastActivityISO, openTaskCount, doneTaskCount, eventCount }: Props) {
  const last = lastActivityISO ? new Date(lastActivityISO).toLocaleString() : "—";
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-5">
      <div className="text-base font-semibold mb-3">Quick stats</div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Last activity" value={last} />
        <Stat label="Open tasks" value={openTaskCount.toString()} />
        <Stat label="Done tasks" value={doneTaskCount.toString()} />
        <Stat label="Events" value={eventCount.toString()} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-lg font-medium">{value}</div>
    </div>
  );
}


