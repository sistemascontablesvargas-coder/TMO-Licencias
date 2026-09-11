import { NextResponse } from "next/server";

// force-dynamic: sin esto Next.js prerenderiza esta ruta en build time (no
// usa cookies/headers/request), y quedaría congelado el valor de build en
// vez de leer la variable de entorno real de Vercel en cada request.
export const dynamic = "force-dynamic";

// Endpoint TEMPORAL solo para diagnosticar el problema con SUPABASE_URL —
// no expone la service_role key, solo la URL (que no es secreta). Borrar
// este archivo una vez resuelto.
export async function GET() {
  const url = process.env.SUPABASE_URL;
  return NextResponse.json({
    valor_json: JSON.stringify(url),
    longitud: url?.length ?? null,
    definida: url !== undefined,
  });
}
