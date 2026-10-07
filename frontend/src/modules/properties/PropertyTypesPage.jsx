import { PageHeader } from "@/components/ui";
import { EntityTable, activeCol, nameCols, nameFields } from "../master-data/MasterDataPage";

const ENTITY = {
  key: "propertyTypes",
  title: "Property Types",
  singular: "property type",
  fields: [
    ...nameFields,
    { key: "icon", label: "Icon", type: "icon" },
    { key: "order", label: "Display order", type: "number" },
    { key: "active", label: "Active", type: "toggle" },
  ],
  columns: [
    ...nameCols(true),
    { key: "order", header: "Order", render: (r) => String(r.order) },
    activeCol,
  ],
  defaults: { name: "", icon: "Home", order: 5, active: true },
};

export function PropertyTypesPage() {
  return (
    <>
      <PageHeader
        title="Property Types"
        subtitle="Manage the types of properties available on the platform."
      />
      <EntityTable entity={ENTITY} />
    </>
  );
}
