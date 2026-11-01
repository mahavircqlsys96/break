import { PageHeader, Badge } from "@/components/ui";
import {
  EntityTable,
  activeCol,
  nameCols,
  nameFields,
  AMENITY_TYPES,
} from "../master-data/MasterDataPage";
import { label as titleCase } from "@/lib/format";

const ENTITY = {
  key: "amenities",
  title: "Amenities",
  singular: "amenity",
  filterKey: "type",
  filterOptions: AMENITY_TYPES,
  fields: [
    ...nameFields,
    {
      key: "type",
      label: "Amenity Type",
      type: "select",
      options: AMENITY_TYPES,
    },
    { key: "icon", label: "Icon", type: "icon" },
    { key: "active", label: "Active", type: "toggle" },
  ],
  columns: [
    ...nameCols(true),
    {
      key: "type",
      header: "Amenity Type",
      render: (r) => (
        <Badge tone="accent">{r.type || r.group || "Essentials"}</Badge>
      ),
    },
    activeCol,
  ],
  defaults: {
    name: "",
    nameAr: "",
    type: "Essentials",
    icon: "Sparkles",
    active: true,
  },
};

export function AmenitiesPage() {
  return (
    <>
      <PageHeader
        title="Property Amenities"
        subtitle="Manage the amenities that hosts can select for their properties."
      />
      <EntityTable entity={ENTITY} />
    </>
  );
}
