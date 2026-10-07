import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarX, PawPrint } from "lucide-react";
import {
  DataTable,
  EmptyState,
  FilterSelect,
  PageHeader,
  Pagination,
  Photo,
  StatusBadge,
  Tabs,
  Toolbar,
} from "@/components/ui";
import { bookingService } from "@/services";
import { useListQuery } from "@/lib/useListQuery";
import { aed, date, dateRange, label } from "@/lib/format";

const MONTHS = Array.from({ length: 8 }, (_, i) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 5 + i);
  return {
    value: d.toISOString().slice(0, 7),
    label: d.toLocaleString("en", { month: "long", year: "numeric" }),
  };
});

export function BookingsPage() {
  const navigate = useNavigate();
  const list = useListQuery();
  const { data, isFetching } = useQuery({
    queryKey: ["bookings", list.query],
    queryFn: () => bookingService.list(list.query),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Every reservation made through the Break app."
      />
      <Tabs
        className="mb-4"
        value={list.filters.status ?? "all"}
        onChange={(v) => list.setFilter("status", v)}
        tabs={["all", "pending", "confirmed", "completed", "cancelled"].map(
          (k) => ({ key: k, label: k === "all" ? "All" : label(k) }),
        )}
      />
      <div className="card overflow-hidden">
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search code, guest or property"
        >
          <FilterSelect
            allLabel="Any check-in month"
            value={list.filters.month}
            onChange={(v) => list.setFilter("month", v)}
            options={MONTHS}
          />
          <FilterSelect
            allLabel="Any payment"
            value={list.filters.paymentStatus}
            onChange={(v) => list.setFilter("paymentStatus", v)}
            options={["paid", "pending", "refunded", "failed"].map((v) => ({
              value: v,
              label: label(v),
            }))}
          />
        </Toolbar>
        <DataTable
          rows={data?.items}
          loading={isFetching}
          sort={list.sort}
          onSort={list.toggleSort}
          onRowClick={(b) => navigate(`/bookings/${b.id}`)}
          empty={
            <EmptyState
              icon={<CalendarX className="size-8" />}
              title="No bookings found"
            />
          }
          columns={[
            {
              key: "code",
              header: "Booking",
              sortable: true,
              render: (b) => (
                <div>
                  <p className="font-semibold">{b.code}</p>
                  <p className="text-xs text-ink-muted">{date(b.createdAt)}</p>
                </div>
              ),
            },
            {
              key: "property",
              header: "Property",
              render: (b) => (
                <div className="flex items-center gap-3">
                  <Photo
                    src={b.propertyPhoto}
                    alt={b.propertyName}
                    className="size-10 rounded-xl"
                  />
                  <div>
                    <p className="font-medium">{b.propertyName}</p>
                    <p className="text-xs text-ink-muted">{b.cityName}</p>
                  </div>
                </div>
              ),
            },
            { key: "guest", header: "Guest", render: (b) => b.guestName },
            {
              key: "checkIn",
              header: "Stay",
              sortable: true,
              render: (b) => (
                <div className="whitespace-nowrap">
                  <p>{dateRange(b.checkIn, b.checkOut)}</p>
                  <p className="text-xs text-ink-muted">
                    {b.nights} night{b.nights > 1 && "s"}
                  </p>
                </div>
              ),
            },
            {
              key: "guests",
              header: "Guests",
              render: (b) => (
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink-muted">
                  {b.adults + b.children}
                  {b.pets > 0 && <PawPrint className="size-3.5 text-accent" />}
                </span>
              ),
            },
            {
              key: "total",
              header: "Total",
              sortable: true,
              render: (b) => (
                <span className="whitespace-nowrap font-semibold">
                  {aed(b.total)}
                </span>
              ),
            },
            {
              key: "paymentStatus",
              header: "Payment",
              render: (b) => <StatusBadge status={b.paymentStatus} />,
            },
            {
              key: "status",
              header: "Status",
              render: (b) => <StatusBadge status={b.status} />,
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
