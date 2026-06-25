import { notFound, redirect } from "next/navigation";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ensureRole } from "@/lib/auth";
import { getAdminSectionData } from "@/services/portal-service";
import type { AdminSectionKey } from "@/types/portal";

const validSections = new Set<AdminSectionKey>([
  "usuarios",
  "operadores",
  "equipes",
  "carteiras",
  "credores",
  "metas",
  "importacoes",
  "configuracoes",
]);

interface AdminSectionPageProps {
  params: Promise<{ section: string }>;
}

export default async function AdminSectionPage({
  params,
}: AdminSectionPageProps) {
  const { section } = await params;

  if (!validSections.has(section as AdminSectionKey)) {
    notFound();
  }

  if (section === "credores") {
    redirect("/credores");
  }

  if (section === "usuarios") {
    redirect("/admin/usuarios");
  }

  if (section === "operadores") {
    redirect("/operadores");
  }

  if (section === "equipes") {
    redirect("/equipes");
  }

  if (section === "carteiras") {
    redirect("/carteiras");
  }

  if (section === "metas") {
    redirect("/metas");
  }

  const { profile, data } = await getAdminSectionData(section as AdminSectionKey);
  ensureRole(profile, ["admin", "gerente"]);

  if (!data.rows.length) {
    return (
      <EmptyState
        title={`Sem registros em ${data.title.toLowerCase()}`}
        description={data.description}
        actionHref="/admin"
        actionLabel="Voltar para administracao"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{data.title}</h1>
        <p className="text-sm text-muted-foreground">{data.description}</p>
      </div>
      <DataTable rows={data.rows} columns={data.columns} />
    </div>
  );
}
