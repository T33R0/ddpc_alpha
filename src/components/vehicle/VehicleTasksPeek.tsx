import Link from "next/link";

type Task = { id: string; title: string; due: string | null; tags: string[] | null };

export default function VehicleTasksPeek({ vehicleId, tasks }: { vehicleId: string; tasks: Task[] }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-5 flex flex-col">
      <div className="text-base font-semibold mb-3">Open tasks</div>
      {tasks.length === 0 ? (
        <div className="text-sm text-gray-600">No open tasks.</div>
      ) : (
        <ul className="divide-y">
          {tasks.slice(0, 3).map((t) => (
            <li key={t.id} className="py-2">
              <Link href={`/vehicles/${vehicleId}/tasks`} className="flex items-center justify-between hover:underline">
                <div className="text-sm text-gray-900">{t.title}</div>
                <div className="text-xs text-gray-600 flex items-center gap-2">
                  {t.due ? <span>Due {new Date(t.due).toLocaleDateString()}</span> : <span>—</span>}
                  <span>{(t.tags ?? []).join(", ")}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 text-xs text-blue-600"><Link href={`/vehicles/${vehicleId}/tasks`} className="hover:underline">View all tasks</Link></div>
    </div>
  );
}


