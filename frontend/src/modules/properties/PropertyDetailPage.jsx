import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bath,
  BedDouble,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  MapPin,
  PawPrint,
  Pencil,
  PartyPopper,
  Cigarette,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DetailList,
  PageHeader,
  PageLoader,
  Photo,
  Stars,
  StatusBadge,
  Toggle,
  useToast,
} from "@/components/ui";
import { DynamicIcon } from "@/components/DynamicIcon";
import { propertyService } from "@/services";
import { aed, ago, date } from "@/lib/format";
import { BackLink } from "../BackLink";
import { BookingsTable } from "../BookingsTable";
import { useMasterData } from "../master-data/useMasterData";
import { ANIMAL_AVATARS } from "./AmenitiesPicker";

export function PropertyDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const md = useMasterData();
  const [dialog, setDialog] = useState(null);
  const [photo, setPhoto] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["properties", id],
    queryFn: () => propertyService.get(id),
  });

  const done = (msg) => {
    qc.invalidateQueries({ queryKey: ["properties"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    toast(msg);
    setDialog(null);
  };
  const update = useMutation({
    mutationFn: (p) => propertyService.update(id, p),
    onSuccess: () => done("Property updated"),
  });
  const approve = useMutation({
    mutationFn: () => propertyService.approve(id),
    onSuccess: () => done("Listing approved — the host has been notified"),
  });
  const reject = useMutation({
    mutationFn: (reason) => propertyService.reject(id, reason),
    onSuccess: () => done("Listing rejected"),
  });
  const remove = useMutation({
    mutationFn: () => propertyService.remove(id),
    onSuccess: () => {
      done("Property deleted");
      navigate("/properties");
    },
  });

  if (isLoading || !data) return <PageLoader />;
  const { property: p, host, reviews } = data;

  // Extract amenities directly from propertiesKeyAmenities
  const keyAmenitiesList = (p.propertiesKeyAmenities || [])
    .map((item) => {
      const a =
        item.amenity ||
        md.amenities.find((m) => String(m.id) === String(item.amenitiesId));
      if (!a) return null;
      return {
        id: a.id || item.amenitiesId,
        name: a.title || a.name,
        title: a.title || a.name,
        icon: a.icon,
        type: a.type || a.group || "Essentials",
        status: a.status,
      };
    })
    .filter(Boolean);

  const amenities =
    keyAmenitiesList.length > 0
      ? keyAmenitiesList
      : md.amenities
          .filter((a) =>
            (p.amenityIds || []).some((id) => String(id) === String(a.id))
          )
          .map((a) => ({
            ...a,
            name: a.name || a.title,
            title: a.title || a.name,
            type: a.type || a.group || "Essentials",
          }));

  // Extract animals directly from propertiesAnimals or p.animals, with md.animals fallback
  const propertyAnimalsList = (p.propertiesAnimals || [])
    .map((item) => {
      const a =
        item.friendlyAnimals ||
        item.friendlyAnimal ||
        item.animal ||
        md.animals.find((m) => String(m.id) === String(item.animalId));
      if (!a) return null;
      return {
        id: a.id || item.animalId,
        name: a.title || a.name,
        title: a.title || a.name,
        image: a.image,
      };
    })
    .filter(Boolean);

  const animals =
    propertyAnimalsList.length > 0
      ? propertyAnimalsList
      : (p.animals && p.animals.length > 0)
      ? p.animals
      : md.animals
          .filter((a) =>
            (p.animalIds || []).some((id) => String(id) === String(a.id))
          )
          .map((a) => ({
            ...a,
            name: a.title || a.name,
            title: a.title || a.name,
          }));
  const policy = md.policies.find((c) => c.id === p.cancellationPolicyId);

  const statusStr = String(p.status || "").toLowerCase();
  const isApproved =
    statusStr === "live" ||
    statusStr === "active" ||
    p.status === "Active" ||
    p.status === "Approved";

  return (
    <>
      <PageHeader
        back={<BackLink to="/properties">Properties</BackLink>}
        title={p.name}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <MapPin className="size-3.5" />
            {p.area}, {p.cityName}
            <span>·</span>
            <Stars value={p.rating} />
            <span>({p.reviewCount} reviews)</span>
          </span>
        }
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Pencil className="size-4" />}
              onClick={() => navigate(`/properties/${p.id}/edit`)}
            >
              Edit
            </Button>
            {!isApproved ? (
              <>
                <Button
                  variant="danger-soft"
                  icon={<XCircle className="size-4" />}
                  onClick={() => setDialog("reject")}
                >
                  Reject
                </Button>
                <Button
                  icon={<CheckCircle2 className="size-4" />}
                  loading={approve.isPending}
                  onClick={() => approve.mutate()}
                >
                  Approve Property
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  icon={<CheckCircle2 className="size-4" />}
                  loading={approve.isPending}
                  onClick={() => approve.mutate()}
                >
                  Approved
                </Button>
                <Button
                  variant="secondary"
                  icon={<EyeOff className="size-4" />}
                  onClick={() => setDialog("unlist")}
                >
                  Unlist
                </Button>
              </>
            )}
          </>
        }
      />

      {/* Property Approval & Verification Status Banner */}
      {!isApproved ? (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-warning/40 bg-warning-soft/70 p-4 text-[#8A5A0E]">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/20 text-[#8A5A0E]">
              <Clock className="size-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-ink">Property Pending Admin Approval</h3>
              <p className="text-xs text-ink-muted mt-0.5">
                This listing is currently <b className="capitalize text-ink">{p.status || "pending"}</b> and not live for guests.
                Review pricing, photos, and holiday home permit before approving.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="danger-soft"
              size="sm"
              icon={<XCircle className="size-4" />}
              onClick={() => setDialog("reject")}
            >
              Reject
            </Button>
            <Button
              size="sm"
              icon={<CheckCircle2 className="size-4" />}
              loading={approve.isPending}
              onClick={() => approve.mutate()}
            >
              Approve & Publish
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 text-xs text-emerald-800">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-4" />
            </span>
            <div>
              <span className="font-bold text-emerald-900 block text-xs">Property Approved & Live</span>
              <span className="text-[11px] text-emerald-700">This property is verified, active, and discoverable for guest bookings.</span>
            </div>
          </div>
          <span className="rounded-full bg-emerald-200/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">
            Live on App
          </span>
        </div>
      )}

      {p.status === "rejected" && p.rejectionReason && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-[13px] text-danger">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <b>Rejected:</b> {p.rejectionReason}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card padded={false} className="overflow-hidden">
            <Photo
              src={p.photos[photo]}
              alt={p.name}
              className="aspect-[16/8] w-full"
            />
            <div className="flex gap-2 overflow-x-auto p-3 scrollbar-thin">
              {p.photos.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setPhoto(i)}
                  className={`shrink-0 overflow-hidden rounded-xl ring-2 transition ${i === photo ? "ring-accent" : "ring-transparent opacity-70 hover:opacity-100"}`}
                >
                  <Photo
                    src={src}
                    alt={`${p.name} ${i + 1}`}
                    className="h-16 w-24"
                  />
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={p.status} />
              <Badge tone="accent">{p.categoryName}</Badge>
              {p.guestFavourite && (
                <Badge tone="warning">🏆 Guest favourite</Badge>
              )}
              {p.featured && <Badge tone="success">Featured</Badge>}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Users, label: "Guests", value: p.maxGuests },
                { icon: BedDouble, label: "Bedrooms", value: p.bedrooms },
                { icon: Bath, label: "Bathrooms", value: p.bathrooms },
                {
                  icon: PawPrint,
                  label: "Pets",
                  value: p.petsAllowed ? "Allowed" : "No",
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="rounded-2xl bg-bg p-3 text-center"
                >
                  <f.icon className="mx-auto size-5 text-accent" />
                  <p className="mt-1.5 text-[15px] font-bold">{f.value}</p>
                  <p className="text-[11px] text-ink-muted">{f.label}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-6 font-display text-lg font-semibold">
              About this retreat
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
              {p.description}
            </p>
          </Card>

          <Card title="What this place offers">
            {amenities.length === 0 && animals.length === 0 ? (
              <p className="text-xs text-ink-muted">No amenities or animals selected.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  amenities.reduce((acc, a) => {
                    const type = a.type || a.group || "Essentials";
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(a);
                    return acc;
                  }, {})
                ).map(([catName, items]) => (
                  <div key={catName} className="rounded-2xl border border-line/60 bg-canvas-soft/30 p-4">
                    <div className="mb-3 flex items-center justify-between border-b border-line/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-ink">
                          {catName}
                        </span>
                        <span className="text-xs text-ink-muted">
                          ({items.length})
                        </span>
                      </div>
                      <Badge tone="accent">{catName}</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                      {items.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-2.5 rounded-xl border border-line/70 bg-surface px-3 py-2.5 text-[13px] font-medium shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-primary">
                              <DynamicIcon name={a.icon} className="size-4" />
                            </span>
                            <span className="font-semibold text-ink truncate">{a.name || a.title}</span>
                          </div>
                          <span className="rounded-md bg-canvas-soft px-1.5 py-0.5 text-[10px] font-medium text-ink-muted shrink-0">
                            {a.type || catName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {animals.length > 0 && (
                  <div className="rounded-2xl border border-line/60 bg-canvas-soft/30 p-4">
                    <div className="mb-3 flex items-center justify-between border-b border-line/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-ink">
                          Farm animals
                        </span>
                        <span className="text-xs text-ink-muted">
                          ({animals.length})
                        </span>
                      </div>
                      <Badge tone="accent">Farm & animals</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                      {animals.map((a) => {
                        const animalName = a.name || a.title || "Animal";
                        const avatar =
                          ANIMAL_AVATARS[animalName] ||
                          (a.image?.startsWith("http")
                            ? a.image
                            : a.image
                            ? `${import.meta.env.VITE_IMAGE_BASE || ""}${a.image.startsWith("/") ? a.image.substring(1) : a.image}`
                            : "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80");

                        return (
                          <div
                            key={a.id}
                            className="flex items-center justify-between gap-2.5 rounded-xl border border-line/70 bg-surface px-3 py-2.5 text-[13px] font-medium shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={avatar}
                                alt={animalName}
                                className="size-8 rounded-full object-cover border border-line shrink-0"
                                onError={(e) => {
                                  if (ANIMAL_AVATARS[animalName] && e.currentTarget.src !== ANIMAL_AVATARS[animalName]) {
                                    e.currentTarget.src = ANIMAL_AVATARS[animalName];
                                  } else {
                                    e.currentTarget.style.display = "none";
                                  }
                                }}
                              />
                              <span className="font-semibold text-ink truncate">
                                {animalName}
                              </span>
                            </div>
                            <span className="rounded-md bg-canvas-soft px-1.5 py-0.5 text-[10px] font-medium text-ink-muted shrink-0">
                              Friendly animal
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card title="House rules">
              <DetailList
                items={[
                  { label: "Check-in", value: `After ${p.houseRules.checkIn}` },
                  {
                    label: "Check-out",
                    value: `Before ${p.houseRules.checkOut}`,
                  },
                  {
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <Cigarette className="size-3.5" />
                        Smoking
                      </span>
                    ),
                    value: p.houseRules.smoking ? "Allowed" : "Not allowed",
                  },
                  {
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <PartyPopper className="size-3.5" />
                        Parties
                      </span>
                    ),
                    value: p.houseRules.parties ? "Allowed" : "Not allowed",
                  },
                  {
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <PawPrint className="size-3.5" />
                        Pets
                      </span>
                    ),
                    value: p.houseRules.pets ? "Allowed" : "Not allowed",
                  },
                ]}
              />
            </Card>
            <Card title="Cancellation policy">
              <p className="font-semibold">{policy?.name ?? "—"}</p>
              <p className="mt-1 text-[13px] text-ink-muted">
                {policy?.description}
              </p>
              <h4 className="mb-1 mt-5 text-[13px] font-bold">Location</h4>
              <p className="text-[13px] text-ink-muted">
                {p.address}, {p.area}, {p.cityName}
              </p>
              <a
                className="mt-1 inline-block text-[13px] font-semibold text-accent hover:text-primary"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
              >
                Open in Google Maps ↗
              </a>
            </Card>
          </div>

          <Card title="Recent bookings" padded={false}>
            <div className="mt-3">
              <BookingsTable rows={data.bookings} hide={["property", "host"]} />
            </div>
          </Card>

          <Card
            title={`Reviews (${reviews.length})`}
            action={
              <Link
                to="/reviews"
                className="text-[13px] font-semibold text-accent hover:text-primary"
              >
                Moderate
              </Link>
            }
          >
            {reviews.length === 0 ? (
              <p className="text-[13px] text-ink-muted">No reviews yet.</p>
            ) : (
              <ul className="space-y-4">
                {reviews.slice(0, 4).map((r) => (
                  <li key={r.id} className="flex gap-3">
                    <Avatar name={r.guestName} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-[13px]">{r.guestName}</b>
                        <Stars value={r.rating} />
                        <span className="text-xs text-ink-muted">
                          {date(r.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-ink-muted">
                        {r.comment}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <p className="text-[13px] text-ink-muted">Price per night</p>
            <p className="text-3xl font-bold tracking-tight">
              {aed(p.pricePerNight)}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-bg p-2.5">
                <p className="font-bold">{p.bookings}</p>
                <p className="text-[11px] text-ink-muted">Bookings</p>
              </div>
              <div className="rounded-xl bg-bg p-2.5">
                <p className="font-bold">{p.views.toLocaleString()}</p>
                <p className="text-[11px] text-ink-muted">Views</p>
              </div>
              <div className="rounded-xl bg-bg p-2.5">
                <p className="font-bold">{p.reviewCount}</p>
                <p className="text-[11px] text-ink-muted">Reviews</p>
              </div>
            </div>
          </Card>

          <Card title="Hosted by">
            <Link
              to={`/hosts/${host.id}`}
              className="flex items-center gap-3 rounded-2xl p-1 transition hover:bg-accent-soft/50"
            >
              <Avatar name={host.name} size={44} />
              <div className="min-w-0">
                <p className="font-semibold">{host.name}</p>
                <p className="text-xs text-ink-muted">
                  Rating {host.rating.toFixed(1)} · {host.responseRate}%
                  response
                </p>
              </div>
            </Link>
          </Card>

          <Card title="Holiday Home Permit">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Permit Number</span>
                <span className="font-mono font-bold text-ink">
                  {p.holidayHomePermitNumber || p.permitNumber || "DET 1234567"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Permit Status</span>
                <Badge
                  tone={
                    p.permitStatus === "Approved" || isApproved
                      ? "success"
                      : p.permitStatus === "Rejected"
                      ? "danger"
                      : "warning"
                  }
                  dot
                >
                  {p.permitStatus || (isApproved ? "Approved" : "Pending")}
                </Badge>
              </div>
              {p.holidayHomePermitDoc && (
                <a
                  href={
                    p.holidayHomePermitDoc.startsWith("http")
                      ? p.holidayHomePermitDoc
                      : `${import.meta.env.VITE_IMAGE_BASE || ""}${p.holidayHomePermitDoc}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-center text-xs font-semibold text-primary hover:underline"
                >
                  View Permit Document ↗
                </a>
              )}
            </div>
          </Card>

          <Card title="Visibility">
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-[13px] font-semibold">
                    Guest favourite
                  </span>
                  <span className="text-xs text-ink-muted">
                    Shows the 🏆 badge in the app
                  </span>
                </span>
                <Toggle
                  checked={p.guestFavourite}
                  disabled={update.isPending}
                  onChange={(v) => update.mutate({ guestFavourite: v })}
                  label="Guest favourite"
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-[13px] font-semibold">
                    Featured
                  </span>
                  <span className="text-xs text-ink-muted">
                    Appears in "Featured Properties" on Explore
                  </span>
                </span>
                <Toggle
                  checked={p.featured}
                  disabled={update.isPending || p.status !== "live"}
                  onChange={(v) => update.mutate({ featured: v })}
                  label="Featured"
                />
              </label>
            </div>
          </Card>

          <Card title="Record">
            <DetailList
              items={[
                { label: "Property ID", value: p.id },
                { label: "Created", value: date(p.createdAt) },
                { label: "Last updated", value: date(p.updatedAt) },
              ]}
            />
            <Button
              variant="danger-soft"
              className="mt-4 w-full"
              icon={<Trash2 className="size-4" />}
              onClick={() => setDialog("delete")}
            >
              Delete property
            </Button>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={dialog === "reject"}
        onClose={() => setDialog(null)}
        title="Reject listing?"
        withReason
        reasonLabel="Reason shown to the host"
        confirmLabel="Reject"
        loading={reject.isPending}
        onConfirm={(r) => reject.mutate(r)}
      />
      <ConfirmDialog
        open={dialog === "unlist"}
        onClose={() => setDialog(null)}
        title="Unlist property?"
        tone="primary"
        message="Guests won't be able to find or book it. Existing bookings are kept."
        confirmLabel="Unlist"
        loading={update.isPending}
        onConfirm={() => update.mutate({ status: "unlisted", featured: false })}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        title="Delete property?"
        message="This can't be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}
