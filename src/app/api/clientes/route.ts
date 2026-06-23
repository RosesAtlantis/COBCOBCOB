import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  criarCasoManual,
  parseManualCaseInput,
} from "@/services/clientes-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseManualCaseInput(body);
    const result = await criarCasoManual(payload);

    revalidatePath("/clientes");
    revalidatePath("/dashboard");
    revalidatePath(`/clientes/${result.clientId}`);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel criar o caso manual.",
      },
      { status: 400 },
    );
  }
}
