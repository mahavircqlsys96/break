import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Copy,
  Pencil,
  Percent,
  Plus,
  Tag,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Field,
  FilterSelect,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  StatusBadge,
  Tabs,
  Textarea,
  Toggle,
  Toolbar,
  useToast,
} from "@/components/ui";
import { promoCodeService } from "@/services";
import { useListQuery } from "@/lib/useListQuery";
import { aed, date } from "@/lib/format";

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed Amount (AED)" },
];

export function PromoCodesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const list = useListQuery({
    pageSize: 10,
    sortBy: "createdAt",
    sortDir: "desc",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Form state
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minBookingAmount: "",
    maxDiscount: "",
    startDate: "",
    endDate: "",
    usageLimit: "0",
    active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  const { data, isFetching } = useQuery({
    queryKey: ["promoCodes", list.query],
    queryFn: () => promoCodeService.list(list.query),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (editingPromo?.id) {
        return promoCodeService.update(editingPromo.id, payload);
      }
      return promoCodeService.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promoCodes"] });
      toast(editingPromo ? "Promo code updated successfully" : "Promo code created successfully");
      closeModal();
    },
    onError: (err) => {
      toast(err.message || "Failed to save promo code", "danger");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => promoCodeService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promoCodes"] });
      toast("Promo code deleted");
      setDeletingId(null);
    },
    onError: (err) => {
      toast(err.message || "Failed to delete promo code", "danger");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => promoCodeService.toggleStatus(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["promoCodes"] });
      toast("Promo code status updated");
    },
    onError: (err) => {
      toast(err.message || "Failed to toggle status", "danger");
    },
  });

  const openCreateModal = () => {
    setEditingPromo(null);
    setForm({
      code: "",
      title: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minBookingAmount: "",
      maxDiscount: "",
      startDate: "",
      endDate: "",
      usageLimit: "0",
      active: true,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingPromo(item);
    setForm({
      code: item.code || "",
      title: item.title || "",
      description: item.description || "",
      discountType: item.discountType || "percentage",
      discountValue: item.discountValue !== undefined ? String(item.discountValue) : "",
      minBookingAmount: item.minBookingAmount ? String(item.minBookingAmount) : "",
      maxDiscount: item.maxDiscount ? String(item.maxDiscount) : "",
      startDate: item.startDate ? item.startDate.slice(0, 10) : "",
      endDate: item.endDate ? item.endDate.slice(0, 10) : "",
      usageLimit: item.usageLimit !== undefined ? String(item.usageLimit) : "0",
      active: item.status === "Active" || item.active === true,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPromo(null);
    setFormErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.code.trim()) errs.code = "Promo code is required";
    if (!form.discountValue || isNaN(form.discountValue) || Number(form.discountValue) <= 0) {
      errs.discountValue = "Valid discount value is required";
    }
    if (form.discountType === "percentage" && Number(form.discountValue) > 100) {
      errs.discountValue = "Percentage discount cannot exceed 100%";
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      minBookingAmount: form.minBookingAmount ? parseFloat(form.minBookingAmount) : 0,
      maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      usageLimit: parseInt(form.usageLimit, 10) || 0,
      status: form.active ? "Active" : "Inactive",
      active: form.active,
    };

    saveMutation.mutate(payload);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast(`Copied ${code} to clipboard`);
  };

  const items = data?.items || [];
  const totalCodes = data?.total || items.length;
  const activeCodes = items.filter((p) => p.status === "Active" || p.active).length;
  const totalUsed = items.reduce((sum, p) => sum + (p.usedCount || 0), 0);

  return (
    <>
      <PageHeader
        title="Promo Codes"
        subtitle="Manage promotional discount codes and coupons applied on bookings."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={openCreateModal}>
            Create promo code
          </Button>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <StatCard
          label="Total Promo Codes"
          value={totalCodes}
          icon={<Ticket className="size-5" />}
          tone="accent"
        />
        <StatCard
          label="Active Coupons"
          value={activeCodes}
          icon={<CheckCircle2 className="size-5" />}
          tone="success"
        />
        <StatCard
          label="Total Bookings Discounted"
          value={totalUsed}
          icon={<Percent className="size-5" />}
          tone="warning"
        />
      </div>

      {/* Tabs */}
      <Tabs
        className="mb-4"
        value={list.filters.status ?? "all"}
        onChange={(v) => list.setFilter("status", v === "all" ? undefined : v)}
        tabs={[
          { key: "all", label: "All Codes" },
          { key: "active", label: "Active" },
          { key: "inactive", label: "Inactive" },
        ]}
      />

      {/* Main Card with Toolbar & DataTable */}
      <div className="card overflow-hidden">
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search promo code, title..."
        >
          <FilterSelect
            allLabel="All discount types"
            value={list.filters.discountType}
            onChange={(v) => list.setFilter("discountType", v)}
            options={DISCOUNT_TYPES}
          />
        </Toolbar>

        <DataTable
          rows={items}
          loading={isFetching}
          empty={
            <EmptyState
              icon={<Ticket className="size-8" />}
              title="No promo codes found"
              message="Create a new discount code for your guests to apply at booking checkout."
              action={
                <Button size="sm" icon={<Plus className="size-4" />} onClick={openCreateModal}>
                  Create code
                </Button>
              }
            />
          }
          columns={[
            {
              key: "code",
              header: "Code & Campaign",
              render: (r) => (
                <div className="py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-wider bg-accent-soft text-primary px-2.5 py-1 rounded-lg border border-accent/20">
                      {r.code}
                    </span>
                    <button
                      type="button"
                      title="Copy code"
                      onClick={() => copyCode(r.code)}
                      className="text-ink-muted transition hover:text-primary"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                  {r.title && (
                    <p className="mt-1 font-semibold text-xs text-ink leading-tight">
                      {r.title}
                    </p>
                  )}
                  {r.description && (
                    <p className="text-[11px] text-ink-muted truncate max-w-xs mt-0.5">
                      {r.description}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: "discount",
              header: "Discount",
              render: (r) => (
                <div>
                  <span className="font-bold text-sm text-ink">
                    {r.discountType === "percentage"
                      ? `${r.discountValue}% OFF`
                      : aed(r.discountValue)}
                  </span>
                  {r.discountType === "percentage" && r.maxDiscount && (
                    <p className="text-[11px] text-ink-muted">
                      Max {aed(r.maxDiscount)}
                    </p>
                  )}
                  <div className="mt-0.5">
                    <Badge tone={r.discountType === "percentage" ? "accent" : "warning"}>
                      {r.discountType === "percentage" ? "Percentage" : "Fixed AED"}
                    </Badge>
                  </div>
                </div>
              ),
            },
            {
              key: "minBooking",
              header: "Min. Booking",
              render: (r) => (
                <span className="text-xs font-medium text-ink">
                  {r.minBookingAmount > 0 ? aed(r.minBookingAmount) : "No minimum"}
                </span>
              ),
            },
            {
              key: "validity",
              header: "Validity",
              render: (r) => (
                <div className="text-xs text-ink-muted">
                  {r.startDate || r.endDate ? (
                    <>
                      <p>{r.startDate ? date(r.startDate) : "Anytime"}</p>
                      <p className="text-[11px] text-ink-muted/80">
                        to {r.endDate ? date(r.endDate) : "Indefinite"}
                      </p>
                    </>
                  ) : (
                    <span>No expiration</span>
                  )}
                </div>
              ),
            },
            {
              key: "usage",
              header: "Redemptions",
              render: (r) => (
                <div className="text-xs">
                  <span className="font-semibold text-ink">{r.usedCount || 0}</span>
                  <span className="text-ink-muted">
                    {r.usageLimit > 0 ? ` / ${r.usageLimit} uses` : " uses (unlimited)"}
                  </span>
                  {r.usageLimit > 0 && (
                    <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.round(((r.usedCount || 0) / r.usageLimit) * 100))}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate(r.id)}
                    className="cursor-pointer transition hover:opacity-80"
                    title="Toggle active status"
                  >
                    <StatusBadge status={r.status === "Active" || r.active ? "active" : "inactive"} />
                  </button>
                </div>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (r) => (
                <div className="flex items-center justify-end gap-1">
                  <IconButton
                    label="Edit promo code"
                    onClick={() => openEditModal(r)}
                  >
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Delete promo code"
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                    onClick={() => setDeletingId(r.id)}
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ),
            },
          ]}
        />

        {data && data.total > data.pageSize && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPage={list.setPage}
          />
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingPromo ? "Edit Promo Code" : "Create Promo Code"}
        subtitle="Set up booking discount coupon details, rules and expiration."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              loading={saveMutation.isPending}
              onClick={handleSubmit}
            >
              {editingPromo ? "Save changes" : "Create promo code"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Promo Code *" error={formErrors.code} hint="Uppercase identifier guests enter (e.g. SUMMER20)">
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER20"
                className="font-mono uppercase font-bold"
              />
            </Field>

            <Field label="Discount Type *">
              <Select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                options={DISCOUNT_TYPES}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label={form.discountType === "percentage" ? "Discount Percentage (%) *" : "Discount Amount (AED) *"}
              error={formErrors.discountValue}
            >
              <Input
                type="number"
                step="any"
                min="0"
                max={form.discountType === "percentage" ? "100" : undefined}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === "percentage" ? "20" : "100"}
              />
            </Field>

            {form.discountType === "percentage" ? (
              <Field label="Max Discount Cap (AED)" hint="Optional max ceiling limit for discount">
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                  placeholder="e.g. 500"
                />
              </Field>
            ) : (
              <Field label="Min Booking Amount (AED)" hint="Minimum booking subtotal required">
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={form.minBookingAmount}
                  onChange={(e) => setForm({ ...form, minBookingAmount: e.target.value })}
                  placeholder="e.g. 1000"
                />
              </Field>
            )}
          </div>

          {form.discountType === "percentage" && (
            <Field label="Min Booking Amount (AED)" hint="Minimum booking subtotal required to apply this coupon">
              <Input
                type="number"
                step="any"
                min="0"
                value={form.minBookingAmount}
                onChange={(e) => setForm({ ...form, minBookingAmount: e.target.value })}
                placeholder="0 for no minimum"
              />
            </Field>
          )}

          <Field label="Campaign / Promotion Title" hint="Internal title or customer-facing banner">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Summer Vacation Special 20% Off"
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Explain where and how this promo applies..."
              rows={2}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Start Date">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>

            <Field label="End Date (Expiry)">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-center pt-1">
            <Field label="Usage Limit" hint="0 means unlimited uses">
              <Input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="0"
              />
            </Field>

            <div className="flex items-center justify-between rounded-2xl border border-line p-3 mt-4">
              <div>
                <p className="text-xs font-semibold text-ink">Active Status</p>
                <p className="text-[11px] text-ink-muted">Can guests apply this code</p>
              </div>
              <Toggle
                checked={form.active}
                onChange={(checked) => setForm({ ...form, active: checked })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        title="Delete Promo Code?"
        message="Are you sure you want to delete this promo code? Existing booking records will keep their historical discount, but no new bookings will be able to apply it."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deletingId)}
      />
    </>
  );
}

export default PromoCodesPage;

