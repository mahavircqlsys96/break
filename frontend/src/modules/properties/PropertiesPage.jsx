import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Building2, LayoutGrid, List, Plus } from "lucide-react";
import {
  Button,
  DataTable,
  EmptyState,
  FilterSelect,
  PageHeader,
  Pagination,
  Photo,
  Stars,
  StatusBadge,
  Tabs,
  Toolbar,
} from "@/components/ui";
import { dashboardService, propertyService } from "@/services";
import { useListQuery } from "@/lib/useListQuery";
import { aed, date } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useMasterData } from "../master-data/useMasterData";
import { PropertyCard } from "./PropertyCard";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending review" },
  { key: "live", label: "Live" },
  { key: "draft", label: "Draft" },
  { key: "rejected", label: "Rejected" },
  { key: "unlisted", label: "Unlisted" },
];

export function PropertiesPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [view, setView] = useState("grid");
  const md = useMasterData();
  const list = useListQuery({
    sortBy: "createdAt",
    sortDir: "desc",
    pageSize: 12,
    filters: { status: params.get("status") ?? undefined },
  });
  const { data, isFetching } = useQuery({
    queryKey: ["properties", list.query],
    queryFn: () => propertyService.list(list.query),
    placeholderData: keepPreviousData,
  });
  const stats = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.stats,
  });

  return (
    <>
      <PageHeader
        title="Properties"
        subtitle="Review, approve and manage every listing on Break."
      />



      <div className="card overflow-hidden">
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search name, area or host"
        >
          <FilterSelect
            allLabel="All categories"
            value={list.filters.categoryId}
            onChange={(v) => list.setFilter("categoryId", v)}
            options={md.categories.map((c) => ({ value: c.id, label: c.name }))}
          />

          <div className="ms-auto flex rounded-full bg-bg p-0.5">
            {["grid", "table"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-label={`${v} view`}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full transition",
                  view === v
                    ? "bg-surface text-primary shadow-sm"
                    : "text-ink-muted",
                )}
              >
                {v === "grid" ? (
                  <LayoutGrid className="size-4" />
                ) : (
                  <List className="size-4" />
                )}
              </button>
            ))}
          </div>
        </Toolbar>

        {view === "grid" ? (
          <div className="px-4 pb-4">
            {data?.items.length === 0 ? (
              <EmptyState
                icon={<Building2 className="size-8" />}
                title="No properties here"
                message="Try another status tab or clear your filters."
              />
            ) : (
              <div
                className={cn(
                  "grid grid-cols-1 gap-4 transition sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
                  isFetching && "opacity-60",
                )}
              >
                {data?.items.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <DataTable
            rows={data?.items}
            loading={isFetching}
            sort={list.sort}
            onSort={list.toggleSort}
            onRowClick={(p) => navigate(`/properties/${p.id}`)}
            empty={
              <EmptyState
                icon={<Building2 className="size-8" />}
                title="No properties here"
              />
            }
            columns={[
              {
                key: "name",
                header: "Property",
                sortable: true,
                render: (p) => (
                  <div className="flex items-center gap-3">
                    <Photo
                      src={p.photos[0]}
                      alt={p.name}
                      className="size-11 rounded-xl"
                    />
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-ink-muted">
                        {p.area}, {p.cityName}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: "category",
                header: "Category",
                render: (p) => p.categoryName,
              },
              { key: "host", header: "Host", render: (p) => p.hostName },
              {
                key: "pricePerNight",
                header: "Price / night",
                sortable: true,
                render: (p) => (
                  <span className="whitespace-nowrap font-semibold">
                    {aed(p.pricePerNight)}
                  </span>
                ),
              },
              {
                key: "rating",
                header: "Rating",
                sortable: true,
                render: (p) => <Stars value={p.rating} />,
              },
              {
                key: "bookings",
                header: "Bookings",
                sortable: true,
                render: (p) => p.bookings,
              },
              {
                key: "createdAt",
                header: "Created",
                sortable: true,
                render: (p) => (
                  <span className="whitespace-nowrap text-ink-muted">
                    {date(p.createdAt)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (p) => <StatusBadge status={p.status} />,
              },
            ]}
          />
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
