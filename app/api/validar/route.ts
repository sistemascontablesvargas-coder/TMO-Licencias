import { NextRequest, NextResponse } from "next/server";
import { obtenerClienteSupabase } from "@/lib/supabase";
import { firmarToken, verificarToken } from "@/lib/token";

/**
 * Revalidación periódica de una licencia ya activada (la app de escritorio
 * la llama cada tanto mientras tiene internet, para poder detectar una
 * revocación y renovar el token antes de que venza).
 * Body JSON: { clave: string, maquina_id: string, token: string }
 */
export async function POST(request: NextRequest) {
  let body: { clave?: string; maquina_id?: string; token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const clave = body.clave?.trim();
  const maquinaId = body.maquina_id?.trim();
  const token = body.token?.trim();
  if (!clave || !maquinaId || !token) {
    return NextResponse.json({ error: "Faltan 'clave', 'maquina_id' o 'token'." }, { status: 400 });
  }

  const contenido = verificarToken(token);
  if (!contenido || contenido.clave !== clave || contenido.maquina_id !== maquinaId) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  let supabase;
  try {
    supabase = obtenerClienteSupabase();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  const { data: licencia, error: errorBusqueda } = await supabase
    .from("licencias")
    .select("*")
    .eq("clave", clave)
    .maybeSingle();

  if (errorBusqueda || !licencia) {
    return NextResponse.json({ error: "Licencia no encontrada." }, { status: 404 });
  }
  if (licencia.estado !== "aprobada" || licencia.maquina_id !== maquinaId) {
    return NextResponse.json({ error: "Licencia no válida para esta PC." }, { status: 403 });
  }

  await supabase
    .from("licencias")
    .update({ ultima_validacion: new Date().toISOString() })
    .eq("id", licencia.id);

  const nuevoToken = firmarToken(clave, maquinaId);
  return NextResponse.json({ estado: "aprobada", token: nuevoToken });
}
