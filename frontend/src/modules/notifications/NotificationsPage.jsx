import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Clock, Send, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
  useToast,
} from "@/components/ui";
import { notificationService } from "@/services";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useMasterData } from "../master-data/useMasterData";

const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "guests", label: "All guests" },
  { value: "hosts", label: "All hosts" },
  { value: "city", label: "Guests in a city" },
];

export function NotificationsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const md = useMasterData();
  const [form, setForm] = useState({ title: "", body: "", audience: "all" });
  const [schedule, setSchedule] = useState(false);
  const [when, setWhen] = useState("");
  const history = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationService.list,
  });

  const send = useMutation({
    mutationFn: () =>
      notificationService.send({
        ...form,
        scheduleAt: schedule && when ? new Date(when).toISOString() : undefined,
      }),
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast(
        n.status === "scheduled"
          ? "Notification scheduled"
          : `Sent to ${n.recipients} devices`,
      );
      setForm({ title: "", body: "", audience: "all" });
      setSchedule(false);
      setWhen("");
    },
  });
  const remove = useMutation({
    mutationFn: notificationService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast("Scheduled notification cancelled");
    },
  });
  const valid =
    form.title.trim() &&
    form.body.trim() &&
    (form.audience !== "city" || form.cityId) &&
    (!schedule || when);

  return (
    <>
      <PageHeader
        title="Push Notifications"
        subtitle="Send announcements to the Break user and host apps."
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <Card title="Compose">
          <div className="space-y-4">
            <Field label="Title">
              <Input
                maxLength={60}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Property Price Drop"
              />
            </Field>
            <Field label="Message" hint={`${form.body.length}/180`}>
              <Textarea
                maxLength={180}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Good news! The price of your saved property has dropped."
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Audience">
                <Select
                  value={form.audience}
                  onChange={(e) =>
                    setForm({ ...form, audience: e.target.value })
                  }
                  options={AUDIENCES}
                />
              </Field>
              {form.audience === "city" && (
                <Field label="City">
                  <Select
                    value={form.cityId ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, cityId: e.target.value })
                    }
                    options={[
                      { value: "", label: "Select city…" },
                      ...md.cities.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />
                </Field>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSchedule((s) => !s)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition",
                  schedule
                    ? "bg-accent-soft text-primary"
                    : "text-ink-muted ring-1 ring-line hover:text-primary",
                )}
              >
                <Clock className="size-4" /> Schedule for later
              </button>
              {schedule && (
                <Input
                  type="datetime-local"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className="w-auto"
                />
              )}
            </div>
            <div className="flex justify-end border-t border-line/70 pt-4">
              <Button
                icon={<Send className="size-4" />}
                disabled={!valid}
                loading={send.isPending}
                onClick={() => send.mutate()}
              >
                {schedule ? "Schedule" : "Send now"}
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Preview">
          <div className="rounded-[28px] bg-gradient-to-b from-[#2B2740] to-[#4A4372] p-4 pt-8">
            <p className="mb-4 text-center text-4xl font-light text-white/90">
              9:41
            </p>
            <div className="rounded-2xl bg-white/85 p-3 backdrop-blur">
              <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                <span className="flex size-5 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-white">
                  b
                </span>
                BREAK · now
              </div>
              <p className="mt-1.5 text-[13px] font-bold">
                {form.title || "Notification title"}
              </p>
              <p className="text-[12.5px] text-ink/80">
                {form.body || "Your message will appear here."}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="History" className="mt-4">
        {history.data?.length === 0 ? (
          <EmptyState
            icon={<Bell className="size-8" />}
            title="No notifications sent yet"
          />
        ) : (
          <ul className="divide-y divide-line/60">
            {history.data?.map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <Bell className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-[13.5px]">{n.title}</b>
                    <StatusBadge status={n.status} />
                    <Badge tone="accent">
                      {AUDIENCES.find((a) => a.value === n.audience)?.label}
                      {n.cityId &&
                        ` · ${md.cities.find((c) => c.id === n.cityId)?.name}`}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-muted">{n.body}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {dateTime(n.sentAt)} · {n.recipients} recipients
                    {n.status === "sent" &&
                      ` · ${n.opens} opened (${Math.round((n.opens / Math.max(n.recipients, 1)) * 100)}%)`}
                  </p>
                </div>
                {n.status === "scheduled" && (
                  <IconButton
                    label="Cancel scheduled notification"
                    onClick={() => remove.mutate(n.id)}
                    className="hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
