import { Logo } from "@/components/Logo";

/** Split screen: brand panel inspired by the app's splash (cream + lavender waves). */
export function AuthShell({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-bg lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="relative z-10 flex flex-col items-center text-center">
          <Logo className="scale-150" compact />
          <p className="mt-8 font-display text-5xl font-semibold text-primary">
            break
          </p>
          <p className="mt-2 text-[15px] text-ink-muted">Find your escape.</p>
          <p className="mt-10 max-w-sm text-[13px] leading-relaxed text-ink-muted">
            Manage farms, vacation homes, resorts and desert camps across the
            UAE — guests, hosts, bookings and payouts in one place.
          </p>
        </div>
        <svg
          className="absolute inset-x-0 bottom-0 w-full"
          viewBox="0 0 800 260"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 120 C 180 60 320 170 520 110 S 760 60 800 90 V260 H0Z"
            fill="#8B7FD6"
            opacity=".18"
          />
          <path
            d="M0 170 C 200 110 360 210 560 160 S 760 130 800 150 V260 H0Z"
            fill="#8B7FD6"
            opacity=".22"
          />
          <path
            d="M0 215 C 220 170 420 250 600 205 S 760 190 800 200 V260 H0Z"
            fill="#4A4372"
            opacity=".18"
          />
        </svg>
      </div>
      <div className="flex items-center justify-center bg-surface px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
