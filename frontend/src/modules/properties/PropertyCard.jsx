import { Link } from "react-router-dom";
import { Bath, BedDouble, MapPin, Users } from "lucide-react";
import { Photo, Stars, StatusBadge } from "@/components/ui";
import { aed } from "@/lib/format";

/** Property tile modelled on the "Featured Properties" / "My Properties" cards. */
export function PropertyCard({ property: p }) {
  return (
    <Link
      to={`/properties/${p.id}`}
      className="group block overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
    >
      <div className="relative">
        <Photo src={p.photos[0]} alt={p.name} className="aspect-[4/3] w-full" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {p.guestFavourite ? (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink shadow-sm">
              🏆 Guest favourite
            </span>
          ) : (
            <span />
          )}
          <span className="rounded-full bg-white/95 shadow-sm">
            <StatusBadge status={p.status} />
          </span>
        </div>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold group-hover:text-primary">
            {p.name}
          </p>
          <Stars value={p.rating} />
        </div>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-muted">
          <MapPin className="size-3.5 shrink-0" />
          {p.area}, {p.cityName}
        </p>
        <div className="mt-2.5 flex items-center gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="size-3.5" />
            {p.bedrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="size-3.5" />
            {p.bathrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {p.maxGuests}
          </span>
          <span className="ms-auto text-[13px] text-ink">
            <b>{aed(p.pricePerNight)}</b>
            <span className="text-ink-muted"> / night</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
