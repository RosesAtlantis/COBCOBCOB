import { NextResponse } from "next/server";

import { getImportRequestProfile, processImport } from "@/services/import-service";
import type { ImportType } from "@/types/portal";

const validTypes = new Set<ImportType>([
  "cobware",
  "pagamentos",
  "acordos",
  "operadores",
  "metas",
  "carteiras",
  "acionamentos",
]);

export async function POST(request: Request) {
  try {
    const profile = await getImportRequestProfile();
    const formData = await request.formData();
    const type = formData.get("type");
    const file = formData.get("file");

    if (!type || !validTypes.has(String(type) as ImportType)) {
      return NextResponse.json(
        { message: "Tipo de importacao invalido." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Arquivo nao enviado ou formato invalido." },
        { status: 400 },
      );
    }

    const result = await processImport(profile, String(type) as ImportType, file);

    return NextResponse.json(result, {
      status: result.status === "error" ? 400 : 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Falha inesperada ao importar o arquivo.",
      },
      { status: 500 },
    );
  }
}
