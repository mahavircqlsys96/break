import { PageHeader, Badge } from "@/components/ui";
import { EntityTable, activeCol, nameCols, nameFields } from "../master-data/MasterDataPage";
import { label as titleCase } from "@/lib/format";

const ENTITY = {
  key: "amenities",
  title: "Amenities",
  singular: "amenity",
  fields: [
    ...nameFields,
    { key: "icon", label: "Icon", type: "icon" },
    { key: "active", label: "Active", type: "toggle" },
  ],
  columns: [
    ...nameCols(true),
    activeCol,
  ],
  defaults: {
    name: "",
    nameAr: "",
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
