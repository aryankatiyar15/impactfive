import { Header } from "@/components/Header";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main>
      <Header />
      <section className="mx-auto grid min-h-[calc(100svh-73px)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1fr]">
        <div>
          <p className="text-sm font-black uppercase text-coral">
            Member access
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Sign in or activate your subscription preview.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
            Once authenticated, members can choose a charity, add dated scores,
            and take part in the draw flow.
          </p>
        </div>
        <AuthForm />
      </section>
    </main>
  );
}
