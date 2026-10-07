import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import {
  Avatar,
  Badge,
  DataTable,
  EmptyState,
  FilterSelect,
  PageHeader,
  Pagination,
  StatusBadge,
  Toolbar,
} from "@/components/ui";
import { guestService } from "@/services";
import { useListQuery } from "@/lib/useListQuery";
import { aed, date, label } from "@/lib/format";

export const SIGNUP_OPTIONS = [
  "phone",
  "google",
  "apple",
  "uae_pass",
  "email",
].map((v) => ({ value: v, label: v === "uae_pass" ? "UAE Pass" : label(v) }));

export function GuestsPage() {
  const navigate = useNavigate();
  const list = useListQuery({ sortBy: "joinedAt", sortDir: "desc" });
  const { data, isFetching } = useQuery({
    queryKey: ["guests", list.query],
    queryFn: () => guestService.list(list.query),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="People who book stays through the Break app."
      />
      <div className="card overflow-hidden">
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search name, email or phone"
        >
          <FilterSelect
            allLabel="All statuses"
            value={list.filters.status}
            onChange={(v) => list.setFilter("status", v)}
            options={[
              { value: "active", label: "Active" },
              { value: "blocked", label: "Blocked" },
            ]}
          />
          <FilterSelect
            allLabel="All sign-up methods"
            value={list.filters.signupMethod}
            onChange={(v) => list.setFilter("signupMethod", v)}
            options={SIGNUP_OPTIONS}
          />
          <FilterSelect
            allLabel="All languages"
            value={list.filters.language}
            onChange={(v) => list.setFilter("language", v)}
            options={[
              { value: "en", label: "English" },
              { value: "ar", label: "Arabic" },
            ]}
          />
        </Toolbar>
        <DataTable
          rows={data?.items}
          loading={isFetching}
          sort={list.sort}
          onSort={list.toggleSort}
          onRowClick={(g) => navigate(`/guests/${g.id}`)}
          empty={
            <EmptyState
              icon={<Users className="size-8" />}
              title="No users found"
              message="Try a different search or filter."
            />
          }
          columns={[
            {
              key: "name",
              header: "User",
              sortable: true,
              render: (g) => (
                <div className="flex items-center gap-3">
                  <Avatar name={g.name} />
                  <div className="min-w-0">
                    <p className="font-semibold">{g.name}</p>
                    <p className="truncate text-xs text-ink-muted">{g.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "phone",
              header: "Phone",
              render: (g) => (
                <span className="whitespace-nowrap">
                  {g.dialCode} {g.phone}
                </span>
              ),
            },
            {
              key: "signupMethod",
              header: "Signed up with",
              render: (g) => (
                <Badge tone="accent">
                  {
                    SIGNUP_OPTIONS.find((o) => o.value === g.signupMethod)
                      ?.label
                  }
                </Badge>
              ),
            },
            {
              key: "bookings",
              header: "Bookings",
              sortable: true,
              render: (g) => g.bookings,
            },
            {
              key: "totalSpent",
              header: "Spent",
              sortable: true,
              render: (g) => (
                <span className="whitespace-nowrap font-semibold">
                  {aed(g.totalSpent)}
                </span>
              ),
            },
            {
              key: "joinedAt",
              header: "Joined",
              sortable: true,
              render: (g) => (
                <span className="whitespace-nowrap text-ink-muted">
                  {date(g.joinedAt)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (g) => <StatusBadge status={g.status} />,
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
