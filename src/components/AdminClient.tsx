"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { EnvNotice } from "@/components/EnvNotice";
import { MessageBanner } from "@/components/MessageBanner";
import { StatCard } from "@/components/StatCard";
import { generateDrawNumbers, todayIsoDate } from "@/lib/draw";
import {
  normalizeAdminScore,
  normalizeDraw,
  normalizeProfile
} from "@/lib/normalizers";
import { getSupabaseClient } from "@/lib/supabase";
import type { AdminScore, Draw, Message, UserProfile } from "@/lib/types";

export function AdminClient() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [scores, setScores] = useState<AdminScore[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const loadAdmin = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session?.user) {
      router.push("/login");
      return;
    }

    const currentUser = sessionData.session.user;
    setUser(currentUser);

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id,email,full_name,is_admin,charity_id,created_at,updated_at,charities(name)")
      .eq("id", currentUser.id)
      .single();

    const adminProfile = profile ? normalizeProfile(profile) : null;

    if (profileError || !adminProfile?.is_admin) {
      setAllowed(false);
      setMessage({
        type: "error",
        text: "Admin access is required. Promote your user in public.users first."
      });
      setLoading(false);
      return;
    }

    setAllowed(true);

    const [usersResult, scoresResult, drawsResult] = await Promise.all([
      supabase
        .from("users")
        .select("id,email,full_name,is_admin,charity_id,created_at,updated_at,charities(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("scores")
        .select("id,user_id,score,played_on,created_at,users(email,full_name)")
        .order("played_on", { ascending: false })
        .limit(100),
      supabase
        .from("draws")
        .select("id,draw_date,drawn_numbers,status,triggered_by,created_at,users(email)")
        .order("created_at", { ascending: false })
        .limit(25)
    ]);

    if (usersResult.data) {
      setUsers(usersResult.data.map(normalizeProfile));
    }

    if (scoresResult.data) {
      setScores(scoresResult.data.map(normalizeAdminScore));
    }

    if (drawsResult.data) {
      setDraws(drawsResult.data.map(normalizeDraw));
    }

    if (usersResult.error || scoresResult.error || drawsResult.error) {
      setMessage({
        type: "error",
        text:
          usersResult.error?.message ||
          scoresResult.error?.message ||
          drawsResult.error?.message ||
          "Unable to load admin data."
      });
    }

    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  async function triggerDraw(status: Draw["status"]) {
    if (!supabase || !user) {
      return;
    }

    setTriggering(true);
    setMessage(null);
    const numbers = generateDrawNumbers();
    const { error } = await supabase.from("draws").insert({
      draw_date: todayIsoDate(),
      drawn_numbers: numbers,
      status,
      triggered_by: user.id
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: `${status === "published" ? "Draw published" : "Simulation saved"}: ${numbers.join(", ")}`
      });
      await loadAdmin();
    }

    setTriggering(false);
  }

  if (!supabase) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <EnvNotice />
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-muted">Loading admin panel...</p>
      </section>
    );
  }

  if (!allowed) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <MessageBanner message={message} />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-black uppercase text-coral">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Users, scores, and draws.
          </h1>
          <p className="mt-2 text-muted">
            View member data and trigger a random draw result.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="focus-ring rounded-[6px] border border-ink bg-panel px-5 py-3 font-bold text-ink transition hover:bg-[#eef5f1]"
            disabled={triggering}
            onClick={() => triggerDraw("simulated")}
            type="button"
          >
            {triggering ? "Working..." : "Run simulation"}
          </button>
          <button
            className="focus-ring rounded-[6px] bg-ink px-5 py-3 font-bold text-white transition hover:bg-mint"
            disabled={triggering}
            onClick={() => triggerDraw("published")}
            type="button"
          >
            {triggering ? "Working..." : "Publish draw"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <MessageBanner message={message} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Users" value={`${users.length}`} detail="Visible to admins" />
        <StatCard label="Scores" value={`${scores.length}`} detail="Latest admin sample" />
        <StatCard label="Draws" value={`${draws.length}`} detail="Published results" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-[8px] border border-line bg-panel p-5">
          <h2 className="text-xl font-black">Users</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-sm text-muted">
                  <th className="py-3 pr-3">Email</th>
                  <th className="py-3 pr-3">Name</th>
                  <th className="py-3 pr-3">Charity</th>
                  <th className="py-3 pr-3">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr className="border-b border-line" key={row.id}>
                    <td className="py-3 pr-3 font-bold">{row.email}</td>
                    <td className="py-3 pr-3">{row.full_name ?? "-"}</td>
                    <td className="py-3 pr-3">{row.charities?.name ?? "-"}</td>
                    <td className="py-3 pr-3">
                      {row.is_admin ? (
                        <span className="rounded-[6px] bg-[#f6efe1] px-2 py-1 text-sm font-bold text-ink">
                          Admin
                        </span>
                      ) : (
                        <span className="rounded-[6px] bg-[#eef5f1] px-2 py-1 text-sm font-bold text-mint">
                          User
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-panel p-5">
          <h2 className="text-xl font-black">User Scores</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-sm text-muted">
                  <th className="py-3 pr-3">User</th>
                  <th className="py-3 pr-3">Date</th>
                  <th className="py-3 pr-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {scores.length === 0 ? (
                  <tr>
                    <td className="py-5 text-muted" colSpan={3}>
                      No scores yet.
                    </td>
                  </tr>
                ) : (
                  scores.map((row) => (
                    <tr className="border-b border-line" key={row.id}>
                      <td className="py-3 pr-3 font-bold">
                        {row.users?.full_name || row.users?.email || row.user_id}
                      </td>
                      <td className="py-3 pr-3">{row.played_on}</td>
                      <td className="py-3 pr-3">{row.score}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-black">Draw Results</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {draws.length === 0 ? (
            <p className="text-muted">No draw results yet.</p>
          ) : (
            draws.map((draw) => (
              <div className="rounded-[8px] border border-line bg-paper p-4" key={draw.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">{draw.draw_date}</p>
                  <span className="rounded-[6px] bg-panel px-2 py-1 text-sm font-bold text-muted">
                    {draw.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {draw.drawn_numbers.map((number) => (
                    <span className="number-tile" key={`${draw.id}-${number}`}>
                      {number}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted">
                  Triggered by {draw.users?.email ?? "admin"} at{" "}
                  {new Date(draw.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
