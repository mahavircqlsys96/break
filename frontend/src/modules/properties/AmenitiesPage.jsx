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
    {
      key: "group",
      label: "Group",
      type: "select",
      options: ["essentials", "features", "safety", "outdoor"],
    },
    { key: "active", label: "Active", type: "toggle" },
  ],
  columns: [
    ...nameCols(true),
    {
      key: "group",
      header: "Group",
      render: (r) => (
        <Badge tone="accent">{titleCase(String(r.group))}</Badge>
      ),
    },
    activeCol,
  ],
  defaults: {
    name: "",
    nameAr: "",
    icon: "Sparkles",
    group: "essentials",
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
