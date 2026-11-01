import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  Tabs,
  Textarea,
  Toggle,
  useToast,
} from "@/components/ui";
import { DynamicIcon, ICONS } from "@/components/DynamicIcon";
import { masterData } from "@/services";
import { cn } from "@/lib/cn";
import { label as titleCase } from "@/lib/format";

export const toggleCol = (key, header) => ({
  key,
  header,
  render: (r) =>
    r[key] ? (
      <Badge tone="success" dot>
        Yes
      </Badge>
    ) : (
      <Badge dot>No</Badge>
    ),
});
export const activeCol = {
  key: "active",
  header: "Status",
  render: (r) => (
    <Badge tone={r.active ? "success" : "neutral"} dot>
      {r.active ? "Active" : "Inactive"}
    </Badge>
  ),
};
export const nameCols = (withIcon = false) => [
  {
    key: "name",
    header: "Name",
    render: (r) => (
      <span className="inline-flex items-center gap-2.5 font-semibold">
        {withIcon && (
          <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-primary">
            <DynamicIcon name={String(r.icon)} className="size-4" />
          </span>
        )}
        {String(r.name)}
      </span>
    ),
  },
];
export const nameFields = [
  { key: "name", label: "Name", type: "text" },
];

export const AMENITY_TYPES = [
  "Essentials",
  "Kitchen & dining",
  "Bathroom",
  "Entertainment",
  "Pool & wellness",
  "Outdoor & view",
  "Farm & desert",
  "Sports & activities",
  "Family & kids",
  "Privacy & safety",
  "Access & parking",
  "Services & location",
];

const ENTITIES = [
  {
    key: "propertyTypes",
    title: "Property types",
    singular: "property type",
    fields: [
      ...nameFields,
      { key: "icon", label: "Icon", type: "icon" },
      { key: "order", label: "Display order", type: "number" },
      { key: "active", label: "Active", type: "toggle" },
    ],
    columns: [
      ...nameCols(true),
      { key: "order", header: "Order", render: (r) => String(r.order) },
      activeCol,
    ],
    defaults: { name: "", icon: "Home", order: 5, active: true },
  },
  {
    key: "amenities",
    title: "Amenities",
    singular: "amenity",
    filterKey: "type",
    filterOptions: AMENITY_TYPES,
    fields: [
      ...nameFields,
      {
        key: "type",
        label: "Amenity Type",
        type: "select",
        options: AMENITY_TYPES,
      },
      { key: "icon", label: "Icon", type: "icon" },
      { key: "active", label: "Active", type: "toggle" },
    ],
    columns: [
      ...nameCols(true),
      {
        key: "type",
        header: "Amenity Type",
        render: (r) => (
          <Badge tone="accent">{r.type || r.group || "Essentials"}</Badge>
        ),
      },
      activeCol,
    ],
    defaults: {
      name: "",
      type: "Essentials",
      icon: "Sparkles",
      active: true,
    },
  },
  {
    key: "cities",
    title: "Cities",
    singular: "city",
    fields: [
      ...nameFields,
      {
        key: "emirate",
        label: "Emirate",
        type: "select",
        options: [
          "Abu Dhabi",
          "Dubai",
          "Sharjah",
          "Ajman",
          "Umm Al Quwain",
          "Ras Al Khaimah",
          "Fujairah",
        ],
      },
      { key: "featured", label: 'Show in "Explore by City"', type: "toggle" },
      { key: "active", label: "Active", type: "toggle" },
    ],
    columns: [
      ...nameCols(),
      { key: "emirate", header: "Emirate", render: (r) => String(r.emirate) },
      toggleCol("featured", "Explore by City"),
      activeCol,
    ],
    defaults: {
      name: "",
      emirate: "Dubai",
      featured: false,
      active: true,
    },
  },
  {
    key: "animals",
    title: "Farm animals",
    singular: "animal",
    fields: [...nameFields],
    columns: [...nameCols()],
    defaults: { name: "" },
  },
  {
    key: "policies",
    title: "Cancellation policies",
    singular: "policy",
    fields: [
      { key: "name", label: "Name", type: "text" },
      {
        key: "description",
        label: "Description shown to guests",
        type: "textarea",
      },
      { key: "refundPercent", label: "Refund %", type: "number" },
      { key: "daysBefore", label: "Days before check-in", type: "number" },
      { key: "active", label: "Active", type: "toggle" },
    ],
    columns: [
      {
        key: "name",
        header: "Policy",
        render: (r) => (
          <div>
            <p className="font-semibold">{String(r.name)}</p>
            <p className="text-xs text-ink-muted">{String(r.description)}</p>
          </div>
        ),
      },
      {
        key: "refund",
        header: "Refund",
        render: (r) => `${r.refundPercent}% up to ${r.daysBefore}d before`,
      },
      activeCol,
    ],
    defaults: {
      name: "",
      description: "",
      refundPercent: 100,
      daysBefore: 1,
      active: true,
    },
  },
  {
    key: "countries",
    title: "Countries",
    singular: "country",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "iso", label: "ISO code", type: "text" },
      { key: "dialCode", label: "Dial code", type: "text" },
      { key: "flag", label: "Flag emoji", type: "text" },
      { key: "gcc", label: 'Show in "GCC Countries"', type: "toggle" },
      { key: "active", label: "Active", type: "toggle" },
    ],
    columns: [
      {
        key: "name",
        header: "Country",
        render: (r) => (
          <span className="inline-flex items-center gap-2.5 font-semibold">
            <span className="text-xl">{String(r.flag)}</span>
            {String(r.name)}
          </span>
        ),
      },
      {
        key: "dialCode",
        header: "Dial code",
        render: (r) => String(r.dialCode),
      },
      toggleCol("gcc", "GCC"),
      activeCol,
    ],
    defaults: {
      name: "",
      iso: "",
      dialCode: "+",
      flag: "",
      gcc: false,
      active: true,
    },
  },
];

export function MasterDataPage() {
  const [tab, setTab] = useState("propertyTypes");
  const entity = ENTITIES.find((e) => e.key === tab);
  return (
    <>
      <PageHeader
        title="Master Data"
        subtitle="Lists that power filters, pickers and onboarding in the Break apps."
      />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={ENTITIES.map((e) => ({ key: e.key, label: e.title }))}
      />
      <EntityTable key={entity.key} entity={entity} />
    </>
  );
}

export function EntityTable({ entity }) {
  const qc = useQueryClient();
  const toast = useToast();
  const svc = masterData[entity.key];
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({});
  const [page, setPage] = useState(1);
  const [filterVal, setFilterVal] = useState("all");
  const [search, setSearch] = useState("");
  const pageSize = 10;
  const { data, isLoading } = useQuery({
    queryKey: ["md", entity.key],
    queryFn: svc.all,
  });

  const filteredData = (data ?? []).filter((item) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = String(item.name || item.title || "").toLowerCase().includes(q);
      const matchType = String(item.type || item.group || "").toLowerCase().includes(q);
      if (!matchName && !matchType) return false;
    }
    if (entity.filterKey && filterVal !== "all") {
      const val = item[entity.filterKey] || item.type || item.group;
      return String(val || "").toLowerCase() === filterVal.toLowerCase();
    }
    return true;
  });

  const displayData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const invalidate = (msg) => {
    qc.invalidateQueries({ queryKey: ["md", entity.key] });
    toast(msg);
  };
  const save = useMutation({
    mutationFn: () =>
      editing === "new" ? svc.create(form) : svc.update(editing.id, form),
    onSuccess: () => {
      invalidate(`${titleCase(entity.singular)} saved`);
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id) => svc.remove(id),
    onSuccess: () => {
      invalidate(`${titleCase(entity.singular)} deleted`);
      setDeleting(null);
    },
  });
  const quickToggle = useMutation({
    mutationFn: (r) => svc.update(r.id, { active: !r.active }),
    onSuccess: () => invalidate("Status updated"),
  });

  const open = (row) => {
    setForm(row === "new" ? { ...entity.defaults } : { ...row });
    setEditing(row);
  };
  const valid = entity.fields
    .filter((f) => f.required === true || (f.required !== false && (f.key === "name" || f.key === "title")))
    .every((f) => String(form[f.key] ?? "").trim());

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <p className="text-[13px] text-ink-muted">
            <b className="text-ink">{filteredData.length}</b>{" "}
            {entity.title.toLowerCase()}
            {filterVal !== "all" && <span className="text-primary font-medium"> in {filterVal}</span>}
          </p>
          <div className="relative">
            <Input
              type="search"
              placeholder={`Search ${entity.title.toLowerCase()}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-8 w-44 text-xs sm:w-60"
            />
          </div>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={() => open("new")}>
          Add {entity.singular}
        </Button>
      </div>

      {entity.filterKey && entity.filterOptions && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line/70 bg-canvas-soft/40 px-4 py-2.5">
          <button
            type="button"
            onClick={() => {
              setFilterVal("all");
              setPage(1);
            }}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition",
              filterVal === "all"
                ? "bg-primary text-white shadow-sm"
                : "border border-line bg-surface text-ink-muted hover:border-accent hover:text-primary"
            )}
          >
            All ({data?.length ?? 0})
          </button>
          {entity.filterOptions.map((opt) => {
            const count = (data ?? []).filter(
              (d) =>
                String(d[entity.filterKey] || d.type || d.group || "").toLowerCase() ===
                opt.toLowerCase()
            ).length;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setFilterVal(opt);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  filterVal.toLowerCase() === opt.toLowerCase()
                    ? "bg-primary text-white shadow-sm"
                    : "border border-line bg-surface text-ink-muted hover:border-accent hover:text-primary"
                )}
              >
                {opt} {count > 0 && <span className="opacity-75 font-normal">({count})</span>}
              </button>
            );
          })}
        </div>
      )}

      <DataTable
        rows={displayData}
        loading={isLoading}
        columns={[
          ...entity.columns,
          {
            key: "actions",
            header: "",
            className: "w-36 text-end",
            render: (r) => (
              <div className="flex items-center justify-end gap-1">
                {entity.fields.some((f) => f.key === "active") && (
                  <Toggle
                    checked={!!r.active}
                    onChange={() => quickToggle.mutate(r)}
                    label={`Toggle ${String(r.name)}`}
                  />
                )}
                <IconButton label="Edit" onClick={() => open(r)}>
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton
                  label="Delete"
                  onClick={() => setDeleting(r)}
                  className="hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
      />
      {filteredData.length > pageSize && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredData.length}
          onPage={setPage}
        />
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`${editing === "new" ? "Add" : "Edit"} ${entity.singular}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              disabled={!valid}
              loading={save.isPending}
              onClick={() => save.mutate()}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {entity.fields.map((f) => {
            const v = form[f.key];
            const set = (value) => setForm((s) => ({ ...s, [f.key]: value }));
            if (f.type === "toggle") {
              return (
                <label
                  key={f.key}
                  className="flex items-center justify-between rounded-2xl border border-line/70 px-4 py-3 text-[13px] font-semibold"
                >
                  {f.label}
                  <Toggle checked={!!v} onChange={set} label={f.label} />
                </label>
              );
            }
            return (
              <Field key={f.key} label={f.label}>
                {f.type === "textarea" ? (
                  <Textarea
                    value={String(v ?? "")}
                    onChange={(e) => set(e.target.value)}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={String(v ?? "")}
                    onChange={(e) => set(e.target.value)}
                    options={f.options.map((o) =>
                      typeof o === "object"
                        ? o
                        : {
                            value: o,
                            label: o,
                          }
                    )}
                  />
                ) : f.type === "icon" ? (
                  <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
                    {Object.keys(ICONS).map((name) => (
                      <button
                        key={name}
                        type="button"
                        aria-label={name}
                        title={name}
                        onClick={() => set(name)}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-xl border transition",
                          v === name
                            ? "border-accent bg-accent-soft text-primary"
                            : "border-line text-ink-muted hover:border-accent/60",
                        )}
                      >
                        <DynamicIcon name={name} className="size-5" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <Input
                    dir={f.dir}
                    type={f.type === "number" ? "number" : "text"}
                    value={String(v ?? "")}
                    onChange={(e) =>
                      set(
                        f.type === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                )}
              </Field>
            );
          })}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${entity.singular}?`}
        message={
          <>
            "{String(deleting?.name ?? "")}" will be removed from the apps.
            Consider deactivating it instead.
          </>
        }
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
