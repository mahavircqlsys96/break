import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Input, Select, Spinner } from "./primitives";

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="font-display text-[28px] font-semibold leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon, hint, tone = "accent" }) {
  const toneCls = {
    accent: "bg-accent-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-[#B8740F]",
    danger: "bg-danger-soft text-danger",
  }[tone];
  return (
    <div className="card flex items-start gap-4 p-5">
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full",
          toneCls,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-bold tracking-tight">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex size-20 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon}
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {message && (
        <p className="mt-1 max-w-sm text-[13px] text-ink-muted">{message}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------- Table ----------

export function DataTable({
  columns,
  rows,
  loading,
  onRowClick,
  sort,
  onSort,
  empty,
}) {
  return (
    <div className="relative overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[720px] text-start">
        <thead>
          <tr className="border-b border-line/70 bg-bg/60">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-ink-muted first:ps-5 last:pe-5",
                  c.className,
                )}
              >
                {c.sortable && onSort ? (
                  <button
                    className="inline-flex items-center gap-1 hover:text-primary"
                    onClick={() => onSort(c.key)}
                  >
                    {c.header}
                    {sort?.sortBy === c.key ? (
                      sort.sortDir === "asc" ? (
                        <ArrowUp className="size-3.5" />
                      ) : (
                        <ArrowDown className="size-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3.5 opacity-40" />
                    )}
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows?.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick && (() => onRowClick(row))}
              className={cn(
                "border-b border-line/50 last:border-0 transition",
                onRowClick && "cursor-pointer hover:bg-accent-soft/40",
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-4 py-3.5 align-middle first:ps-5 last:pe-5",
                    c.className,
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {loading && !rows?.length && (
        <div className="flex h-48 items-center justify-center">
          <Spinner />
        </div>
      )}
      {loading && !!rows?.length && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/50">
          <Spinner />
        </div>
      )}
      {!loading && rows?.length === 0 && empty}
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - page) <= 1,
  );
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 px-5 py-3.5 text-[13px] text-ink-muted">
      <span>
        Showing{" "}
        <b className="text-ink">
          {from}–{to}
        </b>{" "}
        of <b className="text-ink">{total}</b>
      </span>
      <div className="flex items-center gap-1">
        <PageBtn
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          label="Previous page"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </PageBtn>
        {nums.map((n, i) => (
          <span key={n} className="flex items-center gap-1">
            {i > 0 && n - nums[i - 1] > 1 && <span className="px-1">…</span>}
            <PageBtn
              active={n === page}
              onClick={() => onPage(n)}
              label={`Page ${n}`}
            >
              {n}
            </PageBtn>
          </span>
        ))}
        <PageBtn
          disabled={page === pages}
          onClick={() => onPage(page + 1)}
          label="Next page"
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </PageBtn>
      </div>
    </div>
  );
}

function PageBtn({ active, disabled, onClick, children, label }) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-full text-[13px] font-semibold transition disabled:opacity-40",
        active ? "bg-primary text-white" : "text-ink hover:bg-accent-soft",
      )}
    >
      {children}
    </button>
  );
}

export function Toolbar({
  search,
  onSearch,
  placeholder = "Search…",
  children,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 p-4">
      {onSearch && (
        <div className="w-full sm:w-72">
          <Input
            leading={<Search className="size-4" />}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="h-10 rounded-full bg-bg/60"
          />
        </div>
      )}
      {children}
    </div>
  );
}

export function FilterSelect({ value, onChange, options, allLabel }) {
  return (
    <Select
      value={value ?? "all"}
      onChange={(e) => onChange(e.target.value)}
      aria-label={allLabel}
      className="h-10 w-auto min-w-[140px] rounded-full bg-bg/60 text-[13px]"
      options={[{ value: "all", label: allLabel }, ...options]}
    />
  );
}

// ---------- Tabs (segmented, like "All / Farms / Resorts" in Wishlist) ----------

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1.5 overflow-x-auto scrollbar-thin", className)}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition",
            value === t.key
              ? "bg-primary text-white"
              : "bg-surface text-ink-muted ring-1 ring-line hover:text-primary",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px]",
                value === t.key ? "bg-white/20" : "bg-accent-soft text-primary",
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ---------- Stepper (Add Property: Basic info → Details → Photos → Review) ----------

export function Stepper({ steps, current, onStep }) {
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={s}
            className="flex flex-1 flex-col items-center last:flex-none sm:last:flex-1"
          >
            <div className="flex w-full items-center">
              <button
                type="button"
                disabled={!onStep || i > current}
                onClick={() => onStep?.(i)}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition",
                  done && "bg-accent text-white",
                  active && "bg-primary text-white ring-4 ring-accent/25",
                  !done && !active && "bg-line/70 text-ink-muted",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </button>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full",
                    done ? "bg-accent" : "bg-line",
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "mt-2 hidden w-full text-xs font-semibold sm:block",
                active ? "text-primary" : "text-ink-muted",
              )}
            >
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function DetailList({ items }) {
  return (
    <dl className="divide-y divide-line/60">
      {items.map((it, i) => (
        <div
          key={i}
          className="flex items-start justify-between gap-4 py-2.5 text-[13px]"
        >
          <dt className="text-ink-muted">{it.label}</dt>
          <dd className="text-end font-semibold">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
