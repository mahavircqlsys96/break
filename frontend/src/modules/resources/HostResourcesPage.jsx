import { PageHeader, Badge } from "@/components/ui";
import {
  EntityTable,
  activeCol,
} from "../master-data/MasterDataPage";
import { DynamicIcon } from "@/components/DynamicIcon";

export const RESOURCE_TYPES = [
  "Hosting resources",
  "Bookings & guests",
  "Payouts & fees",
  "Listing & calendar",
  "Safety & incidents",
];

const ENTITY = {
  key: "hostResources",
  title: "Host Resources",
  singular: "resource article",
  filterKey: "type",
  filterOptions: RESOURCE_TYPES,
  fields: [
    { key: "title", label: "Guide / Article Title", type: "text", required: true },
    {
      key: "type",
      label: "Category / Type",
      type: "select",
      options: RESOURCE_TYPES,
      required: true,
    },
    { key: "subtitle", label: "Subtitle / Tagline", type: "text", required: false },
    { key: "readTime", label: "Read Time (e.g. 3 min read)", type: "text", required: false },
    { key: "content", label: "Article Content / Guidelines", type: "textarea", required: false },
    { key: "icon", label: "Icon", type: "icon" },
    { key: "image", label: "Featured Image URL (Optional)", type: "text", required: false },
    { key: "featured", label: "Featured in Top Banner", type: "toggle" },
    { key: "active", label: "Active Status", type: "toggle" },
  ],
  columns: [
    {
      key: "title",
      header: "Guide & Details",
      render: (r) => (
        <div className="flex items-start gap-3 py-1">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-primary mt-0.5">
            <DynamicIcon name={r.icon || "BookOpen"} className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink leading-tight">{r.title || r.name}</p>
            {r.subtitle && (
              <p className="mt-0.5 text-xs text-ink-muted truncate max-w-md">
                {r.subtitle}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <Badge tone="accent">
          {r.type || "Hosting resources"}
        </Badge>
      ),
    },
    {
      key: "featured",
      header: "Featured",
      render: (r) =>
        r.featured ? (
          <Badge tone="warning">⭐ Featured</Badge>
        ) : (
          <span className="text-xs text-ink-muted">—</span>
        ),
    },
    {
      key: "readTime",
      header: "Read Time",
      render: (r) => (
        <span className="text-xs text-ink-muted font-medium">
          {r.readTime || "3 min read"}
        </span>
      ),
    },
    activeCol,
  ],
  defaults: {
    name: "",
    title: "",
    type: "Hosting resources",
    subtitle: "",
    content: "",
    readTime: "3 min read",
    icon: "BookOpen",
    image: "",
    featured: false,
    active: true,
  },
};

export function HostResourcesPage() {
  return (
    <>
      <PageHeader
        title="Host Resources & Guides"
        subtitle="Manage hosting guides, help articles, and FAQ topics shown to hosts in the mobile app."
      />
      <EntityTable entity={ENTITY} />
    </>
  );
}
