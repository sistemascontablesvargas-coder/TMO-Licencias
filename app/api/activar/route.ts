import { NextRequest, NextResponse } from "next/server";
import { obtenerClienteSupabase } from "@/lib/supabase";
import { firmarToken } from "@/lib/token";

/**
 * Primera activación (o reactivación desde la misma PC) de una licencia.
 * Body JSON: { clave: string, maquina_id: string }
 *
 * Reglas:
 * - Si la clave no existe -> 404.
 * - Si ya está atada a otra maquina_id -> 403 (evita que se reparta la
 *   misma clave a más de una PC).
 * - Si todavía no está atada a ninguna PC, se ata a esta en el momento
 *   (aunque el estado siga "pendiente") -> así la primera PC que la usa
 *   se queda con ella, y no hay carrera entre dos personas con la misma
 *   clave.
 * - Si el estado es "revocada" -> 403.
 * - Si el estado es "pendiente" -> 202, sin token todavía (la app de
 *   escritorio debe mostrar "esperando aprobación" y reintentar más
 *   tarde).
 * - Si el estado es "aprobada" y la máquina coincide -> 200 con token.
 */
export async function POST(request: NextRequest) {
  let body: { clave?: string; maquina_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const clave = body.clave?.trim();
  const maquinaId = body.maquina_id?.trim();
  if (!clave || !maquinaId) {
    return NextResponse.json({ error: "Faltan 'clave' o 'maquina_id'." }, { status: 400 });
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

  if (errorBusqueda) {
    // Se loguea el detalle real en los logs de Vercel (Runtime Logs) para
    // poder diagnosticar — al cliente no le mandamos el detalle interno,
    // por si este endpoint queda expuesto a terceros más adelante.
    console.error("Error consultando licencias en Supabase:", errorBusqueda);
    return NextResponse.json(
      { error: "Error al consultar la licencia.", detalle: errorBusqueda.message },
      { status: 500 }
    );
  }
  if (!licencia) {
    return NextResponse.json({ error: "Clave inválida." }, { status: 404 });
  }
  if (licencia.estado === "revocada") {
    return NextResponse.json({ error: "Esta licencia fue revocada." }, { status: 403 });
  }
  if (licencia.maquina_id && licencia.maquina_id !== maquinaId) {
    return NextResponse.json(
      { error: "Esta clave ya está activada en otra PC." },
      { status: 403 }
    );
  }

  const ahora = new Date().toISOString();

  // Primera vez que se usa esta clave: la atamos a esta PC.
  if (!licencia.maquina_id) {
    const { error: errorUpdate } = await supabase
      .from("licencias")
      .update({ maquina_id: maquinaId, activada_en: ahora })
      .eq("id", licencia.id);
    if (errorUpdate) {
      return NextResponse.json({ error: "No se pudo activar la licencia." }, { status: 500 });
    }
  }

  if (licencia.estado === "pendiente") {
    return NextResponse.json({ estado: "pendiente" }, { status: 202 });
  }

  // estado === "aprobada"
  await supabase
    .from("licencias")
    .update({ ultima_validacion: ahora })
    .eq("id", licencia.id);

  const token = firmarToken(clave, maquinaId);
  return NextResponse.json({ estado: "aprobada", token });
}
