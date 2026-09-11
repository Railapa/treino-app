/**
 * Calcula o peso sugerido para uma série a partir do peso de referência
 * (peso usado na série válida, 100%) e do percentual configurado.
 * Não arredonda para nenhum incremento — é só uma referência que o
 * usuário ajusta manualmente conforme o peso disponível no equipamento.
 */
export function calcularPesoSugerido(
  pesoReferencia: number | null,
  percentual: number
): number | null {
  if (pesoReferencia === null || pesoReferencia <= 0) return null;
  const resultado = (pesoReferencia * percentual) / 100;
  // Uma casa decimal é suficiente para dar a noção de peso
  return Math.round(resultado * 10) / 10;
}

export function formatarPeso(peso: number | null): string {
  if (peso === null) return "—";
  return `${peso} kg`;
}

export function formatarTempo(totalSegundos: number): string {
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}
