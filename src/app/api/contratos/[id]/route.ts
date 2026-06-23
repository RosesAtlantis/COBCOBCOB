import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  atualizarContrato,
  parseUpsertContractInput,
} from "@/services/clientes-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = parseUpsertContractInput({
      ...body,
      contractId: id,
    });
    const result = await atualizarContrato(payload);

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${result.clientId}`);
    revalidatePath("/auditoria");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o contrato.",
      },
      { status: 400 },
    );
  }
}
