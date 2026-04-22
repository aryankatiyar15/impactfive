import Link from "next/link";
import { Header } from "@/components/Header";
import { BRAND_NAME } from "@/lib/brand";

const charities = ["Bright Start", "Open Table", "Green Steps", "CareLine"];

export default function Home() {
  return (
    <main>
      <Header />
      <section className="hero-grid border-b border-line">
        <div className="mx-auto grid min-h-[78svh] max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-black uppercase text-coral">
              {BRAND_NAME}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-6xl">
              Your latest five scores can move a cause forward.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              Subscribe, choose a charity, record Stableford scores, and take
              part in a clean monthly-style draw experience built around impact
              first.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="rounded-[6px] bg-ink px-5 py-3 text-center font-bold text-white transition hover:bg-mint"
                href="/login"
              >
                Subscribe
              </Link>
              <Link
                className="rounded-[6px] border border-ink bg-panel px-5 py-3 text-center font-bold text-ink transition hover:bg-[#eef5f1]"
                href="/dashboard"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="hero-board rounded-[8px] p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="text-sm font-bold text-muted">Member snapshot</p>
                <p className="text-2xl font-black text-ink">Impact draw ready</p>
              </div>
              <span className="rounded-[6px] bg-[#eef5f1] px-3 py-2 text-sm font-bold text-mint">
                Active
              </span>
            </div>
            <div className="grid border-b border-line py-5 sm:grid-cols-3">
              {[31, 37, 29].map((score, index) => (
                <div
                  className="border-b border-line p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                  key={score}
                >
                  <p className="text-xs font-bold text-muted">
                    Score {index + 1}
                  </p>
                  <p className="mt-2 text-3xl font-black">{score}</p>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-[1fr_0.8fr]">
              <div className="border-b border-line p-4 sm:border-b-0 sm:border-r">
                <p className="text-sm font-bold text-muted">Selected cause</p>
                <p className="mt-2 text-xl font-black">Open Table Kitchen</p>
                <div className="mt-4 h-2 rounded-full bg-line">
                  <div className="h-2 w-2/3 rounded-full bg-coral" />
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-muted">Draw numbers</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[8, 14, 22, 33, 41].map((number) => (
                    <span className="number-tile" key={number}>
                      {number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-3">
        {[
          ["1", "Subscribe", "Create an account and activate access."],
          ["2", "Choose a charity", "Select the cause your membership supports."],
          ["3", "Enter the draw", "Keep five dated scores for the next result."]
        ].map(([step, title, copy]) => (
          <div className="rounded-[8px] border border-line bg-panel p-5" key={step}>
            <span className="number-tile bg-paper">{step}</span>
            <h2 className="mt-4 text-xl font-black">{title}</h2>
            <p className="mt-2 leading-7 text-muted">{copy}</p>
          </div>
        ))}
      </section>

      <section className="border-y border-line bg-panel">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-mint">
              Dummy charities included
            </p>
            <p className="mt-2 text-2xl font-black">
              Pick a cause now, update it later.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {charities.map((charity) => (
              <span
                className="rounded-[6px] border border-line bg-paper px-3 py-2 text-sm font-bold"
                key={charity}
              >
                {charity}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
