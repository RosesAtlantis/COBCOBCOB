import { ContratosPageClient } from "@/components/contratos/contratos-page-client";
import { getContratosPageData } from "@/services/contratos-service";

export default async function ContratosPage() {
  const data = await getContratosPageData();

  return <ContratosPageClient initialData={data} />;
}
