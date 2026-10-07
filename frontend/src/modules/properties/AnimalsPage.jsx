import { PageHeader } from "@/components/ui";
import { EntityTable, activeCol, nameCols, nameFields } from "../master-data/MasterDataPage";

const ENTITY = {
  key: "animals",
  title: "Farm animals",
  singular: "animal",
  fields: [...nameFields, { key: "active", label: "Active", type: "toggle" }],
  columns: [...nameCols(), activeCol],
  defaults: { name: "", nameAr: "", active: true },
};

export function AnimalsPage() {
  return (
    <>
      <PageHeader
        title="Friendly Animals"
        subtitle="Manage the farm animals hosts can tag in their listings."
      />
      <EntityTable entity={ENTITY} />
    </>
  );
}
