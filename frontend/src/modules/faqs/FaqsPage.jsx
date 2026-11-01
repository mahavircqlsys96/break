import { PageHeader, Badge } from "@/components/ui";
import {
  EntityTable,
  activeCol,
} from "../master-data/MasterDataPage";
import { HelpCircle } from "lucide-react";

export const FAQ_CATEGORIES = [
  "Bookings & guests",
  "Payouts & fees",
  "Listing & calendar",
  "Safety & incidents",
  "General",
];

export const TARGET_AUDIENCES = ["Host", "Guest", "All"];

const ENTITY = {
  key: "faqs",
  title: "Frequently Asked Questions",
  singular: "FAQ",
  filterKey: "category",
  filterOptions: FAQ_CATEGORIES,
  fields: [
    { key: "question", label: "Question", type: "text", required: true },
    {
      key: "category",
      label: "Topic / Category",
      type: "select",
      options: FAQ_CATEGORIES,
      required: true,
    },
    {
      key: "section",
      label: "Subtopic / Section (e.g. Requests, Guests, Calendar)",
      type: "text",
      required: false,
    },
    {
      key: "targetAudience",
      label: "Target Audience",
      type: "select",
      options: TARGET_AUDIENCES,
      required: true,
    },
    {
      key: "sortOrder",
      label: "Sort Order / Display Priority",
      type: "number",
      required: false,
    },
    {
      key: "answer",
      label: "Detailed Answer",
      type: "textarea",
      required: true,
    },
    { key: "active", label: "Active Status", type: "toggle" },
  ],
  columns: [
    {
      key: "question",
      header: "Question & Answer Preview",
      render: (r) => (
        <div className="flex items-start gap-3 py-1">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-primary mt-0.5">
            <HelpCircle className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink leading-tight">{r.question || r.name}</p>
            {r.answer && (
              <p className="mt-0.5 text-xs text-ink-muted truncate max-w-md">
                {r.answer}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Topic / Category",
      render: (r) => (
        <Badge tone="accent">
          {r.category || r.type || "Bookings & guests"}
        </Badge>
      ),
    },
    {
      key: "section",
      header: "Section",
      render: (r) =>
        r.section ? (
          <Badge tone="neutral">{r.section}</Badge>
        ) : (
          <span className="text-xs text-ink-muted">—</span>
        ),
    },
    {
      key: "targetAudience",
      header: "Audience",
      render: (r) => {
        const aud = r.targetAudience || "Host";
        const tone = aud === "Host" ? "primary" : aud === "Guest" ? "success" : "neutral";
        return <Badge tone={tone}>{aud}</Badge>;
      },
    },
    {
      key: "sortOrder",
      header: "Order",
      render: (r) => (
        <span className="text-xs font-semibold text-ink-muted">
          #{r.sortOrder ?? 0}
        </span>
      ),
    },
    activeCol,
  ],
  defaults: {
    name: "",
    question: "",
    answer: "",
    category: "Bookings & guests",
    section: "Requests",
    targetAudience: "Host",
    sortOrder: 0,
    active: true,
  },
};

export function FaqsPage() {
  return (
    <>
      <PageHeader
        title="Frequently Asked Questions (FAQs)"
        subtitle="Manage frequently asked questions, help answers, and topic sections shown in the mobile apps."
      />
      <EntityTable entity={ENTITY} />
    </>
  );
}
