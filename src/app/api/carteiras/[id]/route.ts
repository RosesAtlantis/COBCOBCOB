import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  atualizarCarteira,
  inativarCarteira,
  parseUpdateWalletInput,
  parseWalletStatusInput,
} from "@/services/carteiras-service";

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
      ? await inativarCarteira(
          parseWalletStatusInput({
            id,
            ativo: body.ativo,
          }),
        )
      : await atualizarCarteira(
          parseUpdateWalletInput({
            ...body,
            id,
          }),
        );

    revalidatePath("/carteiras");
    revalidatePath("/clientes");
    revalidatePath("/clientes/novo");
    revalidatePath("/auditoria");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar a carteira.",
      },
      { status: 400 },
    );
  }
}
