"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Boxes, KeyRound, Loader2, Mail, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Field, inputClass } from "@/components/Field";
import { supabase } from "@/lib/supabase";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { isConfigured } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setIsBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              display_name: [firstName.trim(), lastName.trim()].filter(Boolean).join(" ")
            }
          }
        });
        if (signUpError) throw signUpError;
        setMessage("Check your email to confirm your account, then sign in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push("/account");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function sendMagicLink() {
    if (!supabase || !email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setIsBusy(true);
    setError("");
    setMessage("");
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (otpError) throw otpError;
      setMessage("Magic link sent. Open it on this device to continue.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send magic link.");
    } finally {
      setIsBusy(false);
    }
  }

  if (!isConfigured) {
    return (
      <AuthCard title="Auth is ready to connect" subtitle="Add your Supabase keys to enable live signup and login.">
        <div className="rounded-[8px] bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`, then restart `npm run dev`.
          The app is still in local demo mode until those are set.
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={mode === "signup" ? "Create your workforce account" : "Welcome back"}
      subtitle={mode === "signup" ? "Start with email/password. Magic links work after your email is known." : "Sign in to your workspace, or send yourself a magic link."}
    >
      <form onSubmit={submitPassword} className="grid gap-4">
        {error ? <p className="rounded-[8px] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
        {message ? <p className="rounded-[8px] bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</p> : null}
        {mode === "signup" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name">
              <input className={inputClass} value={firstName} onChange={(event) => setFirstName(event.target.value)} required autoComplete="given-name" />
            </Field>
            <Field label="Last name">
              <input className={inputClass} value={lastName} onChange={(event) => setLastName(event.target.value)} required autoComplete="family-name" />
            </Field>
          </div>
        ) : null}
        <Field label="Email">
          <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        </Field>
        <Field label="Password">
          <input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
        </Field>
        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 text-sm font-semibold text-white shadow-panel transition hover:-translate-y-0.5" disabled={isBusy}>
          {isBusy ? <Loader2 className="animate-spin" size={17} /> : <KeyRound size={17} />}
          {mode === "signup" ? "Create Account" : "Sign In"}
        </button>
      </form>
      <div className="mt-3 grid gap-3">
        <button
          type="button"
          onClick={() => void sendMagicLink()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-zinc-200 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5"
          disabled={isBusy}
        >
          <Mail size={17} />
          Send Magic Link
        </button>
        <Link href={mode === "signup" ? "/login" : "/signup"} className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-signal">
          {mode === "signup" ? "Already have an account?" : "Need an account?"}
          <ArrowRight size={15} />
        </Link>
      </div>
    </AuthCard>
  );
}

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-md place-items-center">
      <section className="w-full overflow-hidden rounded-[8px] border border-zinc-200 bg-white shadow-panel animate-rise">
        <div className="bg-gradient-to-r from-ink via-signal to-mint p-6 text-white">
          <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-white/15">
            <Boxes size={24} />
          </div>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Sparkles size={14} />SiteTrack workforce</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-white/80">{subtitle}</p>
        </div>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}
