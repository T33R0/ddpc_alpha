"use client";
import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/ToastProvider";

type ActionState = { ok?: boolean; error?: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="px-3 py-1 rounded bg-black text-white disabled:opacity-50">
      {pending ? "Adding…" : "Add"}
    </button>
  );
}

export default function AddMemberForm({ action }: { action: (prevState: ActionState | undefined, formData: FormData) => Promise<ActionState> }) {
  const { success, error } = useToast();
  const [state, formAction] = useFormState<ActionState, FormData>(action, {});

  useEffect(() => {
    if (!state) return;
    if (state.error) error(state.error);
    if (state.ok) success("Member added");
  }, [state, success, error]);

  return (
    <form action={formAction} className="flex items-center gap-2 border rounded p-3 bg-white" data-test="members-add">
      <input name="email" type="email" placeholder="user@example.com" className="border rounded px-2 py-1 flex-1" required />
      <select name="role" className="border rounded px-2 py-1 text-sm">
        <option value="MANAGER">MANAGER</option>
        <option value="CONTRIBUTOR">CONTRIBUTOR</option>
        <option value="VIEWER">VIEWER</option>
      </select>
      <SubmitButton />
      {state?.error && <div className="text-xs text-red-600 ml-2">{state.error}</div>}
    </form>
  );
}


