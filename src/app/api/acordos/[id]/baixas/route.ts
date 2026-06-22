import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  darBaixaParcela,
  parseWriteOffInput,
} from "@/services/acordos-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = parseWriteOffInput({
      ...body,
      acordoId: id,
    });
    const result = await darBaixaParcela(payload);

    if (body.clienteId) {
      revalidatePath(`/clientes/${body.clienteId}`);
    }

    revalidatePath("/clientes");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel registrar a baixa.",
      },
      { status: 400 },
    );
  }
}
