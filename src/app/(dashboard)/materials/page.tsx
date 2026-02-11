import { getMaterials } from "@/lib/data";
import { MaterialsClient } from "@/components/materials/MaterialsClient";

export default async function MaterialsPage() {
  const materials = await getMaterials();

  return <MaterialsClient initialMaterials={materials} />;
}
