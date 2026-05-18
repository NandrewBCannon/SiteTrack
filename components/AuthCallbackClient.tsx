"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      if (!supabase) {
        setError("Supabase keys are not configured yet.");
        return;
      }

      try {
        const code = searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (cancelled) return;

        if (data.session) {
          router.replace("/");
          return;
        }

        setError("No active session was found. Try signing in again.");
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not finish sign in.");
      }
    }

    void finishAuth();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-md place-items-center">
      <section className="w-full rounded-[8px] border border-zinc-200 bg-white p-6 text-center shadow-panel animate-rise">
        {error ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in needs another try</h1>
            <p className="mt-3 rounded-[8px] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>
            <Link href="/login" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-semibold text-white">
              Back to Login
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto animate-spin text-signal" size={30} />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Finishing sign in...</h1>
            <p className="mt-2 text-sm text-steel">Setting up your SiteTrack session.</p>
          </>
        )}
      </section>
    </div>
  );
}
