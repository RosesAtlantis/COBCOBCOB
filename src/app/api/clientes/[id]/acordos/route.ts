import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  criarAcordo,
  parseCreateAgreementInput,
} from "@/services/acordos-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = parseCreateAgreementInput({
      ...body,
      clienteId: id,
    });
    const result = await criarAcordo(payload);

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
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
            : "Nao foi possivel cadastrar o acordo.",
      },
      { status: 400 },
    );
  }
}
