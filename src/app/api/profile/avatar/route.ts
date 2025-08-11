import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

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

    const { error: profErr } = await supabase
      .from('user_profile')
      .upsert({ user_id: user.id, avatar_url: avatarUrl }, { onConflict: 'user_id' })
      .select('user_id')
      .maybeSingle();
    if (profErr) {
      return NextResponse.json({ ok: false, error: profErr.message || String(profErr) }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: avatarUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'upload_failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
