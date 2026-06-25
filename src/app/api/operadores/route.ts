import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  criarOperador,
  listarOperadores,
  parseCreateOperatorInput,
} from "@/services/operadores-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? undefined;
    const operators = await listarOperadores(query);

    return NextResponse.json({ operators }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar os operadores.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseCreateOperatorInput(body);
    const result = await criarOperador(payload);

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
            : "Nao foi possivel cadastrar o operador.",
      },
      { status: 400 },
    );
  }
}
