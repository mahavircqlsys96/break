import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BadgeCheck, UserRound } from "lucide-react";
import {
  Avatar,
  DataTable,
  EmptyState,
  FilterSelect,
  PageHeader,
  Pagination,
  Stars,
  StatusBadge,
  Tabs,
  Toolbar,
} from "@/components/ui";
import { hostService } from "@/services";
import { useListQuery } from "@/lib/useListQuery";
import { aed, date } from "@/lib/format";

export function HostsPage() {
  const navigate = useNavigate();
  const list = useListQuery({ sortBy: "joinedAt", sortDir: "desc" });
  const { data, isFetching } = useQuery({
    queryKey: ["hosts", list.query],
    queryFn: () => hostService.list(list.query),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Hosts"
        subtitle="Property owners listing on Break. Verify new hosts before their listings go live."
      />
      <Tabs
        className="mb-4"
        value={list.filters.status ?? "all"}
        onChange={(v) => list.setFilter("status", v)}
        tabs={[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending verification" },
          { key: "active", label: "Active" },
          { key: "suspended", label: "Suspended" },
        ]}
      />
      <div className="card overflow-hidden">
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search name, email or phone"
        >
          <FilterSelect
            allLabel="Verified & unverified"
            value={list.filters.verified}
            onChange={(v) => list.setFilter("verified", v)}
            options={[
              { value: "true", label: "Verified" },
              { value: "false", label: "Unverified" },
            ]}
          />
        </Toolbar>
        <DataTable
          rows={data?.items}
          loading={isFetching}
          sort={list.sort}
          onSort={list.toggleSort}
          onRowClick={(h) => navigate(`/hosts/${h.id}`)}
          empty={
            <EmptyState
              icon={<UserRound className="size-8" />}
              title="No hosts found"
            />
          }
          columns={[
            {
              key: "name",
              header: "Host",
              sortable: true,
              render: (h) => (
                <div className="flex items-center gap-3">
                  <Avatar name={h.name} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 font-semibold">
                      {h.name}
                      {h.verified && (
                        <BadgeCheck className="size-4 text-accent" />
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{h.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "properties",
              header: "Properties",
              sortable: true,
              render: (h) => h.properties,
            },
            {
              key: "bookings",
              header: "Bookings",
              sortable: true,
              render: (h) => h.bookings,
            },
            {
              key: "earnings",
              header: "Earnings",
              sortable: true,
              render: (h) => (
                <span className="whitespace-nowrap font-semibold">
                  {aed(h.earnings)}
                </span>
              ),
            },
            {
              key: "rating",
              header: "Rating",
              sortable: true,
              render: (h) => <Stars value={h.rating} />,
            },
            {
              key: "joinedAt",
              header: "Joined",
              sortable: true,
              render: (h) => (
                <span className="whitespace-nowrap text-ink-muted">
                  {date(h.joinedAt)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (h) => <StatusBadge status={h.status} />,
            },
          ]}
        />

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
