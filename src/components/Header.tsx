import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

type HeaderProps = {
  showAdmin?: boolean;
};

export function Header({ showAdmin = false }: HeaderProps) {
  return (
    <header className="border-b border-line bg-paper/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link className="text-lg font-black text-ink" href="/">
          {BRAND_NAME}
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link
            className="rounded-[6px] px-3 py-2 text-muted transition hover:bg-panel hover:text-ink"
            href="/dashboard"
          >
            Dashboard
          </Link>
          {showAdmin ? (
            <Link
              className="rounded-[6px] px-3 py-2 text-muted transition hover:bg-panel hover:text-ink"
              href="/admin"
            >
              Admin
            </Link>
          ) : null}
          <Link
            className="rounded-[6px] bg-ink px-3 py-2 text-white transition hover:bg-mint"
            href="/login"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
