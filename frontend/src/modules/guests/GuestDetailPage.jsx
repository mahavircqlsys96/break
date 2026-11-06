import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BadgeCheck,
  Ban,
  CalendarCheck,
  Check,
  Coins,
  Copy,
  ExternalLink,
  Eye,
  FileCheck2,
  Heart,
  ShieldCheck,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DetailList,
  Modal,
  PageHeader,
  PageLoader,
  StatCard,
  StatusBadge,
  Textarea,
  useToast,
} from "@/components/ui";
import { guestService } from "@/services";
import { aed, date, label } from "@/lib/format";
import { BackLink } from "../BackLink";
import { BookingsTable } from "../BookingsTable";
import { SIGNUP_OPTIONS } from "./GuestsPage";

function DocumentThumbnail({ title, side, imageUrl, onPreview }) {
  if (!imageUrl) {
    return (
      <div className="rounded-xl border border-dashed border-line p-3 text-center bg-bg/50">
        <span className="text-[11px] font-medium text-ink-muted block">{side}</span>
        <span className="text-[11px] text-ink-muted/70 italic mt-0.5 block">Not uploaded</span>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl border border-line bg-surface overflow-hidden shadow-xs">
      <div className="h-28 w-full bg-ink/5 overflow-hidden flex items-center justify-center">
        <img
          src={imageUrl}
          alt={`${title} - ${side}`}
          className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
        />
      </div>
      <div className="p-2 flex items-center justify-between text-xs border-t border-line/60 bg-surface">
        <span className="font-medium text-ink truncate text-[11px]">{side}</span>
        <button
          type="button"
          onClick={() => onPreview(imageUrl, `${title} (${side})`)}
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
        >
          <Eye className="size-3" /> View
        </button>
      </div>
    </div>
  );
}

export function GuestDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(null);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [previewDocTitle, setPreviewDocTitle] = useState("");
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["guests", id],
    queryFn: () => guestService.get(id),
  });

  const status = useMutation({
    mutationFn: (s) => guestService.setStatus(id, s),
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: ["guests"] });
      toast(g?.status === "blocked" ? "Guest blocked" : "Guest unblocked");
      setConfirm(null);
    },
  });

  const remove = useMutation({
    mutationFn: () => guestService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests"] });
      toast("Guest account deleted");
      navigate("/guests");
    },
  });

  const verifyIdentity = useMutation({
    mutationFn: ({ verificationStatus, notes }) =>
      guestService.updateVerification(id, verificationStatus, notes),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["guests"] });
      toast(
        vars.verificationStatus === "Verified"
          ? "Guest identity approved"
          : "Guest identity rejected"
      );
      setRejectModal(false);
      setRejectReason("");
    },
    onError: (err) => {
      toast(err.message || "Failed to update identity verification", "danger");
    },
  });

  if (isLoading || !data) return <PageLoader />;
  const g = data.guest;
  const blocked = g.status === "blocked";
  const isVerified = g.verificationStatus === "Verified";

  const copyToClipboard = (text, msg) => {
    navigator.clipboard.writeText(text);
    toast(msg || "Copied to clipboard");
  };

  return (
    <>
      <PageHeader
        back={<BackLink to="/guests">Guests</BackLink>}
        title={g.name}
        subtitle={`Member since ${date(g.joinedAt)}`}
        actions={
          <>
            {isVerified ? (
              <Badge tone="success" dot>
                Verified Guest
              </Badge>
            ) : (
              <Button
                icon={<BadgeCheck className="size-4" />}
                loading={verifyIdentity.isPending}
                onClick={() => verifyIdentity.mutate({ verificationStatus: "Verified" })}
              >
                Approve ID Proof
              </Button>
            )}
            <Button
              variant="secondary"
              icon={<Ban className="size-4" />}
              onClick={() => setConfirm(blocked ? "unblock" : "block")}
            >
              {blocked ? "Unblock guest" : "Block guest"}
            </Button>
            <Button
              variant="danger-soft"
              icon={<Trash2 className="size-4" />}
              onClick={() => setConfirm("delete")}
            >
              Delete account
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left Column: Profile & Identity Verification */}
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col items-center pb-4 text-center">
              <Avatar name={g.name} src={g.image} size={84} />
              <p className="mt-3 text-lg font-bold">{g.name}</p>
              <p className="text-[13px] text-ink-muted">{g.email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <StatusBadge status={g.status} />
                <Badge tone={isVerified ? "success" : g.verificationStatus === "Rejected" ? "danger" : "warning"} dot>
                  {g.verificationStatus || "Unverified"}
                </Badge>
                <Badge tone="accent">
                  {g.language === "ar" ? "Arabic" : "English"}
                </Badge>
              </div>
            </div>
            <DetailList
              items={[
                { label: "Phone", value: `${g.dialCode} ${g.phone}` },
                { label: "Country", value: g.country },
                { label: "Gender", value: label(g.gender) },
                { label: "Date of birth", value: date(g.dob) },
                {
                  label: "Signed up with",
                  value: SIGNUP_OPTIONS.find((o) => o.value === g.signupMethod)?.label,
                },
                { label: "Last active", value: date(g.lastActiveAt) },
              ]}
            />
          </Card>

          {/* Identity Verification Card (Admin Approval) */}
          <Card title="Identity Proof & KYC">
            <div className="space-y-3.5">
              {/* Document Header */}
              <div className="flex items-start justify-between gap-2 rounded-2xl bg-bg p-3.5 border border-line/60">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                      isVerified
                        ? "bg-success-soft text-success"
                        : g.verificationStatus === "Pending"
                        ? "bg-warning-soft text-[#B8740F]"
                        : g.verificationStatus === "Rejected"
                        ? "bg-danger-soft text-danger"
                        : "bg-surface text-ink-muted"
                    }`}
                  >
                    {isVerified ? (
                      <BadgeCheck className="size-5" />
                    ) : g.verificationStatus === "Rejected" ? (
                      <XCircle className="size-5" />
                    ) : (
                      <FileCheck2 className="size-5" />
                    )}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-ink">
                        {g.idDocumentType || "Identity Document"}
                      </p>
                      {g.idDocumentType === "UAE Pass" && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                          UAE Pass
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {g.idDocumentType === "Emirates ID"
                        ? "UAE Resident Card"
                        : g.idDocumentType === "Passport"
                        ? "International / GCC Passport"
                        : "Digital Identity Document"}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isVerified
                      ? "bg-success-soft text-success"
                      : g.verificationStatus === "Pending"
                      ? "bg-warning-soft text-[#B8740F]"
                      : g.verificationStatus === "Rejected"
                      ? "bg-danger-soft text-danger"
                      : "bg-line/60 text-ink-muted"
                  }`}
                >
                  {g.verificationStatus || "Unverified"}
                </span>
              </div>

              {/* Document Number */}
              {g.idDocumentNumber && g.idDocumentNumber !== "—" && (
                <div className="rounded-xl border border-line bg-surface p-3 text-xs">
                  <span className="text-ink-muted block text-[11px]">
                    Document / Registration Number
                  </span>
                  <div className="mt-1 flex items-center justify-between font-mono font-medium text-ink">
                    <span>{g.idDocumentNumber}</span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(g.idDocumentNumber, "Document number copied")
                      }
                      className="text-ink-muted hover:text-primary transition-colors"
                      title="Copy document number"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Rejection Note Alert Banner */}
              {g.verificationStatus === "Rejected" && g.verificationNotes && (
                <div className="rounded-xl border border-danger/30 bg-danger-soft/40 p-3 text-xs text-danger flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Rejection Reason:</span>
                    <p className="mt-0.5 leading-relaxed">{g.verificationNotes}</p>
                  </div>
                </div>
              )}

              {/* Document Images Preview (Front & Back) */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-ink-muted block">
                  Uploaded Document Photos
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <DocumentThumbnail
                    title={g.idDocumentType || "Identity Document"}
                    side="Front side"
                    imageUrl={g.idDocumentFront}
                    onPreview={(url, title) => {
                      setPreviewDocUrl(url);
                      setPreviewDocTitle(title);
                    }}
                  />
                  <DocumentThumbnail
                    title={g.idDocumentType || "Identity Document"}
                    side={g.idDocumentType === "Passport" ? "Passport Page" : "Back side"}
                    imageUrl={g.idDocumentBack}
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
                  variant={isVerified ? "secondary" : "primary"}
                  onClick={() =>
                    verifyIdentity.mutate({ verificationStatus: "Verified" })
                  }
                  loading={verifyIdentity.isPending}
                >
                  <Check className="size-3.5" />
                  {isVerified ? "Approved" : "Approve Identity"}
                </Button>

                <Button
                  size="sm"
                  variant="danger-soft"
                  onClick={() => setRejectModal(true)}
                  disabled={verifyIdentity.isPending}
                >
                  <X className="size-3.5" />
                  Reject ID
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Stats & Bookings */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Bookings"
              value={g.bookings}
              icon={<CalendarCheck className="size-5" />}
            />
            <StatCard
              label="Total spent"
              value={aed(g.totalSpent)}
              icon={<Coins className="size-5" />}
              tone="success"
            />
            <StatCard
              label="Wishlists"
              value={g.wishlists}
              icon={<Heart className="size-5" />}
              tone="warning"
            />
          </div>
          <Card title="Bookings" padded={false}>
            <div className="mt-3">
              <BookingsTable rows={data.bookings} hide={["guest"]} />
            </div>
          </Card>
        </div>
      </div>

      {/* Reject Identity Modal */}
      <Modal
        open={rejectModal}
        onClose={() => setRejectModal(false)}
        title="Reject Identity Document"
        subtitle="Explain to the guest why their ID was rejected so they can re-upload."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={verifyIdentity.isPending}
              onClick={() => {
                verifyIdentity.mutate({
                  verificationStatus: "Rejected",
                  notes: rejectReason.trim() || "Identity document verification failed. Please re-upload clear photos.",
                });
              }}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-ink">
            Reason for rejection:
          </label>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. The document is expired, blurry, or edges are cut off..."
            rows={3}
          />
        </div>
      </Modal>

      {/* Document Image Zoom Preview Modal */}
      <Modal
        open={Boolean(previewDocUrl)}
        onClose={() => setPreviewDocUrl(null)}
        title={previewDocTitle || "Document Preview"}
        size="lg"
      >
        <div className="flex flex-col items-center justify-center p-2 bg-black/5 rounded-2xl overflow-hidden min-h-[350px]">
          {previewDocUrl ? (
            <img
              src={previewDocUrl}
              alt={previewDocTitle}
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-md"
            />
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm === "block"}
        onClose={() => setConfirm(null)}
        title="Block guest?"
        loading={status.isPending}
        message="They will be signed out and won't be able to book or message hosts."
        confirmLabel="Block"
        onConfirm={() => status.mutate("blocked")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        title="Delete account?"
        loading={remove.isPending}
        message="This permanently deletes the guest account. Booking history is kept for accounting."
        confirmLabel="Delete"
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}

export default GuestDetailPage;
