# Feature Flags

This project uses simple environment-based feature flags to gate in-progress features.

- ENABLE_TASK_EVENT_LINK (server): When `true`, the server allows creating Timeline events that include a `task_id` link during task completion. This affects `/api/work-items/[id]/status` (which may POST to `/api/events`) and `/api/events` (which will accept and persist `task_id`). Default is `false`.

- NEXT_PUBLIC_ENABLE_TASK_EVENT_LINK (client): When `true`, the Tasks UI shows a "Complete" flow that optionally logs a Timeline event at completion via `CompleteModal`. Default is `false` in all environments unless explicitly enabled.

Testing note: In non‑production environments, E2E tests can enable the client gate without building with a public env by setting `localStorage.e2e_enable_task_event_link = "1"`. The Tasks board checks this value only when `process.env.NODE_ENV !== 'production'`.


