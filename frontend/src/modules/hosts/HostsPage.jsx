import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { BadgeCheck, UserRound, Eye, Trash2, Check } from "lucide-react";
import {
  Avatar,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FilterSelect,
  IconButton,
  PageHeader,
  Pagination,
  Stars,
  StatusBadge,
  Tabs,
  Toggle,
  Toolbar,
  useToast,
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

  const qc = useQueryClient();
  const toast = useToast();
  const [deleting, setDeleting] = useState(null);

  const toggleStatus = useMutation({
    mutationFn: (r) => hostService.setStatus(r.id, r.status === "active" ? "inactive" : "active"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hosts"] });
      toast("Status updated");
    },
  });

  const approveHost = useMutation({
    mutationFn: (r) => hostService.updateVerification(r.id, "Verified"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hosts"] });
      toast("Host approved successfully");
    },
  });

  const remove = useMutation({
    mutationFn: (id) => hostService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hosts"] });
      toast("Host deleted");
      setDeleting(null);
    },
  });

  return (
    <>
      <PageHeader
        title="Hosts"
        subtitle="Property owners listing on Break. Verify new hosts before their listings go live."
      />

      <div className="card overflow-hidden">
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search name, email or phone"
          filter={
            <FilterSelect
              value={list.query.verificationStatus || "all"}
              onChange={(v) => list.setFilter("verificationStatus", v === "all" ? undefined : v)}
              options={[
                { value: "all", label: "All Verifications" },
                { value: "Verified", label: "Verified Only" },
                { value: "Pending", label: "Pending Review" },
                { value: "Rejected", label: "Rejected" },
                { value: "Unverified", label: "Unverified" },
              ]}
            />
          }
        />
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
                  <Avatar name={h.name} src={h.image} />
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
              key: "verificationStatus",
              header: "Verification",
              sortable: true,
              render: (h) => {
                const isVerified = h.verificationStatus === "Verified";
                const isPending = h.verificationStatus === "Pending";
                const isRejected = h.verificationStatus === "Rejected";
                return (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-ink">
                      {h.idDocumentType || "Emirates ID"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isVerified
                          ? "bg-success-soft text-success"
                          : isPending
                          ? "bg-warning-soft text-[#B8740F]"
                          : isRejected
                          ? "bg-danger-soft text-danger"
                          : "bg-surface-elevated text-ink-muted"
                      }`}
                    >
                      {isVerified && <BadgeCheck className="size-3" />}
                      {h.verificationStatus || "Unverified"}
                    </span>
                  </div>
                );
              },
            },
            {
              key: "status",
              header: "Status",
              render: (h) => <StatusBadge status={h.status} />,
            },
            {
              key: "actions",
              header: "Action",
              className: "w-44 text-end",
              render: (r) => (
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {!r.verified && (
                    <Button
                      size="xs"
                      className="bg-success text-white hover:bg-success/90 text-[11px] py-1 px-2 h-auto flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        approveHost.mutate(r);
                      }}
                      loading={approveHost.isPending}
                      title="Quick Approve Host"
                    >
                      <Check className="size-3" />
                      Approve
                    </Button>
                  )}
                  <Toggle
                    checked={r.status === "active"}
                    onChange={() => toggleStatus.mutate(r)}
                    label={`Toggle ${r.name}`}
                  />
                  <IconButton label="View" onClick={() => navigate(`/hosts/${r.id}`)}>
                    <Eye className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleting(r);
                    }}
                    className="hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ),
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

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete host"
        tone="danger"
        message={
          <>
            Are you sure you want to delete <b>{deleting?.name}</b>?
          </>
        }
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}
