import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getApiErrorMessage } from "@/services/cadastros-utils";
import {
  estornarBaixa,
  parseReverseWriteOffInput,
} from "@/services/baixas-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = parseReverseWriteOffInput({
      ...body,
      baixaId: id,
    });
    const result = await estornarBaixa(payload);

    const clientId = body.cliente_id ?? body.clienteId ?? body.clientId ?? null;

    if (clientId) {
      revalidatePath(`/clientes/${clientId}`);
    }

    const agreementId = body.acordo_id ?? body.acordoId ?? body.agreementId ?? null;

    if (agreementId) {
      revalidatePath(`/acordos/${agreementId}`);
    }

    revalidatePath("/clientes");
    revalidatePath("/acordos");
    revalidatePath("/parcelas");
    revalidatePath("/baixas");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: getApiErrorMessage(error, "Nao foi possivel estornar a baixa."),
      },
      { status: 400 },
    );
  }
}
