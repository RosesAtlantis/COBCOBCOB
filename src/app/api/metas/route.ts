import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  criarMeta,
  listarMetas,
  parseCreateGoalInput,
} from "@/services/metas-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? undefined;
    const goals = await listarMetas(query);

    return NextResponse.json({ goals }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar as metas.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseCreateGoalInput(body);
    const result = await criarMeta(payload);

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
            : "Nao foi possivel cadastrar a meta.",
      },
      { status: 400 },
    );
  }
}
