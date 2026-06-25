import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getApiErrorMessage } from "@/services/cadastros-utils";
import {
  criarContrato,
  parseUpsertContractInput,
} from "@/services/clientes-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = parseUpsertContractInput({
      ...body,
      cliente_id: id,
    });
    const result = await criarContrato(payload);

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    revalidatePath("/auditoria");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: getApiErrorMessage(error, "Nao foi possivel criar o contrato."),
      },
      { status: 400 },
    );
  }
}
