import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getApiErrorMessage } from "@/services/cadastros-utils";
import {
  atualizarCliente,
  parseUpdateClientInput,
} from "@/services/clientes-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = parseUpdateClientInput({
      ...body,
      cliente_id: id,
    });
    const result = await atualizarCliente(payload);

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    revalidatePath("/auditoria");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: getApiErrorMessage(error, "Nao foi possivel atualizar o cliente."),
      },
      { status: 400 },
    );
  }
}
