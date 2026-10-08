import { Link } from "react-router-dom";
import { Ban, Flag } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { ago } from "@/lib/format";

const profile = (role, id) => `/${role}s/${id}`;

export function ReportsList({ reports, actions }) {
  return (
    <ul className="divide-y divide-line/60">
      {reports.map((r) => (
        <li
          key={r.id}
          className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start"
        >
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${r.type === "block" ? "bg-danger-soft text-danger" : "bg-warning-soft text-[#B8740F]"}`}
          >
            {r.type === "block" ? (
              <Ban className="size-5" />
            ) : (
              <Flag className="size-5" />
            )}
          </span>
          <div className="min-w-0 flex-1 text-[13px]">
            <div className="flex flex-wrap items-center gap-2">
              <b className="text-sm">{r.reason}</b>
              <StatusBadge status={r.status || 'Pending'} />
            </div>
            <p className="mt-1 text-ink-muted">
              <Link
                to={profile(r.reporterRole, r.reporterId)}
                className="font-semibold text-ink hover:text-primary"
              >
                {r.reporterName}
              </Link>{" "}
              ({r.reporterRole || 'user'}) reported{" "}
              <Link
                to={profile(r.reportedRole, r.reportedUser?.id)}
                className="font-semibold text-ink hover:text-primary"
              >
                {r.reportedName}
              </Link>{" "}
              ({r.reportedRole || 'user'})
              · {ago(r.createdAt)}
            </p>
            {r.adminRemarks && (
              <p className="mt-1.5 rounded-xl bg-bg px-3 py-2 text-ink-muted">
                <span className="font-semibold text-ink">Support replied:</span>{" "}
                {r.adminRemarks}
              </p>
            )}

          </div>
          {actions?.(r)}
        </li>
      ))}
    </ul>
  );
}
