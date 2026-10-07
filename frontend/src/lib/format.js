import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  parseISO,
} from "date-fns";

export const aed = (n) =>
  `AED ${n.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;

export const compact = (n) =>
  n.toLocaleString("en", { notation: "compact", maximumFractionDigits: 1 });

export const date = (iso) => (iso ? format(parseISO(iso), "d MMM yyyy") : "—");
export const dateTime = (iso) =>
  iso ? format(parseISO(iso), "d MMM yyyy, HH:mm") : "—";
export const dateRange = (from, to) => {
  const a = parseISO(from);
  const b = parseISO(to);
  return a.getFullYear() === b.getFullYear()
    ? `${format(a, "d MMM")} – ${format(b, "d MMM yyyy")}`
    : `${format(a, "d MMM yyyy")} – ${format(b, "d MMM yyyy")}`;
};
export const ago = (iso) => {
  const d = parseISO(iso);
  return Math.abs(differenceInCalendarDays(new Date(), d)) > 30
    ? date(iso)
    : `${formatDistanceToNowStrict(d)} ago`;
};

export const label = (s) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const initials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
