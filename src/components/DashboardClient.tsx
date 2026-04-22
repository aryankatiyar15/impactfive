"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { EnvNotice } from "@/components/EnvNotice";
import { MessageBanner } from "@/components/MessageBanner";
import { StatCard } from "@/components/StatCard";
import { getSupabaseClient } from "@/lib/supabase";
import { normalizeProfile } from "@/lib/normalizers";
import { todayIsoDate } from "@/lib/draw";
import type { Charity, Message, Score, UserProfile } from "@/lib/types";

export function DashboardClient() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [score, setScore] = useState("30");
  const [playedOn, setPlayedOn] = useState(todayIsoDate());
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingScore, setSavingScore] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const loadDashboard = useCallback(async () => {
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

    await supabase.from("users").upsert(
      {
        id: currentUser.id,
        email: currentUser.email ?? "",
        full_name: currentUser.user_metadata?.full_name ?? null
      },
      { ignoreDuplicates: true, onConflict: "id" }
    );

    const [profileResult, charityResult, scoresResult] = await Promise.all([
      supabase
        .from("users")
        .select("id,email,full_name,is_admin,charity_id,created_at,updated_at,charities(name)")
        .eq("id", currentUser.id)
        .single(),
      supabase.from("charities").select("*").order("name", { ascending: true }),
      supabase
        .from("scores")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("played_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

    if (profileResult.data) {
      const loadedProfile = normalizeProfile(profileResult.data);
      setProfile(loadedProfile);
      setFullName(loadedProfile.full_name ?? "");
    }

    if (charityResult.data) {
      setCharities(charityResult.data as Charity[]);
    }

    if (scoresResult.data) {
      setScores(scoresResult.data as Score[]);
    }

    if (profileResult.error || charityResult.error || scoresResult.error) {
      setMessage({
        type: "error",
        text:
          profileResult.error?.message ||
          charityResult.error?.message ||
          scoresResult.error?.message ||
          "Unable to load dashboard."
      });
    }

    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function trimScores(userId: string) {
    if (!supabase) {
      return;
    }

    const { data } = await supabase
      .from("scores")
      .select("id")
      .eq("user_id", userId)
      .order("played_on", { ascending: false })
      .order("created_at", { ascending: false })
      .range(5, 50);

    if (data && data.length > 0) {
      await supabase
        .from("scores")
        .delete()
        .in(
          "id",
          data.map((row) => row.id)
        );
    }
  }

  async function handleScoreSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !user) {
      return;
    }

    const stableford = Number(score);
    if (!Number.isInteger(stableford) || stableford < 1 || stableford > 45) {
      setMessage({ type: "error", text: "Score must be a whole number from 1 to 45." });
      return;
    }

    setSavingScore(true);
    setMessage(null);

    const { data: duplicate, error: duplicateError } = await supabase
      .from("scores")
      .select("id")
      .eq("user_id", user.id)
      .eq("played_on", playedOn)
      .maybeSingle();

    if (duplicateError) {
      setMessage({ type: "error", text: duplicateError.message });
      setSavingScore(false);
      return;
    }

    if (duplicate && duplicate.id !== editingScoreId) {
      setMessage({
        type: "error",
        text: "A score already exists for that date. Choose a different date."
      });
      setSavingScore(false);
      return;
    }

    const { error } = editingScoreId
      ? await supabase
          .from("scores")
          .update({
            score: stableford,
            played_on: playedOn
          })
          .eq("id", editingScoreId)
          .eq("user_id", user.id)
      : await supabase.from("scores").insert({
          user_id: user.id,
          score: stableford,
          played_on: playedOn
        });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setSavingScore(false);
      return;
    }

    await trimScores(user.id);
    setEditingScoreId(null);
    setMessage({
      type: "success",
      text: editingScoreId
        ? "Score updated. Your latest five are retained."
        : "Score saved. Your latest five are retained."
    });
    await loadDashboard();
    setSavingScore(false);
  }

  function startEditingScore(row: Score) {
    setEditingScoreId(row.id);
    setPlayedOn(row.played_on);
    setScore(String(row.score));
    setMessage({ type: "info", text: "Editing selected score." });
  }

  function cancelEditingScore() {
    setEditingScoreId(null);
    setPlayedOn(todayIsoDate());
    setScore("30");
    setMessage(null);
  }

  async function deleteScore(row: Score) {
    if (!supabase || !user) {
      return;
    }

    const { error } = await supabase
      .from("scores")
      .delete()
      .eq("id", row.id)
      .eq("user_id", user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    if (editingScoreId === row.id) {
      cancelEditingScore();
    }

    setMessage({ type: "success", text: "Score deleted." });
    await loadDashboard();
  }

  async function handleCharityChange(charityId: string) {
    if (!supabase || !user) {
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({ charity_id: charityId || null })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({ type: "success", text: "Charity selection updated." });
    await loadDashboard();
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !user) {
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName || null })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({ type: "success", text: "Profile updated." });
    await loadDashboard();
  }

  async function signOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
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
        <p className="text-muted">Loading dashboard...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-black uppercase text-mint">User Dashboard</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}.
          </h1>
          <p className="mt-2 text-muted">
            Manage your profile, charity choice, and latest Stableford scores.
          </p>
        </div>
        <button
          className="focus-ring rounded-[6px] border border-ink bg-panel px-4 py-2 font-bold transition hover:bg-[#eef5f1]"
          onClick={signOut}
          type="button"
        >
          Sign out
        </button>
      </div>

      <div className="mt-6">
        <MessageBanner message={message} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Subscription" value="Active" detail="Preview access" />
        <StatCard label="Stored scores" value={`${scores.length}/5`} detail="Latest dated entries" />
        <StatCard label="Contribution" value="10%" detail="Minimum charity share" />
        <StatCard
          label="Selected charity"
          value={profile?.charities?.name ?? "None"}
          detail="Can be updated anytime"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <form
            className="rounded-[8px] border border-line bg-panel p-5"
            onSubmit={handleProfileSave}
          >
            <h2 className="text-xl font-black">Profile</h2>
            <p className="mt-1 text-sm text-muted">{profile?.email}</p>
            <label className="mt-4 block">
              <span className="text-sm font-bold">Full name</span>
              <input
                className="focus-ring mt-2 w-full rounded-[6px] border border-line px-3 py-3"
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                type="text"
                value={fullName}
              />
            </label>
            <button
              className="focus-ring mt-4 rounded-[6px] bg-ink px-4 py-2 font-bold text-white transition hover:bg-mint"
              type="submit"
            >
              Save profile
            </button>
          </form>

          <div className="rounded-[8px] border border-line bg-panel p-5">
            <h2 className="text-xl font-black">Charity Selection</h2>
            <p className="mt-1 text-sm text-muted">
              Choose one of the available charities.
            </p>
            <select
              className="focus-ring mt-4 w-full rounded-[6px] border border-line bg-white px-3 py-3"
              onChange={(event) => handleCharityChange(event.target.value)}
              value={profile?.charity_id ?? ""}
            >
              <option value="">No charity selected</option>
              {charities.map((charity) => (
                <option key={charity.id} value={charity.id}>
                  {charity.name}
                </option>
              ))}
            </select>
            <div className="mt-4 space-y-3">
              {charities.map((charity) => (
                <div className="border-t border-line pt-3" key={charity.id}>
                  <p className="font-bold">{charity.name}</p>
                  <p className="mt-1 text-sm text-muted">{charity.impact_summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-line bg-panel p-5">
            <h2 className="text-xl font-black">Participation Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="font-bold">Draw entries</span>
                <span>{scores.length >= 5 ? "1 active entry" : "Pending 5 scores"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="font-bold">Upcoming draw</span>
                <span>Monthly random draw</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold">Winnings overview</span>
                <span>Total won: 0 | Payment: none</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-panel p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-black">Stableford Scores</h2>
              <p className="mt-1 text-sm text-muted">
                One score per date. Edit or delete an existing date entry.
              </p>
            </div>
          </div>

          <form
            className="mt-5 grid gap-3 border-y border-line py-4 sm:grid-cols-[1fr_1fr_auto]"
            onSubmit={handleScoreSubmit}
          >
            <label className="block">
              <span className="text-sm font-bold">Date</span>
              <input
                className="focus-ring mt-2 w-full rounded-[6px] border border-line bg-white px-3 py-3"
                max={todayIsoDate()}
                onChange={(event) => setPlayedOn(event.target.value)}
                required
                type="date"
                value={playedOn}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Score</span>
              <input
                className="focus-ring mt-2 w-full rounded-[6px] border border-line bg-white px-3 py-3"
                max={45}
                min={1}
                onChange={(event) => setScore(event.target.value)}
                required
                type="number"
                value={score}
              />
            </label>
            <button
              className="focus-ring self-end rounded-[6px] bg-ink px-4 py-3 font-bold text-white transition hover:bg-mint"
              disabled={savingScore}
              type="submit"
            >
              {savingScore ? "Saving..." : editingScoreId ? "Update" : "Add"}
            </button>
          </form>

          {editingScoreId ? (
            <button
              className="focus-ring mt-3 rounded-[6px] border border-ink bg-panel px-4 py-2 text-sm font-bold transition hover:bg-[#eef5f1]"
              onClick={cancelEditingScore}
              type="button"
            >
              Cancel edit
            </button>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-sm text-muted">
                  <th className="py-3 pr-3">Date</th>
                  <th className="py-3 pr-3">Score</th>
                  <th className="py-3 pr-3">Stored</th>
                  <th className="py-3 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scores.length === 0 ? (
                  <tr>
                    <td className="py-5 text-muted" colSpan={4}>
                      No scores yet.
                    </td>
                  </tr>
                ) : (
                  scores.map((row) => (
                    <tr className="border-b border-line" key={row.id}>
                      <td className="py-3 pr-3 font-bold">{row.played_on}</td>
                      <td className="py-3 pr-3">{row.score}</td>
                      <td className="py-3 pr-3 text-sm text-muted">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex gap-2">
                          <button
                            className="focus-ring rounded-[6px] border border-line px-3 py-2 text-sm font-bold transition hover:bg-[#eef5f1]"
                            onClick={() => startEditingScore(row)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="focus-ring rounded-[6px] border border-coral px-3 py-2 text-sm font-bold text-coral transition hover:bg-[#fff7f4]"
                            onClick={() => deleteScore(row)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
