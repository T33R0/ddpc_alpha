"use client";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export type SignInButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & { "data-testid"?: string }
>;

export function SignInButton({ children = "Sign in with Google", ...props }: SignInButtonProps) {
  const supabase = getBrowserSupabase();
  return (
    <button
      type="button"
      {...props}
      onClick={async () => {
        const origin = window.location.origin;
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${origin}/auth/callback` },
        });
      }}
    >
      {children}
    </button>
  );
}

export default SignInButton;
