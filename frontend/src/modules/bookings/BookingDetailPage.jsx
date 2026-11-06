import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Baby,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  PawPrint,
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
  PageHeader,
  PageLoader,
  Photo,
  StatusBadge,
  useToast,
} from "@/components/ui";
import { bookingService } from "@/services";
import { aed, dateTime, label } from "@/lib/format";
import { BackLink } from "../BackLink";

export function BookingDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const [cancel, setCancel] = useState(false);
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

  return (
    <>
      <PageHeader
        back={<BackLink to="/bookings">Bookings</BackLink>}
        title={b.code}
        subtitle={`Booked on ${dateTime(b.createdAt)}`}
        actions={
          <>
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
                      className="font-display text-xl font-semibold hover:text-primary"
                    >
                      {b.propertyName}
                    </Link>
                    <p className="text-[13px] text-ink-muted">
                      {property?.area}, {b.cityName}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-bg p-3">
                    <p className="text-xs text-ink-muted">Check-in</p>
                    <p className="font-semibold">{dateTime(b.checkIn)}</p>
                  </div>
                  <div className="rounded-2xl bg-bg p-3">
                    <p className="text-xs text-ink-muted">Check-out</p>
                    <p className="font-semibold">{dateTime(b.checkOut)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Guests">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  icon: Users,
                  label: "Adults",
                  sub: "Ages 13+",
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
                  sub: "Service animals incl.",
                  value: b.pets,
                },
                {
                  icon: CalendarDays,
                  label: "Nights",
                  sub: `${aed(b.pricePerNight)} / night`,
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
