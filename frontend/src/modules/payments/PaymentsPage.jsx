import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Landmark,
  Percent,
  Receipt,
} from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  DataTable,
  Field,
  FilterSelect,
  Input,
  PageHeader,
  Pagination,
  StatCard,
  StatusBadge,
  Tabs,
  Toolbar,
  useToast,
} from "@/components/ui";
import { dashboardService, financeService, settingsService } from "@/services";
import { useListQuery } from "@/lib/useListQuery";
import { aed, date, dateTime, label } from "@/lib/format";

export function PaymentsPage() {
  const [tab, setTab] = useState("transactions");
  const stats = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.stats,
  });
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: settingsService.get,
  });
  return (
    <>
      <PageHeader
        title="Payments & Payouts"
        subtitle="Guest payments, refunds and host payouts."
      />
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Gross booking value"
          value={aed(stats.data?.revenue ?? 0)}
          icon={<Coins className="size-5" />}
        />
        <StatCard
          label="Break earnings"
          value={aed(stats.data?.commission ?? 0)}
          icon={<Receipt className="size-5" />}
          tone="success"
          hint="Commission + service fees"
        />
        <StatCard
          label="Commission rate"
          value={`${settings.data?.commissionPercent ?? "—"}%`}
          icon={<Percent className="size-5" />}
          tone="warning"
          hint={`Service fee ${settings.data?.serviceFeePercent ?? "—"}% · VAT ${settings.data?.vatPercent ?? "—"}%`}
        />
      </div>
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "transactions", label: "Transactions" },
          { key: "payouts", label: "Host payouts" },
          { key: "fees", label: "Fees & commission" },
        ]}
      />
      {tab === "transactions" && <Transactions />}
      {tab === "payouts" && <Payouts />}
      {tab === "fees" && settings.data && <Fees settings={settings.data} />}
    </>
  );
}

function Transactions() {
  const list = useListQuery();
  const { data, isFetching } = useQuery({
    queryKey: ["transactions", list.query],
    queryFn: () => financeService.transactions(list.query),
    placeholderData: keepPreviousData,
  });
  return (
    <div className="card overflow-hidden">
      <Toolbar
        search={list.search}
        onSearch={list.setSearch}
        placeholder="Search booking code or guest"
      >
        <FilterSelect
          allLabel="Payments & refunds"
          value={list.filters.type}
          onChange={(v) => list.setFilter("type", v)}
          options={[
            { value: "payment", label: "Payments" },
            { value: "refund", label: "Refunds" },
          ]}
        />
        <FilterSelect
          allLabel="Any method"
          value={list.filters.method}
          onChange={(v) => list.setFilter("method", v)}
          options={["card", "apple_pay", "google_pay"].map((v) => ({
            value: v,
            label: label(v),
          }))}
        />
      </Toolbar>
      <DataTable
        rows={data?.items}
        loading={isFetching}
        columns={[
          {
            key: "type",
            header: "Type",
            render: (t) => (
              <span className="inline-flex items-center gap-2 font-semibold">
                <span
                  className={`flex size-8 items-center justify-center rounded-full ${t.type === "refund" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}
                >
                  {t.type === "refund" ? (
                    <ArrowUpRight className="size-4" />
                  ) : (
                    <ArrowDownLeft className="size-4" />
                  )}
                </span>
                {label(t.type)}
              </span>
            ),
          },
          {
            key: "booking",
            header: "Booking",
            render: (t) => (
              <Link
                onClick={(e) => e.stopPropagation()}
                to={`/bookings/${t.bookingId}`}
                className="font-semibold text-primary hover:underline"
              >
                {t.bookingCode}
              </Link>
            ),
          },
          { key: "guest", header: "Guest", render: (t) => t.guestName },
          { key: "method", header: "Method", render: (t) => label(t.method) },
          {
            key: "amount",
            header: "Amount",
            render: (t) => (
              <span
                className={`whitespace-nowrap font-semibold ${t.type === "refund" ? "text-danger" : ""}`}
              >
                {t.type === "refund" ? "−" : ""}
                {aed(t.amount)}
              </span>
            ),
          },
          {
            key: "createdAt",
            header: "Date",
            render: (t) => (
              <span className="whitespace-nowrap text-ink-muted">
                {dateTime(t.createdAt)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (t) => <StatusBadge status={t.status} />,
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
  );
}

function Payouts() {
  const qc = useQueryClient();
  const toast = useToast();
  const list = useListQuery();
  const { data, isFetching } = useQuery({
    queryKey: ["payouts", list.query],
    queryFn: () => financeService.payouts(list.query),
    placeholderData: keepPreviousData,
  });
  const mutate = useMutation({
    mutationFn: ({ id, status }) => financeService.setPayoutStatus(id, status),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["payouts"] });
      toast(`Payout marked ${label(p.status).toLowerCase()}`);
    },
  });
  return (
    <div className="card overflow-hidden">
      <Toolbar
        search={list.search}
        onSearch={list.setSearch}
        placeholder="Search host"
      >
        <FilterSelect
          allLabel="All statuses"
          value={list.filters.status}
          onChange={(v) => list.setFilter("status", v)}
          options={["scheduled", "processing", "paid", "on_hold"].map((v) => ({
            value: v,
            label: label(v),
          }))}
        />
      </Toolbar>
      <DataTable
        rows={data?.items}
        loading={isFetching}
        columns={[
          {
            key: "host",
            header: "Host",
            render: (p) => (
              <Link
                to={`/hosts/${p.hostId}`}
                className="flex items-center gap-2.5 font-semibold hover:text-primary"
              >
                <Avatar name={p.hostName} size={32} />
                {p.hostName}
              </Link>
            ),
          },
          {
            key: "period",
            header: "Period",
            render: (p) => (
              <span className="whitespace-nowrap">
                {date(p.periodStart)} – {date(p.periodEnd)}
              </span>
            ),
          },
          { key: "bookings", header: "Bookings", render: (p) => p.bookings },
          {
            key: "commission",
            header: "Commission",
            render: (p) => (
              <span className="whitespace-nowrap text-ink-muted">
                {aed(p.commission)}
              </span>
            ),
          },
          {
            key: "amount",
            header: "Payout",
            render: (p) => (
              <span className="whitespace-nowrap font-bold">
                {aed(p.amount)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (p) => <StatusBadge status={p.status} />,
          },
          {
            key: "actions",
            header: "",
            className: "text-end",
            render: (p) =>
              p.status === "paid" ? (
                <span className="text-xs text-ink-muted">{date(p.paidAt)}</span>
              ) : (
                <div className="flex justify-end gap-1.5">
                  {p.status === "on_hold" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        mutate.mutate({ id: p.id, status: "scheduled" })
                      }
                    >
                      Release
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        mutate.mutate({ id: p.id, status: "on_hold" })
                      }
                    >
                      Hold
                    </Button>
                  )}
                  <Button
                    size="sm"
                    icon={<Landmark className="size-3.5" />}
                    onClick={() => mutate.mutate({ id: p.id, status: "paid" })}
                  >
                    Mark paid
                  </Button>
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
  );
}

function Fees({ settings }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState(settings);
  useEffect(() => setForm(settings), [settings]);
  const save = useMutation({
    mutationFn: () =>
      settingsService.update({
        commissionPercent: form.commissionPercent,
        serviceFeePercent: form.serviceFeePercent,
        vatPercent: form.vatPercent,
        cleaningFeeDefault: form.cleaningFeeDefault,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Fees updated");
    },
  });
  const num = (k) => ({
    type: "number",
    min: 0,
    value: form[k],
    onChange: (e) => setForm({ ...form, [k]: Number(e.target.value) }),
  });
  return (
    <Card className="max-w-2xl" title="Fees & commission">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Host commission (%)"
          hint="Deducted from each host payout"
        >
          <Input {...num("commissionPercent")} />
        </Field>
        <Field label="Guest service fee (%)" hint="Added to the guest's total">
          <Input {...num("serviceFeePercent")} />
        </Field>
        <Field label="VAT (%)">
          <Input {...num("vatPercent")} />
        </Field>
        <Field label={`Default cleaning fee (${settings.currency})`}>
          <Input {...num("cleaningFeeDefault")} />
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <Button loading={save.isPending} onClick={() => save.mutate()}>
          Save changes
        </Button>
      </div>
    </Card>
  );
}
