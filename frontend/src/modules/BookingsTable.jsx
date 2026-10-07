import { useNavigate } from "react-router-dom";
import { CalendarX } from "lucide-react";
import { DataTable, EmptyState, Photo, StatusBadge } from "@/components/ui";
import { aed, dateRange } from "@/lib/format";

/** Compact bookings table reused on guest, host and property detail pages. */
export function BookingsTable({ rows, hide = [] }) {
  const navigate = useNavigate();
  return (
    <DataTable
      rows={rows}
      onRowClick={(b) => navigate(`/bookings/${b.id}`)}
      empty={
        <EmptyState
          icon={<CalendarX className="size-8" />}
          title="No bookings yet"
        />
      }
      columns={[
        {
          key: "code",
          header: "Booking",
          render: (b) => <span className="font-semibold">{b.code}</span>,
        },
        ...(hide.includes("property")
          ? []
          : [
              {
                key: "property",
                header: "Property",
                render: (b) => (
                  <div className="flex items-center gap-2.5">
                    <Photo
                      src={b.propertyPhoto}
                      alt={b.propertyName}
                      className="size-9 rounded-lg"
                    />
                    <span className="font-medium">{b.propertyName}</span>
                  </div>
                ),
              },
            ]),
        ...(hide.includes("guest")
          ? []
          : [{ key: "guest", header: "Guest", render: (b) => b.guestName }]),
        ...(hide.includes("host")
          ? []
          : [{ key: "host", header: "Host", render: (b) => b.hostName }]),
        {
          key: "dates",
          header: "Dates",
          render: (b) => (
            <span className="whitespace-nowrap text-ink-muted">
              {dateRange(b.checkIn, b.checkOut)}
            </span>
          ),
        },
        {
          key: "total",
          header: "Total",
          render: (b) => (
            <span className="whitespace-nowrap font-semibold">
              {aed(b.total)}
            </span>
          ),
        },
        {
          key: "status",
          header: "Status",
          render: (b) => <StatusBadge status={b.status} />,
        },
      ]}
    />
  );
}
