import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4">
      <section className="glass w-full rounded-2xl p-8 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-brand-100/70">Snake</p>
        <h1 className="mt-2 text-2xl font-semibold text-brand-50 sm:text-3xl">Page Not Found</h1>
        <p className="mt-3 text-sm text-brand-100/70">
          The requested game page does not exist.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-brand-300/35 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-100 transition hover:border-brand-300/70 hover:bg-brand-500/20"
        >
          Back To Game
        </Link>
      </section>
    </main>
  );
}
