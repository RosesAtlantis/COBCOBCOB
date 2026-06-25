import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  atualizarCredor,
  inativarCredor,
  parseCreditorStatusInput,
  parseUpdateCreditorInput,
} from "@/services/credores-service";

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
      ? await inativarCredor(
          parseCreditorStatusInput({
            id,
            ativo: body.ativo,
          }),
        )
      : await atualizarCredor(
          parseUpdateCreditorInput({
            ...body,
            id,
          }),
        );

    revalidatePath("/credores");
    revalidatePath("/clientes");
    revalidatePath("/clientes/novo");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o credor.",
      },
      { status: 400 },
    );
  }
}
