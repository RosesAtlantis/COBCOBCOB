import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { reverterImportacao } from "@/services/import-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { motivo?: string | null };
    const result = await reverterImportacao(id, body.motivo ?? "");

    revalidatePath("/importacoes");
    revalidatePath("/dashboard");
    revalidatePath("/auditoria");
    revalidatePath("/clientes");
    revalidatePath("/acordos");
    revalidatePath("/parcelas");
    revalidatePath("/baixas");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel reverter a importacao.",
      },
      { status: 400 },
    );
  }
}
