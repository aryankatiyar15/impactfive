"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EnvNotice } from "@/components/EnvNotice";
import { MessageBanner } from "@/components/MessageBanner";
import { getSupabaseClient } from "@/lib/supabase";
import type { Message } from "@/lib/types";

type Mode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage({ type: "error", text: "Supabase environment variables are missing." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data.user && data.session) {
          await supabase.from("users").upsert({
            id: data.user.id,
            email,
            full_name: fullName || null
          });
          router.push("/dashboard");
          router.refresh();
          return;
        }

        setMessage({
          type: "success",
          text: "Signup created. Check your email if confirmation is enabled in Supabase."
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }

        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Authentication failed."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[8px] border border-line bg-panel p-5 shadow-sm sm:p-6">
      {!supabase ? <EnvNotice /> : null}
      <div className="mb-5 grid grid-cols-2 rounded-[8px] border border-line bg-paper p-1">
        <button
          className={`focus-ring rounded-[6px] px-4 py-2 text-sm font-bold transition ${
            mode === "login" ? "bg-ink text-white" : "text-muted hover:text-ink"
          }`}
          onClick={() => setMode("login")}
          type="button"
        >
          Login
        </button>
        <button
          className={`focus-ring rounded-[6px] px-4 py-2 text-sm font-bold transition ${
            mode === "signup" ? "bg-ink text-white" : "text-muted hover:text-ink"
          }`}
          onClick={() => setMode("signup")}
          type="button"
        >
          Signup
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label className="block">
            <span className="text-sm font-bold text-ink">Full name</span>
            <input
              className="focus-ring mt-2 w-full rounded-[6px] border border-line bg-white px-3 py-3"
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Avery Stone"
              type="text"
              value={fullName}
            />
          </label>
        ) : null}

        <label className="block">
          <span className="text-sm font-bold text-ink">Email</span>
          <input
            autoComplete="email"
            className="focus-ring mt-2 w-full rounded-[6px] border border-line bg-white px-3 py-3"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-ink">Password</span>
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="focus-ring mt-2 w-full rounded-[6px] border border-line bg-white px-3 py-3"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 characters"
            required
            type="password"
            value={password}
          />
        </label>

        <MessageBanner message={message} />

        <button
          className="focus-ring w-full rounded-[6px] bg-ink px-5 py-3 font-bold text-white transition hover:bg-mint"
          disabled={loading}
          type="submit"
        >
          {loading ? "Working..." : mode === "login" ? "Login" : "Create account"}
        </button>
      </form>
    </div>
  );
}
