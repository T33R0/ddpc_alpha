"use client";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";

export default function AuthButtons() {
  const supabase = getBrowserSupabase();
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setUserEmail(data.session?.user?.email ?? null));
    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSent(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) {
      alert(error.message);
    } else {
      setEmailSent(email);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) alert(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (userEmail) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{userEmail}</span>
        <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <form onSubmit={signInWithEmail} className="flex items-center gap-2">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-2 py-1"
          required
        />
        <button className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" type="submit">Magic link</button>
      </form>
      <button className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700" onClick={signInWithGoogle}>Google</button>
      {emailSent && <span className="text-xs text-green-600">Magic link sent to {emailSent}</span>}
    </div>
  );
}
