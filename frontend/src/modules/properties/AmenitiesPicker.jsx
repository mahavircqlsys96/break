import { useState, useMemo } from "react";
import {
  Search,
  X,
  Check,
  ChevronRight,
  ArrowLeft,
  Plus,
  Sparkles,
} from "lucide-react";
import { DynamicIcon } from "@/components/DynamicIcon";
import { Modal, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { AMENITY_TYPES } from "../master-data/MasterDataPage";

// Fallback icon mapping for common amenity titles
const ICON_MAP = {
  "wifi": "Wifi",
  "air conditioning": "Snowflake",
  "kitchen": "CookingPot",
  "washer": "WashingMachine",
  "tv": "Tv",
  "smart tv": "Tv",
  "iron": "Sparkles",
  "dedicated workspace": "Home",
  "heating": "Flame",
  "private bathroom": "Bath",
  "free parking": "Car",
  "parking": "Car",
  "smoking allowed": "Flame",
  "pets allowed": "Baby",
  "swimming pool": "Waves",
  "private pool": "Waves",
  "shared pool": "Waves",
  "heated pool": "Waves",
  "gym": "Dumbbell",
  "beach access": "Palmtree",
  "garden": "Trees",
  "patio": "Home",
  "balcony": "Home",
  "bbq grill": "Flame",
  "bbq & fire pit": "Flame",
  "fire pit": "Flame",
  "hot tub": "Bath",
  "sauna": "Flame",
  "steam room": "Waves",
  "microwave": "CookingPot",
  "coffee maker": "Coffee",
  "dishwasher": "WashingMachine",
  "refrigerator": "CookingPot",
  "cooking basics": "Utensils",
  "dishes and silverware": "Utensils",
  "outdoor kitchen": "Utensils",
  "bathtub": "Bath",
  "hair dryer": "Sparkles",
  "shampoo": "Bath",
  "hot water": "Flame",
  "bed linens": "Home",
  "sound system": "Music",
  "books": "BookOpen",
  "game console": "Gamepad2",
  "pool table": "Sparkles",
  "ping pong table": "Sparkles",
  "piano": "Music",
  "outdoor dining": "Utensils",
  "desert view": "Sun",
  "mountain view": "Sun",
  "farm animals": "Tractor",
  "horse riding": "Tractor",
  "stargazing area": "Sparkles",
  "campfire area": "Flame",
  "desert camp": "Tent",
  "tennis court": "Sparkles",
  "basketball court": "Sparkles",
  "football pitch": "Sparkles",
  "volleyball court": "Sparkles",
  "yoga deck": "Sun",
  "crib": "Baby",
  "high chair": "Baby",
  "baby safety gates": "ShieldCheck",
  "children books and toys": "Baby",
  "board games": "Gamepad2",
  "kids playground": "Baby",
  "smoke alarm": "ShieldAlert",
  "carbon monoxide detector": "ShieldAlert",
  "fire extinguisher": "Flame",
  "first aid kit": "Cross",
  "security cameras": "Cctv",
  "ev charger": "Zap",
  "wheelchair accessible": "Home",
  "elevator": "Home",
  "single level home": "Home",
  "luggage dropoff allowed": "Luggage",
  "long term stays allowed": "CalendarCheck",
  "cleaning available": "Sparkles",
  "host greeting": "HeartHandshake",
};

// Animal pictures & fallbacks for Farm Animals modal
export const ANIMAL_AVATARS = {
  "Horses": "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80",
  "Goats": "https://images.unsplash.com/photo-1524024973431-2ad916746881?w=150&auto=format&fit=crop&q=80",
  "Rabbits": "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=150&auto=format&fit=crop&q=80",
  "Chickens": "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=150&auto=format&fit=crop&q=80",
  "Camels": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=150&auto=format&fit=crop&q=80",
  "Sheep": "https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=150&auto=format&fit=crop&q=80",
  "Ducks": "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=150&auto=format&fit=crop&q=80",
  "Pygmy Goats": "https://images.unsplash.com/photo-1524024973431-2ad916746881?w=150&auto=format&fit=crop&q=80",
  "Dogs": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80",
  "Cats": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&auto=format&fit=crop&q=80",
  "Birds": "https://images.unsplash.com/photo-1452570053593-1b910e787d60?w=150&auto=format&fit=crop&q=80",
};

export function AmenitiesPicker({
  selectedAmenityIds = [],
  onChangeAmenities,
  selectedAnimalIds = [],
  onChangeAnimals,
  amenities = [],
  animals = [],
  propertyName = "Sunset Farm",
}) {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [animalsModalOpen, setAnimalsModalOpen] = useState(false);

  // Normalise amenity IDs to numbers/strings matching incoming format
  const isSelected = (id) =>
    selectedAmenityIds.some((x) => String(x) === String(id));

  const toggleAmenity = (id) => {
    if (isSelected(id)) {
      onChangeAmenities(
        selectedAmenityIds.filter((x) => String(x) !== String(id))
      );
    } else {
      onChangeAmenities([...selectedAmenityIds, id]);
    }
  };

  const isAnimalSelected = (id) =>
    selectedAnimalIds.some((x) => String(x) === String(id));

  const toggleAnimal = (id) => {
    if (isAnimalSelected(id)) {
      onChangeAnimals(
        selectedAnimalIds.filter((x) => String(x) !== String(id))
      );
    } else {
      onChangeAnimals([...selectedAnimalIds, id]);
    }
  };

  // Group active amenities by type
  const groupedAmenities = useMemo(() => {
    const map = {};
    AMENITY_TYPES.forEach((t) => {
      map[t] = [];
    });

    const activeList = amenities.filter((a) => a.active !== false);

    activeList.forEach((a) => {
      const type = a.type || a.group || "Essentials";
      // Match type case-insensitively to standard categories
      const standardType =
        AMENITY_TYPES.find(
          (t) => t.toLowerCase() === String(type).toLowerCase()
        ) || "Essentials";

      if (!map[standardType]) map[standardType] = [];
      map[standardType].push(a);
    });

    return map;
  }, [amenities]);

  // Filtered categories based on search query and active tab
  const visibleCategories = useMemo(() => {
    let cats = AMENITY_TYPES;
    if (activeTab !== "All") {
      cats = [activeTab];
    }

    const query = search.trim().toLowerCase();

    return cats
      .map((catName) => {
        const items = groupedAmenities[catName] || [];
        const filteredItems = query
          ? items.filter((a) =>
              String(a.name || a.title || "").toLowerCase().includes(query)
            )
          : items;

        return {
          name: catName,
          items: filteredItems,
          totalCount: items.length,
          selectedCount: items.filter((a) => isSelected(a.id)).length,
        };
      })
      .filter((cat) => {
        if (cat.items.length > 0) return true;
        if (cat.name === "Farm & desert") {
          if (!query) return true;
          return (
            "farm".includes(query) ||
            "desert".includes(query) ||
            "animal".includes(query) ||
            animals.some((an) =>
              String(an.name || an.title || "").toLowerCase().includes(query)
            )
          );
        }
        return false;
      });
  }, [activeTab, search, groupedAmenities, selectedAmenityIds, animals]);

  // Count total selected
  const totalSelected = selectedAmenityIds.length;

  const selectAllInCat = (items) => {
    const toAdd = items.map((a) => a.id).filter((id) => !isSelected(id));
    onChangeAmenities([...selectedAmenityIds, ...toAdd]);
  };

  const clearCat = (items) => {
    const removeSet = new Set(items.map((a) => String(a.id)));
    onChangeAmenities(
      selectedAmenityIds.filter((id) => !removeSet.has(String(id)))
    );
  };

  const getIconName = (amenity) => {
    if (amenity.icon && amenity.icon !== "Sparkles") return amenity.icon;
    const titleKey = String(amenity.name || amenity.title || "").toLowerCase();
    return ICON_MAP[titleKey] || "Sparkles";
  };

  return (
    <div className="space-y-5 rounded-2xl border border-line/70 bg-surface p-4 shadow-sm sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold text-ink">Amenities</h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {totalSelected} selected
            </span>
          </div>
          <p className="text-xs text-ink-muted">
            {propertyName} — Choose all amenities that apply to this listing
          </p>
        </div>
        {totalSelected > 0 && (
          <button
            type="button"
            onClick={() => onChangeAmenities([])}
            className="text-xs font-medium text-ink-muted hover:text-danger self-start sm:self-center transition"
          >
            Clear all selected
          </button>
        )}
      </div>

      {/* Search amenities */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search amenities (e.g. WiFi, Pool, BBQ, Kitchen)..."
          className="w-full rounded-2xl border border-line bg-canvas-soft/40 py-2.5 pl-10 pr-9 text-[13px] text-ink placeholder:text-ink-muted/70 transition focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills (matching Image 3 top filter row) */}
      <div className="no-scrollbar -mx-2 flex gap-1.5 overflow-x-auto px-2 pb-1 pt-0.5">
        <button
          type="button"
          onClick={() => setActiveTab("All")}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
            activeTab === "All"
              ? "bg-[#6C5CE7] text-white shadow-sm"
              : "border border-line/80 bg-surface text-ink-muted hover:border-primary/50 hover:text-ink"
          )}
        >
          All
        </button>
        {AMENITY_TYPES.map((cat) => {
          const items = groupedAmenities[cat] || [];
          const count = items.filter((a) => isSelected(a.id)).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveTab(cat)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition flex items-center gap-1.5",
                activeTab === cat
                  ? "bg-[#6C5CE7] text-white shadow-sm"
                  : "border border-line/80 bg-surface text-ink-muted hover:border-primary/50 hover:text-ink"
              )}
            >
              <span>{cat}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full text-[10px] font-bold",
                    activeTab === cat
                      ? "bg-white text-[#6C5CE7]"
                      : "bg-[#6C5CE7] text-white"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Categorized Sections matching Image 3 design */}
      <div className="space-y-6 pt-2">
        {visibleCategories.map((cat) => (
          <div key={cat.name} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center justify-between border-b border-line/40 pb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-display text-sm font-bold text-ink">
                  {cat.name}
                </h4>
                <span className="text-xs text-ink-muted">
                  {cat.selectedCount} / {cat.items.length}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {cat.selectedCount < cat.items.length && cat.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => selectAllInCat(cat.items)}
                    className="font-medium text-primary hover:underline"
                  >
                    Select all
                  </button>
                )}
                {cat.selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => clearCat(cat.items)}
                    className="font-medium text-ink-muted hover:text-danger"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Grid of Amenity Cards (matching Image 3 card layout) */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
              {cat.items.map((amenity) => {
                const selected = isSelected(amenity.id);
                const iconName = getIconName(amenity);

                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-150",
                      selected
                        ? "border-[#6C5CE7] bg-[#6C5CE7]/10 text-ink shadow-sm ring-1 ring-[#6C5CE7]"
                        : "border-line/70 bg-surface text-ink hover:border-primary/40 hover:bg-canvas-soft/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl transition",
                        selected
                          ? "bg-[#6C5CE7] text-white"
                          : "bg-canvas-soft text-ink-muted group-hover:text-primary"
                      )}
                    >
                      <DynamicIcon name={iconName} className="size-4" />
                    </div>
                    <span className="text-[13px] font-semibold leading-tight line-clamp-2">
                      {amenity.name || amenity.title}
                    </span>
                    {selected && (
                      <div className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full bg-[#6C5CE7] text-white">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Special "Farm animals" card inside Farm & desert category (Image 3) */}
              {cat.name === "Farm & desert" && (
                <button
                  type="button"
                  onClick={() => setAnimalsModalOpen(true)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-150",
                    selectedAnimalIds.length > 0
                      ? "border-[#6C5CE7] bg-[#6C5CE7]/15 ring-1 ring-[#6C5CE7]"
                      : "border-dashed border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl transition",
                      selectedAnimalIds.length > 0
                        ? "bg-[#6C5CE7] text-white"
                        : "bg-primary/20 text-primary"
                    )}
                  >
                    <DynamicIcon name="Tractor" className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold leading-tight text-ink">
                      Farm animals
                    </p>
                    <p className="text-[11px] font-medium text-primary">
                      {selectedAnimalIds.length > 0
                        ? `${selectedAnimalIds.length} animals selected`
                        : "Select animals"}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {visibleCategories.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-ink">No amenities found</p>
            <p className="mt-1 text-xs text-ink-muted">
              Try a different search term or select another category tab.
            </p>
            <Button
              variant="secondary"
              className="mt-3 text-xs"
              onClick={() => {
                setSearch("");
                setActiveTab("All");
              }}
            >
              Reset filters
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Sticky-like bar (matching Image 3 bottom bar) */}
      <div className="flex items-center justify-between rounded-2xl border border-line/70 bg-canvas-soft/60 px-4 py-3">
        <div>
          <p className="text-[13px] font-bold text-ink">
            {totalSelected} selected
          </p>
          <p className="text-xs text-ink-muted">Shown on your listing</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedAnimalIds.length > 0 && (
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-primary">
              {selectedAnimalIds.length} animals
            </span>
          )}
          <span className="rounded-full bg-[#6C5CE7] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
            Saved on listing
          </span>
        </div>
      </div>

      {/* Farm Animals Modal (Image 2) */}
      <Modal
        open={animalsModalOpen}
        onClose={() => setAnimalsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnimalsModalOpen(false)}
              className="rounded-full p-1 text-ink-muted hover:bg-canvas-soft hover:text-ink"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <p className="font-display text-base font-bold text-ink">
                Farm animals
              </p>
              <p className="text-xs text-ink-muted">{propertyName}</p>
            </div>
          </div>
        }
        footer={
          <div className="flex w-full items-center justify-between">
            <div>
              <p className="text-xs font-bold text-ink">
                {selectedAnimalIds.length} animals
              </p>
              <p className="text-[11px] text-ink-muted">
                Shown on your listing
              </p>
            </div>
            <Button
              onClick={() => setAnimalsModalOpen(false)}
              className="bg-[#6C5CE7] hover:bg-[#5b4cc4] text-white font-bold px-6"
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-muted">
            Select the animals that live on your property.
          </p>

          <div className="flex items-center justify-between border-b border-line/40 pb-2">
            <span className="font-display text-sm font-bold text-ink">
              Animals
            </span>
            <span className="text-xs text-ink-muted">
              {selectedAnimalIds.length} selected
            </span>
          </div>

          {/* Animals List (Image 2) */}
          <div className="divide-y divide-line/60 rounded-2xl border border-line/70 bg-surface overflow-hidden">
            {animals
              .filter((an) => an.active !== false)
              .map((animal) => {
                const selected = isAnimalSelected(animal.id);
                const avatar =
                  ANIMAL_AVATARS[animal.name || animal.title] ||
                  (animal.image?.startsWith("http")
                    ? animal.image
                    : animal.image
                      ? import.meta.env.VITE_IMAGE_BASE +
                        (animal.image.startsWith("/")
                          ? animal.image.substring(1)
                          : animal.image)
                      : "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80");

                return (
                  <div
                    key={animal.id}
                    onClick={() => toggleAnimal(animal.id)}
                    className="flex cursor-pointer items-center justify-between p-3.5 transition hover:bg-canvas-soft/40"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={avatar}
                        alt={animal.name || animal.title}
                        className="size-12 rounded-full object-cover border border-line"
                      />
                      <div>
                        <p className="text-[14px] font-bold text-ink">
                          {animal.name || animal.title}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            selected
                              ? "font-semibold text-primary"
                              : "text-ink-muted"
                          )}
                        >
                          {selected ? "Selected" : "Not selected"}
                        </p>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "flex size-5 items-center justify-center rounded-md border transition",
                        selected
                          ? "border-[#6C5CE7] bg-[#6C5CE7] text-white"
                          : "border-line bg-surface"
                      )}
                    >
                      {selected && <Check className="size-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="rounded-2xl border border-dashed border-primary/40 bg-accent-soft/30 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-surface border border-line text-primary">
                <Plus className="size-4" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-ink">
                  Need another animal?
                </p>
                <p className="text-[11px] text-ink-muted">
                  Camels, sheep, ducks, horses and more can be managed in Master Data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
