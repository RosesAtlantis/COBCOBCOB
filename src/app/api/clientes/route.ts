import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getApiErrorMessage } from "@/services/cadastros-utils";
import {
  buscarClientePorCpfCnpj,
  criarCasoManualSimplificado,
  parseManualCaseInput,
} from "@/services/clientes-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cpfCnpj =
      searchParams.get("cpf_cnpj") ??
      searchParams.get("cpfCnpj") ??
      searchParams.get("documento");

    if (!cpfCnpj) {
      return NextResponse.json({ client: null }, { status: 200 });
    }

    const client = await buscarClientePorCpfCnpj(cpfCnpj);

    return NextResponse.json(
      {
        client: client
          ? {
              id: client.id,
              nome: client.nome,
              cpfCnpj: client.cpf_cnpj,
            }
          : null,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: getApiErrorMessage(error, "Nao foi possivel consultar o cliente."),
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseManualCaseInput(body);
    const result = await criarCasoManualSimplificado(payload);

    revalidatePath("/clientes");
    revalidatePath("/dashboard");
    revalidatePath(`/clientes/${result.clientId}`);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: getApiErrorMessage(error, "Nao foi possivel criar o caso manual."),
      },
      { status: 400 },
    );
  }
}
