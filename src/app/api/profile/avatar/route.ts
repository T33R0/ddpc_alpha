import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { deriveUsernameFromEmail, normalizeUsername } from "@/lib/profileUtils";

export async function POST(req: Request): Promise<Response> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'no_file' }, { status: 400 });
  }

  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });
    if (upErr) {
      const msg = upErr.message || String(upErr);
      if (/Bucket not found/i.test(msg)) {
        return NextResponse.json({ ok: false, error: 'Bucket not found. Please create a public bucket named "avatars" in Supabase Storage.' }, { status: 500 });
      }
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = urlData.publicUrl;

    // Ensure profile exists with required username; then update avatar_url
    const { data: existing, error: getErr } = await supabase
      .from('user_profile')
      .select('user_id, username, display_name')
      .eq('user_id', user.id)
      .maybeSingle();
    if (getErr) return NextResponse.json({ ok: false, error: getErr.message || String(getErr) }, { status: 500 });

    if (existing?.user_id) {
      const { error: updErr } = await supabase
        .from('user_profile')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);
      if (updErr) return NextResponse.json({ ok: false, error: updErr.message || String(updErr) }, { status: 500 });
    } else {
      const base = normalizeUsername(deriveUsernameFromEmail(user.email));
      const { error: insErr } = await supabase
        .from('user_profile')
        .insert({ user_id: user.id, username: base, display_name: base, avatar_url: avatarUrl, is_public: true });
      if (insErr) return NextResponse.json({ ok: false, error: insErr.message || String(insErr) }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: avatarUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'upload_failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
