import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  Chip,
  DetailList,
  Field,
  Input,
  PageHeader,
  PageLoader,
  Photo,
  Select,
  Stepper,
  Textarea,
  Toggle,
  useToast,
} from "@/components/ui";
import { DynamicIcon } from "@/components/DynamicIcon";
import { cn } from "@/lib/cn";
import { hostService, propertyService } from "@/services";
import { aed } from "@/lib/format";
import { BackLink } from "../BackLink";
import { useMasterData } from "../master-data/useMasterData";

const STEPS = [
  "Basic info",
  "Location",
  "Details & pricing",
  "Photos",
  "Review",
];

const EMPTY = {
  name: "",
  categoryId: "",
  cityId: "",
  area: "",
  address: "",
  lat: 24.4539,
  lng: 54.3773,
  hostId: "",
  status: "pending",
  description: "",
  pricePerNight: 0,
  bedrooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  petsAllowed: false,
  amenityIds: [],
  animalIds: [],
  photos: [],
  houseRules: {
    checkIn: "15:00",
    checkOut: "11:00",
    smoking: false,
    parties: false,
    pets: false,
  },
  cancellationPolicyId: "",
  guestFavourite: false,
  featured: false,
};

function Counter({ label, hint, value, onChange, min = 0 }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line/70 px-4 py-3">
      <div>
        <p className="text-[13px] font-semibold">{label}</p>
        {hint && <p className="text-xs text-ink-muted">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="flex size-8 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-accent hover:text-primary disabled:opacity-40"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-6 text-center font-bold">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          className="flex size-8 items-center justify-center rounded-full bg-accent text-white transition hover:bg-primary"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p>
      )}
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

export function PropertyFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const md = useMasterData();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [photoUrl, setPhotoUrl] = useState("");
  const [errors, setErrors] = useState({});

  const existing = useQuery({
    queryKey: ["properties", id],
    queryFn: () => propertyService.get(id),
    enabled: editing,
  });
  const hosts = useQuery({
    queryKey: ["hosts", "all-active"],
    queryFn: () =>
      hostService.list({ pageSize: 200, filters: { status: "active" } }),
  });

  useEffect(() => {
    if (existing.data) {
      const {
        categoryName: _c,
        cityName: _ci,
        hostName: _h,
        id: _id,
        rating: _r,
        reviewCount: _rc,
        bookings: _b,
        views: _v,
        createdAt: _ca,
        updatedAt: _u,
        ...rest
      } = existing.data.property;
      setForm(rest);
    }
  }, [existing.data]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggleIn = (key, v) =>
    set(
      key,
      form[key].includes(v)
        ? form[key].filter((x) => x !== v)
        : [...form[key], v],
    );

  const save = useMutation({
    mutationFn: (status) =>
      editing
        ? propertyService.update(id, { ...form, status })
        : propertyService.create({ ...form, status }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast(
        editing
          ? "Property updated"
          : p.status === "live"
            ? "Your property is live!"
            : "Property saved",
      );
      navigate(`/properties/${p.id}`);
    },
  });

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = "Property name is required";
      if (!form.hostId) e.hostId = "Choose the host who owns this property";
      if (!form.categoryId) e.categoryId = "Select a property type";
      if (form.description.trim().length < 20)
        e.description = "Write at least 20 characters";
    }
    if (s === 1) {
      if (!form.cityId) e.cityId = "Select a city";
      if (!form.area.trim()) e.area = "Area is required";
    }
    if (s === 2) {
      if (form.pricePerNight <= 0) e.pricePerNight = "Set a nightly price";
      if (!form.cancellationPolicyId)
        e.cancellationPolicyId = "Select a cancellation policy";
    }
    if (s === 3 && form.photos.length < 1) e.photos = "Add at least one photo";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const next = () => {
    if (validate(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  if ((editing && existing.isLoading) || !md.ready) return <PageLoader />;

  const category = md.categories.find((c) => c.id === form.categoryId);
  const city = md.cities.find((c) => c.id === form.cityId);
  const host = hosts.data?.items.find((h) => h.id === form.hostId);

  return (
    <>
      <PageHeader
        back={
          <BackLink to={editing ? `/properties/${id}` : "/properties"}>
            {editing ? "Property" : "Properties"}
          </BackLink>
        }
        title={editing ? "Edit property" : "Add property"}
        subtitle="List your place and start hosting."
      />

      <div className="mx-auto max-w-3xl">
        <Card className="mb-4">
          <Stepper steps={STEPS} current={step} onStep={setStep} />
        </Card>

        <Card>
          {step === 0 && (
            <Section
              title="Basic information"
              subtitle="Tell us about the property."
            >
              <Field label="Property name" error={errors.name}>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="The Azure Waterfront Estate"
                />
              </Field>
              <Field label="Host" error={errors.hostId}>
                <Select
                  value={form.hostId}
                  onChange={(e) => set("hostId", e.target.value)}
                  options={[
                    { value: "", label: "Select host…" },
                    ...(hosts.data?.items ?? []).map((h) => ({
                      value: h.id,
                      label: `${h.name} — ${h.email}`,
                    })),
                  ]}
                />
              </Field>
              <Field label="Property type" error={errors.categoryId}>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {md.categories
                    .filter((c) => c.active)
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => set("categoryId", c.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-[13px] font-semibold transition",
                          form.categoryId === c.id
                            ? "border-accent bg-accent-soft text-primary"
                            : "border-line hover:border-accent/60",
                        )}
                      >
                        <DynamicIcon name={c.icon} className="size-6" />
                        {c.name}
                      </button>
                    ))}
                </div>
              </Field>
              <Field
                label="Property description"
                error={errors.description}
                hint={`${form.description.length}/1000`}
              >
                <Textarea
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Highlight unique features, views, and nearby attractions…"
                />
              </Field>
            </Section>
          )}

          {step === 1 && (
            <Section
              title="Location"
              subtitle="Pin your property's exact location on the map."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="City" error={errors.cityId}>
                  <Select
                    value={form.cityId}
                    onChange={(e) => set("cityId", e.target.value)}
                    options={[
                      { value: "", label: "Select city…" },
                      ...md.cities
                        .filter((c) => c.active)
                        .map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />
                </Field>
                <Field label="Area" error={errors.area}>
                  <Input
                    value={form.area}
                    onChange={(e) => set("area", e.target.value)}
                    placeholder="Al Wathba"
                  />
                </Field>
              </div>
              <Field label="Street address">
                <Input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="12 Farm Road"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude">
                  <Input
                    type="number"
                    step="0.0001"
                    value={form.lat}
                    onChange={(e) => set("lat", Number(e.target.value))}
                  />
                </Field>
                <Field label="Longitude">
                  <Input
                    type="number"
                    step="0.0001"
                    value={form.lng}
                    onChange={(e) => set("lng", Number(e.target.value))}
                  />
                </Field>
              </div>
              <iframe
                title="Map preview"
                className="h-64 w-full rounded-2xl border border-line"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.lng - 0.02},${form.lat - 0.012},${form.lng + 0.02},${form.lat + 0.012}&layer=mapnik&marker=${form.lat},${form.lng}`}
              />
              <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-xs text-primary">
                The exact location is only shared with guests after their
                booking is confirmed.
              </p>
            </Section>
          )}

          {step === 2 && (
            <Section
              title="Features & pricing"
              subtitle="Set the essentials for your listing."
            >
              <Field
                label="Price per night (AED)"
                error={errors.pricePerNight}
                hint="Tip: set a competitive price to attract more guests."
              >
                <Input
                  type="number"
                  min={0}
                  value={form.pricePerNight || ""}
                  onChange={(e) => set("pricePerNight", Number(e.target.value))}
                  leading={<span className="text-xs font-bold">AED</span>}
                />
              </Field>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <Counter
                  label="Bedrooms"
                  value={form.bedrooms}
                  min={1}
                  onChange={(n) => set("bedrooms", n)}
                />
                <Counter
                  label="Bathrooms"
                  value={form.bathrooms}
                  min={1}
                  onChange={(n) => set("bathrooms", n)}
                />
                <Counter
                  label="Max guests"
                  value={form.maxGuests}
                  min={1}
                  onChange={(n) => set("maxGuests", n)}
                />
              </div>
              <Field label="Key amenities">
                <div className="flex flex-wrap gap-2">
                  {md.amenities
                    .filter((a) => a.active)
                    .map((a) => (
                      <Chip
                        key={a.id}
                        selected={form.amenityIds.includes(a.id)}
                        onClick={() => toggleIn("amenityIds", a.id)}
                        icon={<DynamicIcon name={a.icon} className="size-4" />}
                      >
                        {a.name}
                      </Chip>
                    ))}
                </div>
              </Field>
              {form.categoryId === "cat_farm" && (
                <Field label="Farm animals">
                  <div className="flex flex-wrap gap-2">
                    {md.animals
                      .filter((a) => a.active)
                      .map((a) => (
                        <Chip
                          key={a.id}
                          selected={form.animalIds.includes(a.id)}
                          onClick={() => toggleIn("animalIds", a.id)}
                        >
                          {a.name}
                        </Chip>
                      ))}
                  </div>
                </Field>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Check-in after">
                  <Input
                    type="time"
                    value={form.houseRules.checkIn}
                    onChange={(e) =>
                      set("houseRules", {
                        ...form.houseRules,
                        checkIn: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Check-out before">
                  <Input
                    type="time"
                    value={form.houseRules.checkOut}
                    onChange={(e) =>
                      set("houseRules", {
                        ...form.houseRules,
                        checkOut: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
              <div className="divide-y divide-line/60 rounded-2xl border border-line/70 px-4">
                {[
                  ["petsAllowed", "Pets allowed"],
                  ["smoking", "Smoking allowed"],
                  ["parties", "Parties & events allowed"],
                ].map(([key, text]) => {
                  const checked =
                    key === "petsAllowed"
                      ? form.petsAllowed
                      : form.houseRules[key];
                  return (
                    <label
                      key={key}
                      className="flex items-center justify-between py-3 text-[13px] font-semibold"
                    >
                      {text}
                      <Toggle
                        label={text}
                        checked={checked}
                        onChange={(v) =>
                          key === "petsAllowed"
                            ? setForm((f) => ({
                                ...f,
                                petsAllowed: v,
                                houseRules: { ...f.houseRules, pets: v },
                              }))
                            : set("houseRules", {
                                ...form.houseRules,
                                [key]: v,
                              })
                        }
                      />
                    </label>
                  );
                })}
              </div>
              <Field
                label="Cancellation policy"
                error={errors.cancellationPolicyId}
              >
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {md.policies
                    .filter((c) => c.active)
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => set("cancellationPolicyId", c.id)}
                        className={cn(
                          "rounded-2xl border p-3.5 text-start transition",
                          form.cancellationPolicyId === c.id
                            ? "border-accent bg-accent-soft"
                            : "border-line hover:border-accent/60",
                        )}
                      >
                        <p className="text-[13px] font-bold">{c.name}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {c.description}
                        </p>
                      </button>
                    ))}
                </div>
              </Field>
            </Section>
          )}

          {step === 3 && (
            <Section
              title="Photos"
              subtitle="Add high-quality photos to showcase your property."
            >
              <div className="rounded-2xl border-2 border-dashed border-line bg-bg/60 p-5 text-center">
                <span className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-accent-soft text-primary">
                  <ImagePlus className="size-5" />
                </span>
                <p className="text-[13px] font-semibold">Add photo by URL</p>
                <p className="text-xs text-ink-muted">
                  File uploads plug in once the media API is connected.
                </p>
                <div className="mx-auto mt-3 flex max-w-md gap-2">
                  <Input
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://…"
                  />
                  <Button
                    type="button"
                    variant="soft"
                    disabled={!/^https?:\/\//.test(photoUrl)}
                    onClick={() => {
                      set("photos", [...form.photos, photoUrl]);
                      setPhotoUrl("");
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
              {errors.photos && (
                <p className="text-xs text-danger">{errors.photos}</p>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {form.photos.map((src, i) => (
                  <div
                    key={src + i}
                    className="group relative overflow-hidden rounded-2xl"
                  >
                    <Photo
                      src={src}
                      alt={`Photo ${i + 1}`}
                      className="aspect-[4/3] w-full"
                    />
                    {i === 0 && (
                      <span className="absolute start-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() =>
                        set(
                          "photos",
                          form.photos.filter((_, j) => j !== i),
                        )
                      }
                      className="absolute end-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-danger opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {step === 4 && (
            <Section
              title="Review your listing"
              subtitle="Everything looks good? Let's go live."
            >
              <div className="overflow-hidden rounded-2xl border border-line/70">
                <Photo
                  src={form.photos[0]}
                  alt={form.name}
                  className="aspect-[16/7] w-full"
                />
                <div className="p-4">
                  <p className="font-display text-lg font-semibold">
                    {form.name}
                  </p>
                  <p className="text-[13px] text-ink-muted">
                    {category?.name} · {form.area}, {city?.name}
                  </p>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    {form.bedrooms} beds · {form.bathrooms} baths ·{" "}
                    {form.maxGuests} guests
                  </p>
                </div>
              </div>
              <DetailList
                items={[
                  { label: "Host", value: host?.name ?? "—" },
                  { label: "Price / night", value: aed(form.pricePerNight) },
                  {
                    label: "Amenities",
                    value:
                      md.amenities
                        .filter((a) => form.amenityIds.includes(a.id))
                        .map((a) => a.name)
                        .join(", ") || "—",
                  },
                  {
                    label: "Cancellation",
                    value:
                      md.policies.find(
                        (c) => c.id === form.cancellationPolicyId,
                      )?.name ?? "—",
                  },
                  { label: "Photos", value: `${form.photos.length} photos` },
                ]}
              />
              <div className="flex items-start gap-3 rounded-2xl bg-success-soft px-4 py-3 text-[13px] text-success">
                <Sparkles className="mt-0.5 size-4 shrink-0" />
                <div>
                  <b>Looks great!</b> Publishing makes the listing visible to
                  guests immediately.
                </div>
              </div>
            </Section>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-5">
            <Button
              variant="secondary"
              onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
            >
              {step === 0 ? "Cancel" : "Back"}
            </Button>
            <div className="flex gap-2">
              {step === STEPS.length - 1 ? (
                <>
                  <Button
                    variant="secondary"
                    loading={save.isPending && save.variables === "draft"}
                    onClick={() => save.mutate("draft")}
                  >
                    Save as draft
                  </Button>
                  <Button
                    loading={save.isPending && save.variables === "live"}
                    onClick={() => save.mutate("live")}
                  >
                    {editing ? "Save & publish" : "Publish listing"}
                  </Button>
                </>
              ) : (
                <Button onClick={next}>Next</Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
