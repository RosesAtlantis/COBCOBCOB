import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  alterarClassificacaoParcela,
  parseUpdateInstallmentRevenueTypeInput,
} from "@/services/acordos-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = parseUpdateInstallmentRevenueTypeInput({
      ...body,
      parcelaId: id,
    });
    const result = await alterarClassificacaoParcela(payload);

    if (body.clientId) {
      revalidatePath(`/clientes/${body.clientId}`);
    }

    revalidatePath("/clientes");
    revalidatePath("/acordos");
    revalidatePath("/parcelas");
    revalidatePath("/baixas");
    revalidatePath("/auditoria");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel alterar a classificacao da parcela.",
      },
      { status: 400 },
    );
  }
}
