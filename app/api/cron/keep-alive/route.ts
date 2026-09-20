import { NextResponse } from "next/server";
import { obtenerClienteSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Vercel llama a esto una vez por día (ver "crons" en vercel.json). El
 * plan gratuito de Supabase pausa automáticamente los proyectos sin
 * actividad en la base durante 7 días seguidos — con esto nunca pasan
 * más de 24hs sin una consulta real, así que el proyecto no se pausa
 * más aunque nadie use la app en el medio.
 */
export async function GET() {
  try {
    const supabase = obtenerClienteSupabase();
    const { error } = await supabase.from("licencias").select("id").limit(1);
    if (error) {
      console.error("keep-alive: error consultando Supabase:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, fecha: new Date().toISOString() });
  } catch (e: any) {
    console.error("keep-alive: excepción:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
