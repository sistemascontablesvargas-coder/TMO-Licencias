import { createClient } from "@supabase/supabase-js";

// Se crea recién cuando se llama (no al importar el módulo), para que el
// build de Next.js no falle si las variables de entorno todavía no están
// cargadas en Vercel (por ejemplo, en el primer deploy antes de configurar
// Supabase).
export function obtenerClienteSupabase() {
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !clave) {
    throw new Error(
      "Faltan las variables de entorno SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en Vercel."
    );
  }

  return createClient(url, clave, {
    auth: { persistSession: false },
  });
}
