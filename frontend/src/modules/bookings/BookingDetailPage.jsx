import { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Baby,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Download,
  Info,
  LogIn,
  LogOut,
  Moon,
  PawPrint,
  Percent,
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

/**
 * Opens a dedicated popup print window containing ONLY the official receipt ticket.
 * If popups are blocked, falls back to portal-isolated window.print().
 */
function downloadOnlyReceipt(b, guest, property) {
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

  const guestName = b.guestName || guest?.name || "Abdulla";
  const propertyName = b.propertyName || property?.name || "The Azure Waterfront Estate";
  const bookingCode = b.code || "BRK-7905-MMUQ";
  const dates = `${date(b.checkIn)} – ${date(b.checkOut)} · ${b.nights || 1} night${(b.nights || 1) > 1 ? "s" : ""}`;
  const rateLine = `${aed(b.pricePerNight)} × ${b.nights || 1} nights`;
  const subtotal = aed(b.subtotal);
  const total = aed(b.total);
  const statusLabel = isPaid ? "Paid" : label(b.paymentStatus || b.status);
  const cardBrand = b.cardBrand || "Visa";
  const cardLast4 = b.cardLast4 || "4582";
  const chargedAt = dateTime(b.createdAt);

  const promoSection = b.promoCode
    ? `
      <div style="display:flex;justify-content:space-between;align-items:center;color:#059669;font-weight:600;background:#ecfdf5;padding:5px 8px;border-radius:8px;margin:3px 0;">
        <span>🎟 Promo code (${b.promoCode})</span>
        <span>-${aed(b.promoDiscount || b.discountAmount || 0)}</span>
      </div>
    `
    : "";

  const cleaningFee =
    b.cleaningFee > 0
      ? `<div style="display:flex;justify-content:space-between;color:#716e7f;margin-top:3px;"><span>Cleaning fee</span><span>${aed(b.cleaningFee)}</span></div>`
      : "";
  const serviceFee =
    b.serviceFee > 0
      ? `<div style="display:flex;justify-content:space-between;color:#716e7f;margin-top:3px;"><span>Break service fee</span><span>${aed(b.serviceFee)}</span></div>`
      : "";
  const vat =
    b.vat > 0
      ? `<div style="display:flex;justify-content:space-between;color:#716e7f;margin-top:3px;"><span>VAT</span><span>${aed(b.vat)}</span></div>`
      : "";

  const storedComm = typeof localStorage !== "undefined" ? parseFloat(localStorage.getItem("break_admin_commission") || "15") : 15;
  const commPercent = Number(b.commissionPercent || storedComm || 15);
  const adminCommission = Number(
    b.adminCommission !== undefined && b.adminCommission > 0
      ? b.adminCommission
      : Math.round((b.subtotal || b.amount || 0) * (commPercent / 100))
  );
  const hostPayout = Number(
    b.hostAmount !== undefined && b.hostAmount > 0
      ? b.hostAmount
      : Math.max(0, (b.subtotal || b.amount || 0) - adminCommission)
  );

  const commissionSection = `
    <div style="display:flex;justify-content:space-between;align-items:center;color:#4338ca;font-weight:600;background:#eef2ff;padding:5px 8px;border-radius:8px;margin:4px 0;">
      <span>💼 Admin commission (${commPercent}%)</span>
      <span>${aed(adminCommission)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;color:#716e7f;font-size:11px;padding:2px 4px;margin-bottom:2px;">
      <span>Host payout</span>
      <span style="font-weight:600;color:#1e1b2e;">${aed(hostPayout)}</span>
    </div>
  `;

  try {
    const printWindow = window.open("", "_blank", "width=450,height=720");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Receipt_${bookingCode}</title>
            <style>
              @page { size: auto; margin: 10mm 12mm; }
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", sans-serif;
                background: #ffffff;
                color: #1e1b2e;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                padding: 24px 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .ticket {
                width: 380px;
                max-width: 100%;
                border: 1px solid #e5e7eb;
                border-radius: 24px;
                padding: 24px;
                background: #ffffff;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
              }
              .header { display: flex; justify-content: space-between; align-items: flex-start; }
              .title { font-size: 26px; font-weight: 700; font-family: Georgia, serif; color: #1a1727; line-height: 1.1; }
              .inv { font-size: 11px; color: #716e7f; margin-top: 4px; }
              .pill {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 3px 10px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 600;
                ${isPaid ? "background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;" : "background: #fffbeb; color: #b45309; border: 1px solid #fde68a;"}
              }
              .dot { width: 6px; height: 6px; border-radius: 50%; ${isPaid ? "background: #10b981;" : "background: #f59e0b;"} }
              .divider { border-top: 1px solid #e5e7eb; margin: 14px 0; }
              .list { display: flex; flex-direction: column; gap: 8px; font-size: 11.5px; }
              .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
              .lbl { color: #716e7f; flex-shrink: 0; }
              .val { font-weight: 500; color: #1e1b2e; text-align: right; }
              .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
              .total { display: flex; justify-content: space-between; align-items: center; font-family: Georgia, serif; font-size: 19px; font-weight: 700; color: #1a1727; }
              .pay-box {
                margin-top: 14px;
                background: #faf9f6;
                border: 1px solid #eceae4;
                border-radius: 16px;
                padding: 10px 12px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 11.5px;
              }
              .card-icon {
                width: 32px;
                height: 32px;
                background: #ffffff;
                border: 1px solid #e2dfd7;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
              }
              .card-title { font-weight: 600; color: #1e1b2e; }
              .card-time { font-size: 10px; color: #716e7f; margin-top: 2px; }
              .footer { margin-top: 16px; text-align: center; font-size: 9.5px; color: #8c8997; line-height: 1.4; }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <div>
                  <div class="title">Receipt</div>
                  <div class="inv">No. ${invNumber}</div>
                  <div class="inv">Issued ${date(b.createdAt)}</div>
                </div>
                <div class="pill">
                  <span class="dot"></span>
                  ${statusLabel}
                </div>
              </div>
              <div class="divider"></div>
              <div class="list">
                <div class="row"><span class="lbl">Billed to</span><span class="val">${guestName}</span></div>
                <div class="row"><span class="lbl">Booking</span><span class="val mono">${bookingCode}</span></div>
                <div class="row"><span class="lbl">Stay</span><span class="val">${propertyName}</span></div>
                <div class="row"><span class="lbl">Dates</span><span class="val">${dates}</span></div>
                <div class="row"><span class="lbl">Holiday home permit</span><span class="val mono">${permitNumber}</span></div>
              </div>
              <div class="divider"></div>
              <div class="list">
                <div class="row"><span class="lbl">${rateLine}</span><span class="val">${subtotal}</span></div>
                ${promoSection}
                ${cleaningFee}
                ${serviceFee}
                ${vat}
              </div>
              <div class="divider"></div>
              ${commissionSection}
              <div class="divider"></div>
              <div class="total"><span>Total paid</span><span>${total}</span></div>
              <div class="pay-box">
                <div class="card-icon">💳</div>
                <div>
                  <div class="card-title">${cardBrand} •••• ${cardLast4}</div>
                  <div class="card-time">Charged ${chargedAt}</div>
                </div>
              </div>
              <div class="footer">
                Break Technologies LLC · Abu Dhabi, UAE - TRN 100 4827 5310 0003
              </div>
              <button
                type="button"
                onclick="window.print()"
                class="no-print"
                style="margin-top:16px;width:100%;padding:10px;background:#5B50A0;color:#fff;border:none;border-radius:12px;font-weight:600;font-size:13px;cursor:pointer;"
              >
                🖨 Print / Save PDF
              </button>
            </div>
            <script>
              function triggerPrint() {
                try {
                  window.focus();
                  window.print();
                } catch(e) {}
              }
              if (document.readyState === 'complete') {
                setTimeout(triggerPrint, 150);
              } else {
                window.addEventListener('load', function() { setTimeout(triggerPrint, 150); });
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      try {
        printWindow.focus();
        setTimeout(() => {
          try {
            printWindow.print();
          } catch (_) {}
        }, 300);
      } catch (_) {}
      return;
    }
  } catch (err) {
    console.warn("Popup window unavailable, using in-page print fallback:", err);
  }

  // Fallback: in-page print using portal (#print-receipt-root)
  window.print();
}

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

  const storedComm = typeof localStorage !== "undefined" ? parseFloat(localStorage.getItem("break_admin_commission") || "15") : 15;
  const commPercent = Number(b.commissionPercent || storedComm || 15);
  const adminCommission = Number(
    b.adminCommission !== undefined && b.adminCommission > 0
      ? b.adminCommission
      : Math.round((b.subtotal || b.amount || 0) * (commPercent / 100))
  );
  const hostPayout = Number(
    b.hostAmount !== undefined && b.hostAmount > 0
      ? b.hostAmount
      : Math.max(0, (b.subtotal || b.amount || 0) - adminCommission)
  );

  return (
    <div
      id="printable-receipt"
      className="rounded-3xl border border-line/70 bg-white p-6 shadow-sm max-w-sm w-full mx-auto font-sans text-ink"
    >
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

      {/* Admin Commission & Host Payout split */}
      <div className="mt-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-indigo-700 font-semibold">
          <span className="inline-flex items-center gap-1.5">
            <Coins className="size-3.5" />
            Admin commission ({commPercent}%)
          </span>
          <span>{aed(adminCommission)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-ink-muted">
          <span>Host payout</span>
          <span className="font-semibold text-ink">{aed(hostPayout)}</span>
        </div>
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

      {/* Download PDF button (Hidden in actual printout) */}
      <button
        type="button"
        onClick={onDownload}
        className="no-print mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5B50A0] hover:bg-[#4d4389] py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
      >
        <Download className="size-4" />
        Download PDF
      </button>
    </div>
  );
}

/**
 * Stay schedule & calendar breakdown showing Check-in, Check-out, duration,
 * policies, and day-by-day reserved dates.
 */
function StayScheduleCard({ booking: b, property }) {
  const nights = Math.max(1, Number(b.nights || 1));

  const parseSafeDate = (d) => {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)) {
      const parts = d.split("T")[0].split("-");
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    }
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const startDate = parseSafeDate(b.checkIn);
  const endDate = parseSafeDate(b.checkOut);

  const formatLongDate = (d) => {
    try {
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return date(d);
    }
  };

  const formatFullDate = (d) => {
    try {
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return date(d);
    }
  };

  const checkInTime = property?.houseRules?.checkIn
    ? `From ${property.houseRules.checkIn}`
    : "From 3:00 PM";
  const checkOutTime = property?.houseRules?.checkOut
    ? `By ${property.houseRules.checkOut}`
    : "By 11:00 AM";

  // Generate day-by-day dates list from check-in to check-out
  const scheduleDays = [];
  const baseYear = startDate.getFullYear();
  const baseMonth = startDate.getMonth();
  const baseDay = startDate.getDate();

  for (let i = 0; i <= nights; i++) {
    const curDate = new Date(baseYear, baseMonth, baseDay + i, 12, 0, 0);
    const isFirst = i === 0;
    const isLast = i === nights;

    scheduleDays.push({
      dayIndex: i + 1,
      date: curDate,
      dateStr: formatLongDate(curDate),
      isCheckIn: isFirst,
      isCheckOut: isLast,
      isStayNight: !isLast,
      nightNumber: isLast ? null : i + 1,
      timing: isFirst ? checkInTime : isLast ? checkOutTime : "Full day reserved",
      rate: isLast ? "Departure day" : aed(b.pricePerNight),
    });
  }

  return (
    <Card
      title="Stay Schedule & Booking Dates"
      action={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          <Moon className="size-3.5" />
          {nights} Night{nights > 1 ? "s" : ""} Stay
        </span>
      }
    >
      {/* Visual Check-in / Check-out Banner */}
      <div className="rounded-2xl border border-line bg-gradient-to-br from-emerald-50/40 via-white to-indigo-50/40 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-7 md:items-center">
          {/* Check-in Block */}
          <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-xs md:col-span-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <LogIn className="size-3.5" />
                </span>
                Check-in
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Arrival
              </span>
            </div>
            <p className="mt-3 text-lg font-bold text-ink">
              {formatFullDate(startDate)}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <Clock className="size-3.5 text-emerald-600" />
              <span>{checkInTime}</span>
            </div>
          </div>

          {/* Nights Duration Connector */}
          <div className="flex flex-col items-center justify-center text-center md:col-span-1">
            <div className="flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink shadow-xs">
              <Moon className="size-3 text-accent" />
              <span>{nights}n</span>
            </div>
            <div className="mt-1 hidden text-ink-muted md:block">
              <ArrowRight className="size-4" />
            </div>
          </div>

          {/* Check-out Block */}
          <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-xs md:col-span-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
                <span className="flex size-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <LogOut className="size-3.5" />
                </span>
                Check-out
              </span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                Departure
              </span>
            </div>
            <p className="mt-3 text-lg font-bold text-ink">
              {formatFullDate(endDate)}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <Clock className="size-3.5 text-indigo-600" />
              <span>{checkOutTime}</span>
            </div>
          </div>
        </div>

        {/* Quick Timing & Policy Highlights */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line/70 pt-4 sm:grid-cols-4">
          <div className="rounded-xl bg-bg/80 p-3">
            <p className="text-[11px] font-semibold text-ink-muted">Booking Date</p>
            <p className="mt-1 text-xs font-bold text-ink">{dateTime(b.createdAt)}</p>
          </div>
          <div className="rounded-xl bg-bg/80 p-3">
            <p className="text-[11px] font-semibold text-ink-muted">Length of Stay</p>
            <p className="mt-1 text-xs font-bold text-ink">
              {nights} Night{nights > 1 ? "s" : ""} ({nights + 1} Days)
            </p>
          </div>
          <div className="rounded-xl bg-bg/80 p-3">
            <p className="text-[11px] font-semibold text-ink-muted">Nightly Rate</p>
            <p className="mt-1 text-xs font-bold text-ink">
              {aed(b.pricePerNight)} <span className="text-[10px] font-normal text-ink-muted">/ night</span>
            </p>
          </div>
          <div className="rounded-xl bg-bg/80 p-3">
            <p className="text-[11px] font-semibold text-ink-muted">Permit / Ref</p>
            <p className="mt-1 truncate text-xs font-bold text-ink">
              {property?.holidayHomePermitNumber || b.holidayHomePermitNumber || b.code || "DET 1234567"}
            </p>
          </div>
        </div>
      </div>

      {/* Day-by-Day Reserved Dates Itinerary Table */}
      <div className="mt-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Reserved Calendar Schedule ({scheduleDays.length} Days)
          </h4>
          <span className="text-xs text-ink-muted">
            All dates locked for this reservation
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line/80">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-bg/70 text-[11px] font-semibold text-ink-muted">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Stage & Event</th>
                <th className="px-4 py-2.5">Timing</th>
                <th className="px-4 py-2.5 text-right">Nightly Rate</th>
                <th className="px-4 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 bg-white">
              {scheduleDays.map((s) => (
                <tr
                  key={s.dateStr}
                  className={`transition hover:bg-slate-50/60 ${
                    s.isCheckIn
                      ? "bg-emerald-50/20"
                      : s.isCheckOut
                      ? "bg-indigo-50/20"
                      : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-bg font-mono text-[11px] font-bold text-ink">
                        {s.dayIndex}
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{s.dateStr}</p>
                        <p className="text-[11px] text-ink-muted">
                          {s.isCheckIn
                            ? "Check-in Day"
                            : s.isCheckOut
                            ? "Check-out Day"
                            : `Stay Night ${s.nightNumber}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {s.isCheckIn ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                        <LogIn className="size-3" />
                        Check-in & Night 1
                      </span>
                    ) : s.isCheckOut ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-800">
                        <LogOut className="size-3" />
                        Check-out & Departure
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-800">
                        <Moon className="size-3 text-slate-600" />
                        Night {s.nightNumber} Stay
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3 text-ink-muted" />
                      {s.timing}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink">
                    {s.rate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle2 className="size-3" />
                      Reserved
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
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
    toast("Preparing receipt PDF...");
    downloadOnlyReceipt(b, guest, property);
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
            <Button
              variant="secondary"
              icon={<Download className="size-4" />}
              onClick={handleDownloadPDF}
            >
              Download Receipt PDF
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

          {/* Stay Schedule & Booking Dates (Check-in, Check-out, Itinerary) */}
          <StayScheduleCard booking={b} property={property} />

          {/* Embedded Receipt Card for Review / Export */}
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
                {
                  label: (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-700">
                      <Coins className="size-3.5" />
                      Admin commission ({b.commissionPercent || 15}%)
                    </span>
                  ),
                  value: (
                    <span className="font-bold text-indigo-700">
                      {aed(b.adminCommission || Math.round((b.subtotal || 0) * ((b.commissionPercent || 15) / 100)))}
                    </span>
                  ),
                },
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

            <div className="mt-4 pt-3 border-t border-line/70 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                icon={<Receipt className="size-4" />}
                onClick={() => setReceiptModal(true)}
              >
                View receipt
              </Button>
              <Button
                className="flex-1 bg-[#5B50A0] hover:bg-[#4d4389] text-white"
                icon={<Download className="size-4" />}
                onClick={handleDownloadPDF}
              >
                PDF Receipt
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

      {/* Direct Portal to document.body: Guarantees ONLY the receipt is printed if standard browser print (Ctrl+P) is triggered */}
      {typeof document !== "undefined" &&
        createPortal(
          <div id="print-receipt-root" className="print-only-receipt">
            <BookingReceiptCard
              booking={b}
              guest={guest}
              property={property}
            />
          </div>,
          document.body
        )}

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
