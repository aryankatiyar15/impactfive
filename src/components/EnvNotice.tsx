export function EnvNotice() {
  return (
    <div className="rounded-[8px] border border-coral bg-white p-4 text-sm text-ink">
      <p className="font-bold">Supabase is not configured yet.</p>
      <p className="mt-1 text-muted">
        Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to
        `.env.local`, then restart the dev server.
      </p>
    </div>
  );
}
