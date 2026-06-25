import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getApiErrorMessage } from "@/services/cadastros-utils";
import {
  cancelarAcordo,
  parseCancelAgreementInput,
} from "@/services/acordos-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = parseCancelAgreementInput({
      ...body,
      acordo_id: id,
    });
    const result = await cancelarAcordo(payload);

    const clientId = body.cliente_id ?? body.clienteId ?? body.clientId ?? null;

    if (clientId) {
      revalidatePath(`/clientes/${clientId}`);
    }

    revalidatePath("/clientes");
    revalidatePath("/acordos");
    revalidatePath("/parcelas");
    revalidatePath("/baixas");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: getApiErrorMessage(error, "Nao foi possivel cancelar o acordo."),
      },
      { status: 400 },
    );
  }
}
