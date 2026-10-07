import { cn } from "@/lib/cn";

/** "break" wordmark with the sun-over-waves emblem from the splash screen. */
export function Logo({ light, className, compact }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 40 40" className="size-9 shrink-0" aria-hidden>
        <rect
          width="40"
          height="40"
          rx="11"
          fill={light ? "#F7F4EE" : "#4A4372"}
        />
        <circle
          cx="20"
          cy="17"
          r="6"
          fill="none"
          stroke={light ? "#4A4372" : "#F7F4EE"}
          strokeWidth="2"
        />
        <path
          d="M9 27c3.5-2.5 7-2.5 11 0s7.5 2.5 11 0"
          fill="none"
          stroke={light ? "#8B7FD6" : "#C9C1F2"}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span
            className={cn(
              "block text-[22px] font-semibold tracking-tight",
              light ? "text-white" : "text-primary",
            )}
          >
            break
          </span>
          <span
            className={cn(
              "block text-[10px] font-medium uppercase tracking-[0.18em]",
              light ? "text-white/60" : "text-ink-muted",
            )}
          >
            Admin
          </span>
        </span>
      )}
    </span>
  );
}
