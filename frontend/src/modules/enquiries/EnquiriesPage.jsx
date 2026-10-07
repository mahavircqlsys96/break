import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Inbox, Mail, Reply, X } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  PageHeader,
  Pagination,
  StatusBadge,
  Tabs,
  Textarea,
  Toolbar,
  useToast,
} from "@/components/ui";
import { enquiryService } from "@/services";
import { useListQuery } from "@/lib/useListQuery";
import { ago, dateTime } from "@/lib/format";

export function EnquiriesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const list = useListQuery();
  const [open, setOpen] = useState(null);
  const [reply, setReply] = useState("");
  const { data, isFetching } = useQuery({
    queryKey: ["enquiries", list.query],
    queryFn: () => enquiryService.list(list.query),
    placeholderData: keepPreviousData,
  });

  const done = (e, msg) => {
    qc.invalidateQueries({ queryKey: ["enquiries"] });
    toast(msg);
    setOpen(e);
    setReply("");
  };
  const send = useMutation({
    mutationFn: () => enquiryService.reply(open.id, reply.trim()),
    onSuccess: (e) => done(e, `Reply emailed to ${e.email}`),
  });
  const close = useMutation({
    mutationFn: () => enquiryService.setStatus(open.id, "closed"),
    onSuccess: (e) => done(e, "Enquiry closed"),
  });

  return (
    <>
      <PageHeader
        title="Contact Enquiries"
        subtitle="Messages submitted from the Contact Us form in the user and host apps."
      />
      <Tabs
        className="mb-4"
        value={list.filters.status ?? "all"}
        onChange={(v) => list.setFilter("status", v)}
        tabs={[
          { key: "all", label: "All" },
          { key: "new", label: "New" },
          { key: "replied", label: "Replied" },
          { key: "closed", label: "Closed" },
        ]}
      />
      <div className="card overflow-hidden">
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search name, email or message"
        />
        <DataTable
          rows={data?.items}
          loading={isFetching}
          onRowClick={(e) => {
            setOpen(e);
            setReply("");
          }}
          empty={
            <EmptyState
              icon={<Inbox className="size-8" />}
              title="Inbox zero"
              message="No enquiries match."
            />
          }
          columns={[
            {
              key: "name",
              header: "From",
              render: (e) => (
                <div className="flex items-center gap-3">
                  <Avatar name={e.name} />
                  <div className="min-w-0">
                    <p className="font-semibold">{e.name}</p>
                    <p className="truncate text-xs text-ink-muted">{e.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "message",
              header: "Message",
              className: "max-w-md",
              render: (e) => (
                <p className="line-clamp-2 text-ink-muted">{e.message}</p>
              ),
            },
            {
              key: "source",
              header: "App",
              render: (e) => (
                <Badge tone="accent">
                  {e.source === "host_app" ? "Host app" : "User app"}
                </Badge>
              ),
            },
            {
              key: "createdAt",
              header: "Received",
              render: (e) => (
                <span className="whitespace-nowrap text-ink-muted">
                  {ago(e.createdAt)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (e) => <StatusBadge status={e.status} />,
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

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title="Enquiry"
        footer={
          open &&
          open.status !== "closed" && (
            <>
              <Button
                variant="secondary"
                icon={<X className="size-4" />}
                loading={close.isPending}
                onClick={() => close.mutate()}
              >
                Close enquiry
              </Button>
              <Button
                icon={<Reply className="size-4" />}
                disabled={!reply.trim()}
                loading={send.isPending}
                onClick={() => send.mutate()}
              >
                Send reply
              </Button>
            </>
          )
        }
      >
        {open && (
          <div className="space-y-4">
            <div className="card flex items-center gap-3 p-4">
              <Avatar name={open.name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{open.name}</p>
                <a
                  href={`mailto:${open.email}`}
                  className="inline-flex items-center gap-1 text-xs text-accent hover:text-primary"
                >
                  <Mail className="size-3" />
                  {open.email}
                </a>
              </div>
              <StatusBadge status={open.status} />
            </div>
            <div className="card p-4">
              <p className="text-xs text-ink-muted">
                {dateTime(open.createdAt)} ·{" "}
                {open.source === "host_app" ? "Host app" : "User app"}
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed">
                {open.message}
              </p>
            </div>
            {open.reply && (
              <div className="rounded-2xl bg-accent-soft p-4">
                <p className="text-xs font-semibold text-primary">Your reply</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed">
                  {open.reply}
                </p>
              </div>
            )}
            {open.status !== "closed" && (
              <Field
                label={open.reply ? "Send another reply" : "Reply"}
                hint="Sent to the customer by email."
              >
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply…"
                />
              </Field>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
