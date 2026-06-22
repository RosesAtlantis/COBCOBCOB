import { NextResponse } from "next/server";

import { buscarAcordoPorId } from "@/services/acordos-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const agreement = await buscarAcordoPorId(id);

    if (!agreement) {
      return NextResponse.json(
        { message: "Acordo nao encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json(agreement, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar o acordo.",
      },
      { status: 400 },
    );
  }
}
