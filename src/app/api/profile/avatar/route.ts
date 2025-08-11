import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function POST(req: Request): Promise<Response> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'no_file' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from('avatars').upload(path, bytes, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    });
    if (upErr) {
      if (upErr.message && /Bucket not found/i.test(upErr.message)) {
        return NextResponse.json({ ok: false, error: 'Bucket not found. Please create a public bucket named "avatars" in Supabase Storage.' }, { status: 500 });
      }
      throw upErr;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = urlData.publicUrl;

    const { error: profErr } = await supabase
      .from('user_profile')
      .upsert({ user_id: user.id, avatar_url: avatarUrl }, { onConflict: 'user_id' })
      .select('user_id')
      .maybeSingle();
    if (profErr) throw profErr;

    return NextResponse.redirect(new URL('/profile', req.url));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'upload_failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
