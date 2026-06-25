import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  atualizarOperador,
  inativarOperador,
  parseOperatorStatusInput,
  parseUpdateOperatorInput,
} from "@/services/operadores-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const isStatusOnly =
      typeof body === "object" &&
      body !== null &&
      "ativo" in body &&
      typeof body.ativo === "boolean" &&
      Object.keys(body).length === 1;

    const result = isStatusOnly
      ? await inativarOperador(
          parseOperatorStatusInput({
            id,
            ativo: body.ativo,
          }),
        )
      : await atualizarOperador(
          parseUpdateOperatorInput({
            ...body,
            id,
          }),
        );

    revalidatePath("/operadores");
    revalidatePath("/clientes");
    revalidatePath("/auditoria");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o operador.",
      },
      { status: 400 },
    );
  }
}
