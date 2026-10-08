import { forwardRef, useState, useEffect } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { initials, label } from "@/lib/format";

// ---------- Button ----------

const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover shadow-sm",
  secondary: "bg-surface text-ink border border-line hover:bg-bg",
  soft: "bg-accent-soft text-primary hover:bg-accent/20",
  ghost: "text-ink-muted hover:bg-accent-soft hover:text-primary",
  danger: "bg-danger text-white hover:bg-danger/90",
  "danger-soft": "bg-danger-soft text-danger hover:bg-danger/15",
};

export const Button = forwardRef(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      icon,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-8 px-3.5 text-xs",
        size === "md" && "h-10 px-5 text-sm",
        size === "lg" && "h-12 px-7 text-[15px]",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export function IconButton({ className, label: aria, ...rest }) {
  return (
    <button
      aria-label={aria}
      title={aria}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-accent-soft hover:text-primary",
        className,
      )}
      {...rest}
    />
  );
}

// ---------- Form controls ----------

export function Field({ label: text, hint, error, children, className }) {
  return (
    <div className={className}>
      {text && <label className="label">{text}</label>}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef(({ className, leading, ...rest }, ref) =>
  leading ? (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-ink-muted">
        {leading}
      </span>
      <input ref={ref} className={cn("field ps-10", className)} {...rest} />
    </div>
  ) : (
    <input ref={ref} className={cn("field", className)} {...rest} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef(({ className, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={cn("field h-auto min-h-[110px] py-3 leading-relaxed", className)}
    {...rest}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef(({ className, options, ...rest }, ref) => (
  <select
    ref={ref}
    className={cn(
      "field cursor-pointer appearance-none bg-[length:16px] bg-[right_12px_center] rtl:bg-[left_12px_center] bg-no-repeat pe-9",
      className,
    )}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237A7686' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    }}
    {...rest}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
));
Select.displayName = "Select";

/** Toggle switch in the lavender style used by the Permissions screen. */
export function Toggle({ checked, onChange, label: text, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={text}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50",
        checked ? "bg-accent" : "bg-line",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow transition",
          checked
            ? "translate-x-[22px] rtl:-translate-x-[22px]"
            : "translate-x-0.5 rtl:-translate-x-0.5",
        )}
      />
    </button>
  );
}

/** Selectable chip, like the amenity / category pickers in the Add Property flow. */
export function Chip({ selected, onClick, children, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-medium transition",
        selected
          ? "border-accent bg-accent-soft text-primary"
          : "border-line bg-surface text-ink hover:border-accent/60",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

// ---------- Display ----------

const tones = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-[#B8740F]",
  danger: "bg-danger-soft text-danger",
  accent: "bg-accent-soft text-primary",
  neutral: "bg-line/60 text-ink-muted",
};

export function Badge({ tone = "neutral", children, className, dot }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const STATUS_TONE = {
  live: "success",
  active: "success",
  confirmed: "success",
  paid: "success",
  published: "success",
  resolved: "success",
  succeeded: "success",
  sent: "success",
  replied: "success",
  approved: "success",
  pending: "warning",
  scheduled: "warning",
  processing: "warning",
  new: "warning",
  open: "warning",
  flagged: "warning",
  on_hold: "warning",
  rejected: "danger",
  blocked: "danger",
  suspended: "danger",
  cancelled: "danger",
  failed: "danger",
  refunded: "danger",
  completed: "accent",
  draft: "neutral",
  unlisted: "neutral",
  hidden: "neutral",
  closed: "neutral",
  dismissed: "neutral",
  inactive: "neutral",
  Pending: "warning",
  Reviewed: "accent",
  Resolved: "success",
  Rejected: "danger",
};

export function StatusBadge({ status }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? "neutral"} dot>
      {label(status)}
    </Badge>
  );
}

const AVATAR_BG = [
  "bg-accent-soft text-primary",
  "bg-warning-soft text-[#B8740F]",
  "bg-success-soft text-success",
  "bg-[#F3E8E2] text-[#9A5B3E]",
];
export function Avatar({ name, src, size = 36, className }) {
  const [failed, setFailed] = useState(!src);
  
  // Reset failed state if src changes
  useEffect(() => {
    setFailed(!src);
  }, [src]);

  const tone = AVATAR_BG[(name || "").length % AVATAR_BG.length];

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        tone,
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name || "?")}
    </span>
  );
}

/** Property photo with a branded fallback when the image fails to load. */
export function Photo({ src, alt, className }) {
  const [failed, setFailed] = useState(!src);
  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-accent-soft to-[#E9E2D6] text-primary/40",
          className,
        )}
        aria-label={alt}
      >
        <ImageOff className="size-5" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}

export function Card({ className, children, title, action, padded = true }) {
  return (
    <section className={cn("card", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-5">
          {title && <h3 className="text-[15px] font-bold">{title}</h3>}
          {action}
        </header>
      )}
      <div className={cn(padded && "p-5")}>{children}</div>
    </section>
  );
}

export function Spinner({ className }) {
  return (
    <Loader2 className={cn("size-6 animate-spin text-accent", className)} />
  );
}

export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner />
    </div>
  );
}

export function Stars({ value }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold">
      <span className="text-warning">★</span>
      {value ? value.toFixed(value % 1 ? 2 : 1) : "—"}
    </span>
  );
}
