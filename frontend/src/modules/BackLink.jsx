import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function BackLink({ to, children }) {
  return (
    <Link
      to={to}
      className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted hover:text-primary"
    >
      <ArrowLeft className="size-4 rtl:rotate-180" /> {children}
    </Link>
  );
}
