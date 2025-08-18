'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

// keep in one place if you already have a helper
async function sb() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

const CreatePlanSchema = z.object({
  vehicleId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(2000).optional(),
});

export async function createBuildPlan(formData: FormData) {
  const supabase = await sb();

  const raw = {
    vehicleId: String(formData.get('vehicleId') || ''),
    name: String(formData.get('name') || ''),
    description: String(formData.get('description') || ''),
  };

  const parsed = CreatePlanSchema.safeParse(raw);
  if (!parsed.success) {
    // Don’t throw; surface a friendly error for the page
    return { ok: false, error: parsed.error.flatten().formErrors.join(', ') };
  }

  const { vehicleId, name, description } = parsed.data;

  // Ensure we have an authenticated user for RLS and created_by
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { ok: false, error: 'You must be signed in to create a plan.' };
  }

  // Insert with created_by; RLS will verify garage ownership via policy
  const { error: insErr } = await supabase
    .from('build_plans')
    .insert({
      vehicle_id: vehicleId,
      name,
      description: description || null,
      status: 'open',
      is_default: false,
      created_by: user.id,
    });

  if (insErr) {
    // Log enough to debug on Vercel without leaking secrets to client
    console.error('build_plan_insert_failed', {
      code: insErr.code, details: insErr.details, hint: insErr.hint, message: insErr.message,
    });
    // Map common cases to friendly messages
    const msg =
      insErr.code === '42501' ? 'Not authorized to create a plan for this vehicle.' :
      insErr.code === '23503' ? 'Vehicle does not exist or you lack access.' :
      'Failed to create plan.';
    return { ok: false, error: msg };
  }

  revalidatePath(`/vehicles/${vehicleId}/plans`);
  return { ok: true };
}
