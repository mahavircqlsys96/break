import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Ban,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Landmark,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  X,
  XCircle,
} from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  DetailList,
  Modal,
  PageHeader,
  Pagination,
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

function DocumentThumbnail({ title, side, imageUrl, onPreview }) {
  const [error, setError] = useState(false);

  if (!imageUrl) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-line bg-bg aspect-[4/3] flex flex-col items-center justify-center text-center p-2 text-ink-muted">
        <FileText className="size-6 mb-1 opacity-40" />
        <span className="text-[11px]">No {side.toLowerCase()} image</span>
      </div>
    );
  }

  return (
    <div className="relative group overflow-hidden rounded-xl border border-line bg-bg aspect-[4/3] flex flex-col items-center justify-center text-center p-2">
      {!error ? (
        <img
          src={imageUrl}
          alt={`${title} - ${side}`}
          onError={() => setError(true)}
          className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="size-full flex flex-col items-center justify-center p-2 bg-gradient-to-br from-bg to-surface-elevated text-ink">
          <div className="size-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent mb-1">
            <FileCheck2 className="size-4" />
          </div>
          <span className="text-[11px] font-semibold text-ink line-clamp-1">{title}</span>
          <span className="text-[10px] text-ink-muted">{side}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          type="button"
          onClick={() => onPreview(imageUrl, `${title} — ${side}`)}
          className="flex items-center gap-1.5 rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm hover:bg-surface"
        >
          <Eye className="size-3.5" />
          View
        </button>
      </div>
      <span className="absolute bottom-1.5 left-1.5 rounded bg-ink/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-[2px]">
        {side}
      </span>
    </div>
  );
}

export function HostDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const toast = useToast();

  const [suspend, setSuspend] = useState(false);
  const [rejectIdentityModal, setRejectIdentityModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [previewDocTitle, setPreviewDocTitle] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["hosts", id],
    queryFn: () => hostService.get(id),
  });

  // Host suspension mutation
  const status = useMutation({
    mutationFn: (s) => hostService.setStatus(id, s),
    onSuccess: (h) => {
      qc.invalidateQueries({ queryKey: ["hosts"] });
      toast(h?.status === "active" ? "Host approved" : "Host suspended");
      setSuspend(false);
    },
  });

  // Identity verification mutation
  const verifyIdentity = useMutation({
    mutationFn: ({ verificationStatus, notes }) =>
      hostService.updateVerification(id, verificationStatus, notes),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["hosts"] });
      toast(
        vars.verificationStatus === "Verified"
          ? "Host identity approved"
          : "Host identity rejected"
      );
      setRejectIdentityModal(false);
      setRejectReason("");
    },
  });

  // Payout account verification mutation
  const verifyPayout = useMutation({
    mutationFn: (payoutStatus) => hostService.updatePayout(id, payoutStatus),
    onSuccess: (_, s) => {
      qc.invalidateQueries({ queryKey: ["hosts"] });
      toast(s === "Verified" ? "Payout account approved" : "Payout account rejected");
    },
  });

  // Permit verification mutation
  const verifyPermit = useMutation({
    mutationFn: (permitStatus) => hostService.updatePermit(id, permitStatus),
    onSuccess: (_, s) => {
      qc.invalidateQueries({ queryKey: ["hosts"] });
      toast(s === "Approved" ? "Holiday home permit approved" : "Permit rejected");
    },
  });

  const [payoutPage, setPayoutPage] = useState(1);
  const payoutPageSize = 10;

  if (isLoading || !data) return <PageLoader />;
  const h = data.host;
  const propertiesList = data?.properties || [];

  const displayPayouts = data?.payouts?.slice(
    (payoutPage - 1) * payoutPageSize,
    payoutPage * payoutPageSize
  );

  const copyToClipboard = (text, message = "Copied to clipboard") => {
    navigator.clipboard?.writeText(text);
    toast(message);
  };

  const isApproved = h.verificationStatus === "Verified";

  const handleApproveHost = () => {
    verifyIdentity.mutate({ verificationStatus: "Verified" });
    if (h.status !== "active") {
      status.mutate("active");
    }
    if (h.payoutStatus === "Pending") {
      verifyPayout.mutate("Verified");
    }
    if (h.holidayHomePermitStatus === "Pending") {
      verifyPermit.mutate("Approved");
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <BackLink to="/hosts" label="Hosts" />

        {/* Top Header Approval & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isApproved ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-success/30 bg-success-soft px-3 py-1.5 text-xs font-bold text-success">
                <BadgeCheck className="size-4" />
                Approved Host
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleApproveHost}
                loading={verifyIdentity.isPending}
                className="border-success/40 text-success hover:bg-success-soft text-xs"
                title="Re-confirm approval"
              >
                <Check className="size-3.5" />
                Approve Again
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleApproveHost}
              loading={verifyIdentity.isPending}
              className="bg-success hover:bg-success/90 text-white font-semibold shadow-sm px-4 flex items-center gap-1.5"
            >
              <Check className="size-4" />
              Approve Host
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setRejectIdentityModal(true)}
            className="border-danger/30 text-danger hover:bg-danger-soft text-xs"
          >
            <X className="size-3.5" />
            Reject
          </Button>

          {h.status === "active" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuspend(true)}
              className="text-danger hover:bg-danger-soft hover:border-danger/30 text-xs"
            >
              <Ban className="size-3.5" />
              Suspend
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => status.mutate("active")}
              loading={status.isPending}
              className="text-xs"
            >
              <Check className="size-3.5" />
              Reactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column: Host Profile & Verification Documentation */}
        <div className="space-y-4">
          {/* Host Profile Card */}
          <Card>
            <div className="flex flex-col items-center pb-4 text-center">
              <Avatar name={h.name} src={h.image} size={84} />
              <p className="mt-3 text-lg font-bold">{h.name}</p>
              <p className="text-[13px] text-ink-muted">{h.email}</p>
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge status={h.status} />
                {h.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    <BadgeCheck className="size-3.5" />
                    Verified Host
                  </span>
                )}
              </div>
            </div>
            <DetailList
              items={[
                { label: "Phone", value: `${h.dialCode} ${h.phone}` },
                { label: "Country", value: h.country },
                { label: "Gender", value: label(h.gender) },
                { label: "Response rate", value: `${h.responseRate}%` },
                {
                  label: "Member since",
                  value: h.joinedAt ? date(h.joinedAt) : "—",
                },
              ]}
            />
          </Card>

          {/* Identity Verification Card (Screen 2: Choose your ID) */}
          <Card title="Identity Verification">
            <div className="space-y-3.5">
              {/* Document Header */}
              <div className="flex items-start justify-between gap-2 rounded-2xl bg-bg p-3.5 border border-line/60">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                      h.verificationStatus === "Verified"
                        ? "bg-success-soft text-success"
                        : h.verificationStatus === "Pending"
                        ? "bg-warning-soft text-[#B8740F]"
                        : h.verificationStatus === "Rejected"
                        ? "bg-danger-soft text-danger"
                        : "bg-surface-elevated text-ink-muted"
                    }`}
                  >
                    {h.verificationStatus === "Verified" ? (
                      <BadgeCheck className="size-5" />
                    ) : h.verificationStatus === "Rejected" ? (
                      <XCircle className="size-5" />
                    ) : (
                      <FileCheck2 className="size-5" />
                    )}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-ink">
                        {h.idDocumentType || "Identity Document"}
                      </p>
                      {h.idDocumentType === "UAE Pass" && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                          UAE Pass
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {h.idDocumentType === "Emirates ID"
                        ? "For UAE residents"
                        : h.idDocumentType === "Passport"
                        ? "For visitors and GCC nationals"
                        : "Fastest verification via UAE Pass"}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    h.verificationStatus === "Verified"
                      ? "bg-success-soft text-success"
                      : h.verificationStatus === "Pending"
                      ? "bg-warning-soft text-[#B8740F]"
                      : h.verificationStatus === "Rejected"
                      ? "bg-danger-soft text-danger"
                      : "bg-surface-elevated text-ink-muted"
                  }`}
                >
                  {h.verificationStatus || "Unverified"}
                </span>
              </div>

              {/* Document Number */}
              {h.idDocumentNumber && h.idDocumentNumber !== "—" && (
                <div className="rounded-xl border border-line bg-surface p-3 text-xs">
                  <span className="text-ink-muted block text-[11px]">
                    Document / Registration Number
                  </span>
                  <div className="mt-1 flex items-center justify-between font-mono font-medium text-ink">
                    <span>{h.idDocumentNumber}</span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(h.idDocumentNumber, "Document number copied")
                      }
                      className="text-ink-muted hover:text-accent transition-colors"
                      title="Copy document number"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Rejection Note Alert Banner */}
              {h.verificationStatus === "Rejected" && h.verificationNotes && (
                <div className="rounded-xl border border-danger/30 bg-danger-soft/40 p-3 text-xs text-danger flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Rejection Reason:</span>
                    <p className="mt-0.5 leading-relaxed">{h.verificationNotes}</p>
                  </div>
                </div>
              )}

              {/* Document Images Preview (Front & Back) */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-ink-muted block">
                  Uploaded Document Media
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <DocumentThumbnail
                    title={h.idDocumentType || "Identity Document"}
                    side="Front side"
                    imageUrl={h.idDocumentFront}
                    onPreview={(url, title) => {
                      setPreviewDocUrl(url);
                      setPreviewDocTitle(title);
                    }}
                  />
                  <DocumentThumbnail
                    title={h.idDocumentType || "Identity Document"}
                    side={h.idDocumentType === "Passport" ? "Passport Page" : "Back side"}
                    imageUrl={h.idDocumentBack}
                    onPreview={(url, title) => {
                      setPreviewDocUrl(url);
                      setPreviewDocTitle(title);
                    }}
                  />
                </div>
              </div>

              {/* Admin Verification Action Buttons */}
              <div className="border-t border-line/70 pt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={h.verificationStatus === "Verified" ? "outline" : "solid"}
                  className={
                    h.verificationStatus === "Verified"
                      ? "border-success/40 text-success hover:bg-success-soft"
                      : "bg-success hover:bg-success/90 text-white"
                  }
                  onClick={() =>
                    verifyIdentity.mutate({ verificationStatus: "Verified" })
                  }
                  loading={verifyIdentity.isPending}
                >
                  <Check className="size-3.5" />
                  {h.verificationStatus === "Verified" ? "Approved" : "Approve Identity"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="border-danger/40 text-danger hover:bg-danger-soft"
                  onClick={() => setRejectIdentityModal(true)}
                  disabled={verifyIdentity.isPending}
                >
                  <X className="size-3.5" />
                  Reject...
                </Button>
              </div>
            </div>
          </Card>

          {/* Payout Account Card (Screen 3: Payout account) */}
          <Card title="Payout Account">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-line/60">
                <span className="text-ink-muted">Status</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    h.payoutStatus === "Verified"
                      ? "bg-success-soft text-success"
                      : h.payoutStatus === "Pending"
                      ? "bg-warning-soft text-[#B8740F]"
                      : "bg-surface-elevated text-ink-muted"
                  }`}
                >
                  {h.payoutStatus || "Not Added"}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-ink-muted text-[11px] block">
                    Account Holder Name
                  </span>
                  <p className="font-semibold text-sm text-ink mt-0.5">
                    {h.accountHolderName || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-ink-muted text-[11px] block">Bank Name</span>
                  <p className="font-semibold text-ink flex items-center gap-1.5 mt-0.5">
                    <Landmark className="size-3.5 text-accent" />
                    {h.bankName || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-ink-muted text-[11px] block">IBAN Number</span>
                  <div className="flex items-center justify-between font-mono font-medium text-ink bg-bg rounded-lg px-2.5 py-1.5 mt-0.5 border border-line">
                    <span className="truncate">{h.iban || "—"}</span>
                    {h.iban && h.iban !== "—" && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(h.iban, "IBAN copied to clipboard")}
                        className="text-ink-muted hover:text-accent ml-2 shrink-0"
                        title="Copy IBAN"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {h.trn && h.trn !== "—" && (
                  <div>
                    <span className="text-ink-muted text-[11px] block">
                      Tax Registration Number (TRN)
                    </span>
                    <p className="font-mono text-ink mt-0.5">{h.trn}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-line/70 pt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-success/40 text-success hover:bg-success-soft text-xs"
                  onClick={() => verifyPayout.mutate("Verified")}
                  loading={verifyPayout.isPending}
                >
                  <Check className="size-3" />
                  Approve Payout
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-danger/40 text-danger hover:bg-danger-soft text-xs"
                  onClick={() => verifyPayout.mutate("Rejected")}
                  loading={verifyPayout.isPending}
                >
                  <X className="size-3" />
                  Reject
                </Button>
              </div>
            </div>
          </Card>

          {/* Holiday Home Permit Card (Screen 1 Step 4) */}
          <Card title="Holiday Home Permit (DET / DTCM)">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-line/60">
                <span className="text-ink-muted">Permit Status</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    h.holidayHomePermitStatus === "Approved"
                      ? "bg-success-soft text-success"
                      : h.holidayHomePermitStatus === "Pending"
                      ? "bg-warning-soft text-[#B8740F]"
                      : "bg-surface-elevated text-ink-muted"
                  }`}
                >
                  {h.holidayHomePermitStatus || "Not Uploaded"}
                </span>
              </div>

              <div>
                <span className="text-ink-muted text-[11px] block">Permit Number</span>
                <p className="font-mono font-semibold text-ink mt-0.5">
                  {h.holidayHomePermitNumber || "—"}
                </p>
              </div>

              {h.holidayHomePermitDoc && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewDocUrl(h.holidayHomePermitDoc);
                      setPreviewDocTitle(`Holiday Home Permit — #${h.holidayHomePermitNumber || ""}`);
                    }}
                    className="flex items-center gap-1.5 text-accent hover:underline text-xs font-semibold"
                  >
                    <Eye className="size-3.5" />
                    View Permit Certificate
                  </button>
                </div>
              )}

              <div className="border-t border-line/70 pt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-success/40 text-success hover:bg-success-soft text-xs"
                  onClick={() => verifyPermit.mutate("Approved")}
                  loading={verifyPermit.isPending}
                >
                  <Check className="size-3" />
                  Approve Permit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-danger/40 text-danger hover:bg-danger-soft text-xs"
                  onClick={() => verifyPermit.mutate("Rejected")}
                  loading={verifyPermit.isPending}
                >
                  <X className="size-3" />
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 2 columns: Stats, Properties, Bookings, Payouts */}
        <div className="space-y-4 lg:col-span-2">
          {/* Stat Cards */}
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
              value={typeof h.rating === "number" ? h.rating.toFixed(1) : "5.0"}
              icon={<Star className="size-5" />}
            />
          </div>

          {/* Properties Card */}
          <Card title={`Properties (${propertiesList.length})`}>
            {propertiesList.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                This host has not created any listings yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {propertiesList.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </Card>

          {/* Recent Bookings */}
          <Card title="Recent Bookings" padded={false}>
            <div className="mt-3">
              <BookingsTable rows={data.bookings} hide={["host"]} />
            </div>
          </Card>

          {/* Payouts Table */}
          <Card title="Payout History" padded={false}>
            <div className="mt-3">
              <DataTable
                rows={displayPayouts}
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
              {data.payouts && data.payouts.length > payoutPageSize && (
                <Pagination
                  page={payoutPage}
                  pageSize={payoutPageSize}
                  total={data.payouts.length}
                  onPage={setPayoutPage}
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Reject Identity Modal */}
      <Modal
        open={rejectIdentityModal}
        onClose={() => setRejectIdentityModal(false)}
        title="Reject Identity Verification"
        subtitle={`Please state the reason for rejecting ${h.name}'s identity documentation.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectIdentityModal(false)}>
              Cancel
            </Button>
            <Button
              variant="solid"
              className="bg-danger hover:bg-danger/90 text-white"
              onClick={() =>
                verifyIdentity.mutate({
                  verificationStatus: "Rejected",
                  notes: rejectReason.trim() || "Identity document verification failed.",
                })
              }
              loading={verifyIdentity.isPending}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-ink">
            Reason for rejection (sent to host)
          </label>
          <textarea
            rows={4}
            className="w-full rounded-xl border border-line bg-bg p-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
            placeholder="e.g. The photo of your Emirates ID is blurry or expired. Please upload a clear photo of the front and back of your renewed Emirates ID."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* Document Lightbox / Preview Modal */}
      <Modal
        open={!!previewDocUrl}
        onClose={() => setPreviewDocUrl(null)}
        title={previewDocTitle || "Document Preview"}
        size="lg"
      >
        <div className="flex flex-col items-center justify-center p-2">
          {previewDocUrl && (
            <img
              src={previewDocUrl}
              alt="Document Full View"
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-md"
            />
          )}
        </div>
      </Modal>

      {/* Suspend Host Dialog */}
      <ConfirmDialog
        open={suspend}
        onClose={() => setSuspend(false)}
        title="Suspend host?"
        loading={status.isPending}
        message="Their listings will be hidden from guests until the host is reactivated."
        confirmLabel="Suspend"
        onConfirm={() => status.mutate("inactive")}
      />
    </>
  );
}
