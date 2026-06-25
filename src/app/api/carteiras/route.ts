import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  criarCarteira,
  listarCarteiras,
  parseCreateWalletInput,
} from "@/services/carteiras-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? undefined;
    const wallets = await listarCarteiras(query);

    return NextResponse.json({ wallets }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar as carteiras.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseCreateWalletInput(body);
    const result = await criarCarteira(payload);

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
            : "Nao foi possivel cadastrar a carteira.",
      },
      { status: 400 },
    );
  }
}
