import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  criarCredor,
  listarCredores,
  parseCreateCreditorInput,
} from "@/services/credores-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? undefined;
    const creditors = await listarCredores(query);

    return NextResponse.json({ creditors }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar os credores.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseCreateCreditorInput(body);
    const result = await criarCredor(payload);

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
            : "Nao foi possivel cadastrar o credor.",
      },
      { status: 400 },
    );
  }
}
