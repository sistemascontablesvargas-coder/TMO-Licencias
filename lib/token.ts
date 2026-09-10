import jwt from "jsonwebtoken";

// Cuánto dura un token de activación antes de que la app de escritorio
// tenga que revalidar online contra /api/validar. Un margen de 10 días da
// tiempo de sobra para revisar partidos sin internet (viajes, canchas sin
// señal) sin dejar una licencia revocada activa por meses.
const DIAS_VALIDEZ = 10;

function obtenerSecreto(): string {
  const secreto = process.env.LICENSE_JWT_SECRET;
  if (!secreto) {
    throw new Error("Falta la variable de entorno LICENSE_JWT_SECRET en Vercel.");
  }
  return secreto;
}

export function firmarToken(clave: string, maquinaId: string): string {
  return jwt.sign({ clave, maquina_id: maquinaId }, obtenerSecreto(), {
    expiresIn: `${DIAS_VALIDEZ}d`,
  });
}

export function verificarToken(token: string): { clave: string; maquina_id: string } | null {
  try {
    return jwt.verify(token, obtenerSecreto()) as { clave: string; maquina_id: string };
  } catch {
    return null;
  }
}
