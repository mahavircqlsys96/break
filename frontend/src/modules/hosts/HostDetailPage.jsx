import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Ban,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Coins,
  FileCheck2,
  Star,
} from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  DetailList,
  PageHeader,
  PageLoader,
  StatCard,
  StatusBadge,
  useToast,
} from "@/components/ui";
import { hostService } from "@/services";
import { aed, date, label } from "@/lib/format";
import { BackLink } from "../BackLink";
import { BookingsTable } from "../BookingsTable";
import { PropertyCard } from "../properties/PropertyCard";

export function HostDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const [suspend, setSuspend] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["hosts", id],
    queryFn: () => hostService.get(id),
  });
  const status = useMutation({
    mutationFn: (s) => hostService.setStatus(id, s),
    onSuccess: (h) => {
      qc.invalidateQueries({ queryKey: ["hosts"] });
      toast(h.status === "active" ? "Host approved" : "Host suspended");
      setSuspend(false);
    },
  });

  if (isLoading || !data) return <PageLoader />;
  const h = data.host;

  return (
    <>
      <PageHeader
        back={<BackLink to="/hosts">Hosts</BackLink>}
        title={
          <span className="inline-flex items-center gap-2">
            {h.name}
            {h.verified && <BadgeCheck className="size-6 text-accent" />}
          </span>
        }
        subtitle={`Host since ${date(h.joinedAt)}`}
        actions={
          h.status === "active" ? (
            <Button
              variant="danger-soft"
              icon={<Ban className="size-4" />}
              onClick={() => setSuspend(true)}
            >
              Suspend host
            </Button>
          ) : (
            <Button
              icon={<CheckCircle2 className="size-4" />}
              loading={status.isPending}
              onClick={() => status.mutate("active")}
            >
              {h.status === "pending" ? "Verify & approve" : "Reactivate"}
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col items-center pb-4 text-center">
              <Avatar name={h.name} size={84} />
              <p className="mt-3 text-lg font-bold">{h.name}</p>
              <p className="text-[13px] text-ink-muted">{h.email}</p>
              <div className="mt-3">
                <StatusBadge status={h.status} />
              </div>
            </div>
            <DetailList
              items={[
                { label: "Phone", value: `${h.dialCode} ${h.phone}` },
                { label: "Country", value: h.country },
                { label: "Gender", value: label(h.gender) },
                { label: "Response rate", value: `${h.responseRate}%` },
              ]}
            />
          </Card>
          <Card title="Verification">
            <div className="flex items-start gap-3 rounded-2xl bg-bg p-3.5">
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${h.verified ? "bg-success-soft text-success" : "bg-warning-soft text-[#B8740F]"}`}
              >
                <FileCheck2 className="size-5" />
              </span>
              <div className="text-[13px]">
                <p className="font-semibold">Identity document</p>
                <p className="text-ink-muted">{h.idDocument}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard
              label="Properties"
              value={h.properties}
              icon={<Building2 className="size-5" />}
            />
            <StatCard
              label="Bookings"
              value={h.bookings}
              icon={<CalendarCheck className="size-5" />}
              tone="success"
            />
            <StatCard
              label="Earnings"
              value={aed(h.earnings)}
              icon={<Coins className="size-5" />}
              tone="warning"
            />
            <StatCard
              label="Rating"
              value={h.rating.toFixed(1)}
              icon={<Star className="size-5" />}
            />
          </div>
          <Card title={`Properties (${data.properties.length})`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </Card>
          <Card title="Recent bookings" padded={false}>
            <div className="mt-3">
              <BookingsTable rows={data.bookings} hide={["host"]} />
            </div>
          </Card>
          <Card title="Payouts" padded={false}>
            <div className="mt-3">
              <DataTable
                rows={data.payouts}
                columns={[
                  {
                    key: "period",
                    header: "Period",
                    render: (p) =>
                      `${date(p.periodStart)} – ${date(p.periodEnd)}`,
                  },
                  {
                    key: "bookings",
                    header: "Bookings",
                    render: (p) => p.bookings,
                  },
                  {
                    key: "commission",
                    header: "Commission",
                    render: (p) => aed(p.commission),
                  },
                  {
                    key: "amount",
                    header: "Payout",
                    render: (p) => <b>{aed(p.amount)}</b>,
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (p) => <StatusBadge status={p.status} />,
                  },
                ]}
              />
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={suspend}
        onClose={() => setSuspend(false)}
        title="Suspend host?"
        loading={status.isPending}
        message="Their listings will be hidden from guests until the host is reactivated."
        confirmLabel="Suspend"
        onConfirm={() => status.mutate("suspended")}
      />
    </>
  );
}
