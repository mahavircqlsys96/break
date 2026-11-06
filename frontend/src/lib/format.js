import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  parseISO,
} from "date-fns";

export const aed = (n) =>
  `AED ${Number(n || 0).toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;

export const compact = (n) =>
  Number(n || 0).toLocaleString("en", { notation: "compact", maximumFractionDigits: 1 });

const toSafeDate = (val) => {
  if (!val) return null;
  try {
    const d = typeof val === "string" ? parseISO(val) : new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

export const date = (iso) => {
  const d = toSafeDate(iso);
  if (!d) return "—";
  try {
    return format(d, "d MMM yyyy");
  } catch {
    return "—";
  }
};

export const dateTime = (iso) => {
  const d = toSafeDate(iso);
  if (!d) return "—";
  try {
    return format(d, "d MMM yyyy, HH:mm");
  } catch {
    return "—";
  }
};

export const dateRange = (from, to) => {
  const a = toSafeDate(from);
  const b = toSafeDate(to);
  if (!a && !b) return "—";
  if (!b) return date(from);
  if (!a) return date(to);
  try {
    return a.getFullYear() === b.getFullYear()
      ? `${format(a, "d MMM")} – ${format(b, "d MMM yyyy")}`
      : `${format(a, "d MMM yyyy")} – ${format(b, "d MMM yyyy")}`;
  } catch {
    return "—";
  }
};

export const ago = (iso) => {
  const d = toSafeDate(iso);
  if (!d) return "—";
  try {
    return Math.abs(differenceInCalendarDays(new Date(), d)) > 30
      ? date(iso)
      : `${formatDistanceToNowStrict(d)} ago`;
  } catch {
    return "—";
  }
};

export const label = (s) =>
  s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

export const initials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
