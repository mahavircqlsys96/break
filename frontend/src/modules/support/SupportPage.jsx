import { useEffect, useRef, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCheck,
  Headphones,
  MessagesSquare,
  RotateCcw,
  Search,
  SendHorizontal,
  ShieldAlert,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  FilterSelect,
  IconButton,
  Input,
  PageHeader,
  Pagination,
  StatusBadge,
  Tabs,
  Toolbar,
  useToast,
} from "@/components/ui";
import { supportService } from "@/services";
import { useListQuery } from "@/lib/useListQuery";
import { ago, dateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ReportsList } from "./ReportsList";

export function SupportPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Manage user reports and blocks."
      />
      <Reports />
    </>
  );
}

function Reports() {
  const qc = useQueryClient();
  const toast = useToast();
  const list = useListQuery({ filters: { status: "Pending" } });
  const [resolving, setResolving] = useState(null);
  const { data, isFetching } = useQuery({
    queryKey: ["reports", list.query],
    queryFn: () => supportService.reports(list.query),
    placeholderData: keepPreviousData,
  });
  const update = useMutation({
    mutationFn: ({ id, status, note }) =>
      supportService.resolveReport(id, status, note),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast(r?.status === "Resolved" ? "Report resolved" : "Report updated");
      setResolving(null);
    },
  });

  return (
    <Card padded={false}>
      <Toolbar
        search={list.search}
        onSearch={list.setSearch}
        placeholder="Search reason or person"
      >
        <FilterSelect
          allLabel="All statuses"
          value={list.filters.status}
          onChange={(v) => list.setFilter("status", v)}
          options={[
            { value: "Pending", label: "Pending" },
            { value: "Reviewed", label: "Reviewed" },
            { value: "Resolved", label: "Resolved" },
            { value: "Rejected", label: "Rejected" },
          ]}
        />
      </Toolbar>
      <div className={cn("px-5 pb-5 transition", isFetching && "opacity-60")}>
        {data?.items.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert className="size-8" />}
            title="No reports"
            message="Nothing needs your attention here."
          />
        ) : (
          <ReportsList
            reports={data?.items ?? []}
            actions={(r) =>
              (r.status === "Pending" || r.status === "Reviewed") && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      update.mutate({ id: r.id, status: "Rejected" })
                    }
                  >
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => setResolving(r)}>
                    Resolve
                  </Button>
                </div>
              )
            }
          />
        )}
      </div>
      {data && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPage={list.setPage}
        />
      )}
      <ConfirmDialog
        open={!!resolving}
        onClose={() => setResolving(null)}
        title="Resolve report"
        tone="primary"
        withReason
        reasonLabel="Action taken"
        message={
          resolving ? (
            <>
              Reported: <b>{resolving.reportedName}</b> —{" "}
              <StatusBadge status={resolving.status || 'Pending'} />
            </>
          ) : undefined
        }
        confirmLabel="Resolve"
        loading={update.isPending}
        onConfirm={(note) =>
          resolving &&
          update.mutate({ id: resolving.id, status: "Resolved", note })
        }
      />
    </Card>
  );
}
