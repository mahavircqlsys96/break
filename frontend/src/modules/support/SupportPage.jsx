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
  const [tab, setTab] = useState("inbox");
  return (
    <>
      <PageHeader
        title="Support & Reports"
        subtitle="Reply as Break Support and handle reported conversations and blocks."
      />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          {
            key: "inbox",
            label: (
              <span className="inline-flex items-center gap-1.5">
                <Headphones className="size-4" />
                Support inbox
              </span>
            ),
          },
          {
            key: "reports",
            label: (
              <span className="inline-flex items-center gap-1.5">
                <ShieldAlert className="size-4" />
                Reports
              </span>
            ),
          },
        ]}
      />
      {tab === "inbox" ? <Inbox /> : <Reports />}
    </>
  );
}

function Inbox() {
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("open");
  const [activeId, setActiveId] = useState(null);
  const [text, setText] = useState("");
  const bottom = useRef(null);
  const threads = useQuery({
    queryKey: ["support", "threads", search, status],
    queryFn: () =>
      supportService.threads({ search, pageSize: 100, filters: { status } }),
    placeholderData: keepPreviousData,
  });
  const active = threads.data?.items.find((t) => t.id === activeId);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [active?.messages.length, activeId]);

  const reply = useMutation({
    mutationFn: () => supportService.reply(activeId, text.trim()),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["support"] });
    },
  });
  const resolve = useMutation({
    mutationFn: (s) => supportService.setStatus(activeId, s),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["support"] });
      toast(
        t.status === "resolved"
          ? "Conversation resolved"
          : "Conversation reopened",
      );
    },
  });

  return (
    <div className="card grid h-[calc(100vh-270px)] min-h-[520px] overflow-hidden md:grid-cols-[340px_1fr]">
      <aside
        className={cn(
          "flex min-h-0 flex-col border-line/70 md:border-e",
          active && "hidden md:flex",
        )}
      >
        <div className="space-y-2.5 p-4">
          <Input
            leading={<Search className="size-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages, people…"
            className="h-10 rounded-full bg-bg/60"
          />
          <div className="flex gap-1.5">
            {["open", "resolved", "all"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold capitalize transition",
                  status === s
                    ? "bg-accent-soft text-primary"
                    : "text-ink-muted hover:text-primary",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          {threads.data?.items.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-start transition",
                  t.id === activeId ? "bg-accent-soft/70" : "hover:bg-bg",
                )}
              >
                <Avatar name={t.participantName} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <b className="truncate text-[13px]">{t.participantName}</b>
                    <span className="shrink-0 text-[11px] text-ink-muted">
                      {ago(t.updatedAt)}
                    </span>
                  </div>
                  <p className="truncate text-xs font-semibold text-primary/80">
                    {t.subject}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-ink-muted">
                      {t.messages.at(-1)?.text}
                    </p>
                    {t.unread > 0 && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                        {t.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
          {threads.data?.items.length === 0 && (
            <p className="p-6 text-center text-[13px] text-ink-muted">
              No conversations.
            </p>
          )}
        </ul>
      </aside>

      <section
        className={cn(
          "min-h-0 flex-col bg-bg/40",
          active ? "flex" : "hidden md:flex",
        )}
      >
        {!active ? (
          <div className="m-auto">
            <EmptyState
              icon={<MessagesSquare className="size-8" />}
              title="Select a conversation"
              message="Messages sent to Break Support from the user and host apps appear here."
            />
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-line/70 bg-surface px-4 py-3">
              <IconButton
                label="Back to list"
                className="md:hidden"
                onClick={() => setActiveId(null)}
              >
                <ArrowLeft className="size-5 rtl:rotate-180" />
              </IconButton>
              <Avatar name={active.participantName} size={40} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-semibold">
                  {active.participantName}
                  <Badge tone="accent">{active.participantRole}</Badge>
                </p>
                <p className="truncate text-xs text-ink-muted">
                  {active.subject}
                </p>
              </div>
              {active.status === "open" ? (
                <Button
                  size="sm"
                  variant="soft"
                  icon={<CheckCheck className="size-3.5" />}
                  loading={resolve.isPending}
                  onClick={() => resolve.mutate("resolved")}
                >
                  Resolve
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RotateCcw className="size-3.5" />}
                  loading={resolve.isPending}
                  onClick={() => resolve.mutate("open")}
                >
                  Reopen
                </Button>
              )}
            </header>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
              {active.messages.map((m) => {
                const mine = m.from === "support";
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      mine ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed shadow-sm",
                        mine
                          ? "rounded-ee-md bg-accent-soft text-ink"
                          : "rounded-es-md bg-surface text-ink",
                      )}
                    >
                      {m.text}
                      <p className="mt-1 text-end text-[10.5px] text-ink-muted">
                        {mine ? "Break Support · " : ""}
                        {dateTime(m.at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottom} />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) reply.mutate();
              }}
              className="flex items-center gap-2 border-t border-line/70 bg-surface p-3"
            >
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                className="h-11 rounded-full bg-bg/60"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!text.trim() || reply.isPending}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-primary disabled:opacity-50"
              >
                <SendHorizontal className="size-5 rtl:rotate-180" />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function Reports() {
  const qc = useQueryClient();
  const toast = useToast();
  const list = useListQuery({ filters: { status: "open" } });
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
      toast(r.status === "resolved" ? "Report resolved" : "Report dismissed");
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
            { value: "open", label: "Open" },
            { value: "resolved", label: "Resolved" },
            { value: "dismissed", label: "Dismissed" },
          ]}
        />
        <FilterSelect
          allLabel="Reports & blocks"
          value={list.filters.type}
          onChange={(v) => list.setFilter("type", v)}
          options={[
            { value: "conversation", label: "Reported conversations" },
            { value: "block", label: "Blocks" },
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
              r.status === "open" && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      update.mutate({ id: r.id, status: "dismissed" })
                    }
                  >
                    Dismiss
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
              <StatusBadge status={resolving.status} />
            </>
          ) : undefined
        }
        confirmLabel="Resolve"
        loading={update.isPending}
        onConfirm={(note) =>
          resolving &&
          update.mutate({ id: resolving.id, status: "resolved", note })
        }
      />
    </Card>
  );
}
