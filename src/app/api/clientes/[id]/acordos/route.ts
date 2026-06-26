import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getApiErrorMessage } from "@/services/cadastros-utils";
import { criarAcordo } from "@/services/acordos-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await criarAcordo({
      ...body,
      cliente_id: id,
    });

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    revalidatePath("/acordos");
    revalidatePath("/parcelas");
    revalidatePath("/baixas");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: getApiErrorMessage(error, "Nao foi possivel cadastrar o acordo."),
      },
      { status: 400 },
    );
  }
}
