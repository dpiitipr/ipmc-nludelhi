import Link from 'next/link';

/*
  Palette (swatches only):
  Transparent Yellow #F5EFC6 · Sceptre Red #4D0E12 · Cerulean Blue #A5BCD6
  Potting Soil #4A2E27 · Java Brown #231815
*/

export const metadata = {
  title: 'Page not found',
};

const ringLight =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4D0E12]';
const ringDark =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A5BCD6]';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5EFC6] font-sans text-[#231815] antialiased selection:bg-[#4D0E12] selection:text-[#F5EFC6]">
      {/* ---------- HERO ---------- */}
      <header className="relative isolate overflow-hidden bg-[#231815] text-[#F5EFC6]">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-[#231815] via-[#231815] to-[#4D0E12]" />
        <div className="mx-auto max-w-5xl px-6 pb-20 pt-32 sm:pb-24 sm:pt-40">
          <p className="font-serif text-7xl font-bold leading-none text-[#A5BCD6] sm:text-9xl">
            404
          </p>
          <h1 className="mt-6 max-w-3xl font-serif text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Page not found
          </h1>
          <p className="mt-6 max-w-xl border-l-2 border-[#A5BCD6] pl-4 font-serif text-lg italic leading-snug text-[#F5EFC6]/85 sm:text-xl">
            The page you are looking for may have moved, or the link may be out of date.
          </p>
        </div>
      </header>

      {/* ---------- ACTIONS ---------- */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 rounded-full bg-[#4D0E12] px-6 py-2.5 text-sm font-semibold text-[#F5EFC6] transition hover:bg-[#231815] ${ringLight}`}
          >
            <span aria-hidden="true">←</span> Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}