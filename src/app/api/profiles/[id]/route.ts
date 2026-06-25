import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  atualizarProfile,
  inativarProfile,
  parseProfileStatusInput,
  parseUpdateProfileInput,
} from "@/services/profiles-service";

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
      ? await inativarProfile(
          parseProfileStatusInput({
            id,
            ativo: body.ativo,
          }),
        )
      : await atualizarProfile(
          parseUpdateProfileInput({
            ...body,
            id,
          }),
        );

    revalidatePath("/admin");
    revalidatePath("/admin/usuarios");
    revalidatePath("/operadores");
    revalidatePath("/equipes");
    revalidatePath("/auditoria");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o usuario.",
      },
      { status: 400 },
    );
  }
}
