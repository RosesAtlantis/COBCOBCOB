import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

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

    if (body.clienteId) {
      revalidatePath(`/clientes/${body.clienteId}`);
    }

    if (body.acordoId) {
      revalidatePath(`/acordos/${body.acordoId}`);
    }

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
            : "Nao foi possivel estornar a baixa.",
      },
      { status: 400 },
    );
  }
}
