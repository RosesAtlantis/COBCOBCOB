import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  criarEquipe,
  listarEquipes,
  parseCreateTeamInput,
} from "@/services/equipes-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? undefined;
    const teams = await listarEquipes(query);

    return NextResponse.json({ teams }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar as equipes.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseCreateTeamInput(body);
    const result = await criarEquipe(payload);

    revalidatePath("/equipes");
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
            : "Nao foi possivel cadastrar a equipe.",
      },
      { status: 400 },
    );
  }
}
