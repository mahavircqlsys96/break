import { Link } from "react-router-dom";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Eye, EyeOff, MessageSquareOff } from "lucide-react";
import {
  Avatar,
  Button,
  EmptyState,
  FilterSelect,
  PageHeader,
  Pagination,
  StatusBadge,
  Tabs,
  Toolbar,
  useToast,
} from "@/components/ui";
import { reviewService } from "@/services";
import { useListQuery } from "@/lib/useListQuery";
import { date } from "@/lib/format";

function StarRow({ n }) {
  return (
    <span
      className="text-sm tracking-tight text-warning"
      aria-label={`${n} stars`}
    >
      {"★".repeat(n)}
      <span className="text-line">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function ReviewsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const list = useListQuery({ pageSize: 8 });
  const { data, isFetching } = useQuery({
    queryKey: ["reviews", list.query],
    queryFn: () => reviewService.list(list.query),
    placeholderData: keepPreviousData,
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }) => reviewService.setStatus(id, status),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast(
        r.status === "hidden"
          ? "Review hidden from the app"
          : "Review published",
      );
    },
  });

  return (
    <>
      <PageHeader
        title="Reviews & Ratings"
        subtitle="Moderate what guests say about their stays."
      />
      <Tabs
        className="mb-4"
        value={list.filters.status ?? "all"}
        onChange={(v) => list.setFilter("status", v)}
        tabs={[
          { key: "all", label: "All" },
          { key: "flagged", label: "Flagged" },
          { key: "published", label: "Published" },
          { key: "hidden", label: "Hidden" },
        ]}
      />
      <div className="card overflow-hidden">
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search review, property or guest"
        >
          <FilterSelect
            allLabel="Any rating"
            value={list.filters.rating}
            onChange={(v) => list.setFilter("rating", v)}
            options={[5, 4, 3, 2, 1].map((n) => ({
              value: String(n),
              label: `${n} star${n > 1 ? "s" : ""}`,
            }))}
          />
        </Toolbar>
        {data?.items.length === 0 ? (
          <EmptyState
            icon={<MessageSquareOff className="size-8" />}
            title="No reviews"
            message="Nothing matches these filters."
          />
        ) : (
          <ul
            className={`divide-y divide-line/60 transition ${isFetching ? "opacity-60" : ""}`}
          >
            {data?.items.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start"
              >
                <Avatar name={r.guestName} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <b>{r.guestName}</b>
                    <span className="text-ink-muted">on</span>
                    <Link
                      to={`/properties/${r.propertyId}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {r.propertyName}
                    </Link>
                    <span className="text-xs text-ink-muted">
                      · {date(r.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRow n={r.rating} />
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
                    {r.comment}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.status !== "hidden" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<EyeOff className="size-3.5" />}
                      onClick={() =>
                        setStatus.mutate({ id: r.id, status: "hidden" })
                      }
                    >
                      Hide
                    </Button>
                  )}
                  {r.status !== "published" && (
                    <Button
                      size="sm"
                      variant="soft"
                      icon={<Eye className="size-3.5" />}
                      onClick={() =>
                        setStatus.mutate({ id: r.id, status: "published" })
                      }
                    >
                      Publish
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPage={list.setPage}
          />
        )}
      </div>
    </>
  );
}
