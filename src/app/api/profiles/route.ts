import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  criarProfile,
  listarProfiles,
  parseCreateProfileInput,
} from "@/services/profiles-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? undefined;
    const profiles = await listarProfiles(query);

    return NextResponse.json({ profiles }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar os usuarios.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseCreateProfileInput(body);
    const result = await criarProfile(payload);

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
            : "Nao foi possivel cadastrar o usuario.",
      },
      { status: 400 },
    );
  }
}
