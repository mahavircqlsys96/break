import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Baby,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  PawPrint,
  Printer,
  Receipt,
  Ticket,
  Users,
  XCircle,
} from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  DetailList,
  Modal,
  PageHeader,
  PageLoader,
  Photo,
  StatusBadge,
  useToast,
} from "@/components/ui";
import { bookingService } from "@/services";
import { aed, date, dateTime, label } from "@/lib/format";
import { BackLink } from "../BackLink";

function BookingReceiptCard({ booking: b, guest, property, onDownload }) {
  const isPaid =
    b.paymentStatus === "paid" ||
    b.paymentStatus === "succeeded" ||
    b.status === "confirmed" ||
    b.status === "completed";

  const invNumber =
    b.invoiceNumber ||
    `INV-2026-${String(b.code || b.id || "391447").replace(/[^0-9]/g, "").padStart(6, "0").slice(-6)}`;

  const permitNumber =
    property?.holidayHomePermitNumber ||
    property?.permitNumber ||
    b.holidayHomePermitNumber ||
    "DET 1234567";

  return (
    <div className="rounded-3xl border border-line/70 bg-white p-6 shadow-sm max-w-sm w-full mx-auto font-sans text-ink">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink leading-tight">
            Receipt
          </h2>
          <p className="mt-1 text-xs text-ink-muted">No. {invNumber}</p>
          <p className="text-xs text-ink-muted">Issued {date(b.createdAt)}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            isPaid
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-warning-soft text-[#B8740F] border border-warning/30"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              isPaid ? "bg-emerald-500" : "bg-[#B8740F]"
            }`}
          />
          {isPaid ? "Paid" : label(b.paymentStatus || b.status)}
        </span>
      </div>

      <div className="my-4 border-t border-line/70" />

      {/* Details list */}
      <div className="space-y-2.5 text-xs">
        <div className="flex items-start justify-between gap-2">
          <span className="text-ink-muted">Billed to</span>
          <span className="font-medium text-ink text-right">
            {b.guestName || guest?.name || "Abdulla"}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-ink-muted">Booking</span>
          <span className="font-mono font-medium text-ink">
            {b.code || "BRK-7905-MMUQ"}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-ink-muted">Stay</span>
          <span className="font-medium text-ink text-right max-w-[200px] truncate">
            {b.propertyName || property?.name || "The Azure Waterfront Estate"}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-ink-muted">Dates</span>
          <span className="font-medium text-ink text-right">
            {date(b.checkIn)} – {date(b.checkOut)} · {b.nights || 1} nights
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-ink-muted">Holiday home permit</span>
          <span className="font-mono text-ink text-right">{permitNumber}</span>
        </div>
      </div>

      <div className="my-4 border-t border-line/70" />

      {/* Pricing Breakdown with Promo Code */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted">
            {aed(b.pricePerNight)} × {b.nights || 1} nights
          </span>
          <span className="font-medium text-ink">{aed(b.subtotal)}</span>
        </div>

        {/* Promo code applied discount line */}
        {b.promoCode && (
          <div className="flex items-center justify-between text-emerald-600 font-medium bg-emerald-50/60 -mx-2 px-2 py-1 rounded-lg">
            <span className="inline-flex items-center gap-1.5">
              <Ticket className="size-3.5" />
              Promo code ({b.promoCode})
            </span>
            <span className="font-semibold">
              -{aed(b.promoDiscount || b.discountAmount || 0)}
            </span>
          </div>
        )}

        {b.cleaningFee > 0 && (
          <div className="flex items-center justify-between text-ink-muted">
            <span>Cleaning fee</span>
            <span>{aed(b.cleaningFee)}</span>
          </div>
        )}

        {b.serviceFee > 0 && (
          <div className="flex items-center justify-between text-ink-muted">
            <span>Break service fee</span>
            <span>{aed(b.serviceFee)}</span>
          </div>
        )}

        {b.vat > 0 && (
          <div className="flex items-center justify-between text-ink-muted">
            <span>VAT</span>
            <span>{aed(b.vat)}</span>
          </div>
        )}
      </div>

      <div className="my-4 border-t border-line/70" />

      {/* Total Paid */}
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-lg text-ink">Total paid</span>
        <span className="font-display font-bold text-xl text-ink">
          {aed(b.total)}
        </span>
      </div>

      {/* Payment details box */}
      <div className="mt-4 rounded-2xl border border-line/70 bg-bg/50 p-3 flex items-center gap-3 text-xs">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface border border-line text-ink-muted shadow-xs">
          <CreditCard className="size-4 text-accent" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">
            {b.cardBrand || "Visa"} •••• {b.cardLast4 || "4582"}
          </p>
          <p className="text-[11px] text-ink-muted mt-0.5">
            Charged {dateTime(b.createdAt)}
          </p>
        </div>
      </div>

      {/* LLC footer */}
      <p className="mt-4 text-center text-[10.5px] leading-relaxed text-ink-muted">
        Break Technologies LLC · Abu Dhabi, UAE - TRN 100 4827 5310 0003
      </p>

      {/* Download PDF button */}
      <button
        type="button"
        onClick={onDownload}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5B50A0] hover:bg-[#4d4389] py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
      >
        <Download className="size-4" />
        Download PDF
      </button>
    </div>
  );
}

export function BookingDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const [cancel, setCancel] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", id],
    queryFn: () => bookingService.get(id),
  });

  const status = useMutation({
    mutationFn: ({ s, reason }) => bookingService.setStatus(id, s, reason),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast(
        b.status === "cancelled"
          ? "Booking cancelled and refund issued"
          : `Booking ${b.status}`,
      );
      setCancel(false);
    },
  });

  if (isLoading || !data) return <PageLoader />;
  const { booking: b, guest, host, property } = data;
  const active = b.status === "pending" || b.status === "confirmed";

  const handleDownloadPDF = () => {
    toast("Opening print / PDF dialog...");
    window.print();
  };

  return (
    <>
      <PageHeader
        back={<BackLink to="/bookings">Bookings</BackLink>}
        title={b.code}
        subtitle={`Booked on ${dateTime(b.createdAt)}`}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Receipt className="size-4" />}
              onClick={() => setReceiptModal(true)}
            >
              View Receipt
            </Button>
            {b.status === "pending" && (
              <Button
                icon={<CheckCircle2 className="size-4" />}
                loading={status.isPending}
                onClick={() => status.mutate({ s: "confirmed" })}
              >
                Confirm
              </Button>
            )}
            {active && (
              <Button
                variant="danger-soft"
                icon={<XCircle className="size-4" />}
                onClick={() => setCancel(true)}
              >
                Cancel & refund
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card padded={false} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <Photo
                src={b.propertyPhoto}
                alt={b.propertyName}
                className="h-44 w-full sm:h-auto sm:w-56"
              />
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/properties/${b.propertyId}`}
                      className="font-display text-lg font-semibold hover:text-accent"
                    >
                      {b.propertyName}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {b.cityName}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-[13px]">
                  <CalendarDays className="size-4 text-ink-muted" />
                  <span>
                    {date(b.checkIn)} → {date(b.checkOut)}
                  </span>
                  <span className="text-ink-muted">
                    ({b.nights} night{b.nights > 1 ? "s" : ""})
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-line/70 p-5 sm:grid-cols-4">
              {[
                {
                  icon: Users,
                  label: "Adults",
                  sub: "Over 12 years",
                  value: b.adults,
                },
                {
                  icon: Baby,
                  label: "Children",
                  sub: "Ages 2–12",
                  value: b.children,
                },
                {
                  icon: PawPrint,
                  label: "Pets",
                  sub: "Friendly animals",
                  value: b.pets,
                },
                {
                  icon: CalendarDays,
                  label: "Nights",
                  sub: "Length of stay",
                  value: b.nights,
                },
              ].map((g) => (
                <div
                  key={g.label}
                  className="rounded-2xl border border-line/70 p-3.5"
                >
                  <g.icon className="size-5 text-accent" />
                  <p className="mt-2 text-xl font-bold">{g.value}</p>
                  <p className="text-[13px] font-semibold">{g.label}</p>
                  <p className="text-[11px] text-ink-muted">{g.sub}</p>
                </div>
              ))}
            </div>
          </Card>

          {b.cancelledReason && (
            <Card title="Cancellation">
              <p className="text-[13px] text-ink-muted">
                Reason: <b className="text-ink">{b.cancelledReason}</b>
              </p>
            </Card>
          )}

          {/* Embedded Receipt Card for Easy Printing / Export */}
          <Card title="Tax Invoice & Booking Receipt">
            <div className="flex flex-col items-center justify-center p-2">
              <BookingReceiptCard
                booking={b}
                guest={guest}
                property={property}
                onDownload={handleDownloadPDF}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Price details">
            <DetailList
              items={[
                {
                  label: `${aed(b.pricePerNight)} × ${b.nights} nights`,
                  value: aed(b.subtotal),
                },
                ...(b.promoCode
                  ? [
                      {
                        label: (
                          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                            <Ticket className="size-3.5" />
                            Promo discount ({b.promoCode})
                          </span>
                        ),
                        value: (
                          <span className="font-semibold text-emerald-600">
                            -{aed(b.promoDiscount || b.discountAmount || 0)}
                          </span>
                        ),
                      },
                    ]
                  : []),
                { label: "Cleaning fee", value: aed(b.cleaningFee) },
                { label: "Break service fee", value: aed(b.serviceFee) },
                { label: "VAT", value: aed(b.vat) },
              ]}
            />
            <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
              <span className="font-bold">Total</span>
              <span className="text-lg font-bold">{aed(b.total)}</span>
            </div>
            {b.promoCode && (
              <div className="mt-3.5 flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Ticket className="size-3.5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold tracking-wider text-emerald-900">
                        {b.promoCode}
                      </span>
                      <span className="rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        Applied
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Coupon applied for this booking
                    </p>
                  </div>
                </div>
                <span className="font-bold text-emerald-700">
                  -{aed(b.promoDiscount || b.discountAmount || 0)}
                </span>
              </div>
            )}
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-bg p-3 text-[13px]">
              <CreditCard className="size-5 text-accent" />
              <span className="flex-1">{label(b.paymentMethod)}</span>
              <StatusBadge status={b.paymentStatus} />
            </div>

            <div className="mt-4 pt-3 border-t border-line/70">
              <Button
                variant="secondary"
                className="w-full"
                icon={<Receipt className="size-4" />}
                onClick={() => setReceiptModal(true)}
              >
                View full receipt
              </Button>
            </div>
          </Card>

          {guest && (
            <Card title="Guest">
              <Link
                to={`/guests/${guest.id}`}
                className="flex items-center gap-3 rounded-2xl p-1 transition hover:bg-accent-soft/50"
              >
                <Avatar name={guest.name} src={guest.image} size={44} />
                <div className="min-w-0">
                  <p className="font-semibold">{guest.name}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {guest.dialCode} {guest.phone}
                  </p>
                </div>
              </Link>
            </Card>
          )}

          {host && (
            <Card title="Host">
              <Link
                to={`/hosts/${host.id}`}
                className="flex items-center gap-3 rounded-2xl p-1 transition hover:bg-accent-soft/50"
              >
                <Avatar name={host.name} src={host.image} size={44} />
                <div className="min-w-0">
                  <p className="font-semibold">{host.name}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {host.email}
                  </p>
                </div>
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Dialog for Receipt Popup */}
      <Modal
        open={receiptModal}
        onClose={() => setReceiptModal(false)}
        title="Official Tax Receipt"
        size="md"
      >
        <div className="py-2">
          <BookingReceiptCard
            booking={b}
            guest={guest}
            property={property}
            onDownload={handleDownloadPDF}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={cancel}
        onClose={() => setCancel(false)}
        title="Cancel booking?"
        withReason
        reasonLabel="Cancellation reason"
        message={`The guest will be refunded ${aed(b.total)} and both parties notified.`}
        confirmLabel="Cancel booking"
        loading={status.isPending}
        onConfirm={(reason) => status.mutate({ s: "cancelled", reason })}
      />
    </>
  );
}

export default BookingDetailPage;
