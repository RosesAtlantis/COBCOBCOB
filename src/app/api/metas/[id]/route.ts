import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  atualizarMeta,
  inativarMeta,
  parseGoalStatusInput,
  parseUpdateGoalInput,
} from "@/services/metas-service";

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
      ? await inativarMeta(
          parseGoalStatusInput({
            id,
            ativo: body.ativo,
          }),
        )
      : await atualizarMeta(
          parseUpdateGoalInput({
            ...body,
            id,
          }),
        );

    revalidatePath("/metas");
    revalidatePath("/dashboard");
    revalidatePath("/ranking");
    revalidatePath("/auditoria");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar a meta.",
      },
      { status: 400 },
    );
  }
}
