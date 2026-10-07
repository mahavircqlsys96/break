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
  const amenities = md.amenities.filter((a) => p.amenityIds.includes(a.id));
  const animals = md.animals.filter((a) => p.animalIds.includes(a.id));
  const policy = md.policies.find((c) => c.id === p.cancellationPolicyId);

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
            {p.status === "pending" && (
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
                  Approve & publish
                </Button>
              </>
            )}
            {p.status === "live" && (
              <Button
                variant="secondary"
                icon={<EyeOff className="size-4" />}
                onClick={() => setDialog("unlist")}
              >
                Unlist
              </Button>
            )}
            {(p.status === "unlisted" ||
              p.status === "rejected" ||
              p.status === "draft") && (
              <Button
                icon={<Eye className="size-4" />}
                loading={approve.isPending}
                onClick={() => approve.mutate()}
              >
                Publish
              </Button>
            )}
          </>
        }
      />

      {p.status === "rejected" && p.rejectionReason && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-[13px] text-danger">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <b>Rejected:</b> {p.rejectionReason}
          </div>
        </div>
      )}
      {p.status === "pending" && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-[13px] text-[#8A5A0E]">
          <Clock className="mt-0.5 size-4 shrink-0" />
          <div>
            Submitted by the host {ago(p.updatedAt)}. Check photos, location and
            pricing before publishing.
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
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {amenities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2.5 rounded-xl border border-line/70 px-3 py-2.5 text-[13px] font-medium"
                >
                  <DynamicIcon name={a.icon} className="size-4 text-accent" />
                  {a.name}
                </div>
              ))}
            </div>
            {animals.length > 0 && (
              <>
                <h4 className="mb-2 mt-5 text-[13px] font-bold">
                  Farm animals
                </h4>
                <div className="flex flex-wrap gap-2">
                  {animals.map((a) => (
                    <Badge key={a.id} tone="accent">
                      {a.name}
                    </Badge>
                  ))}
                </div>
              </>
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
