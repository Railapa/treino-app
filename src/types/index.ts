// Tipos de série possíveis
export type TipoSerie = "aquecimento" | "preparatoria" | "valida";

export const TIPOS_SERIE: TipoSerie[] = ["aquecimento", "preparatoria", "valida"];

export const LABEL_TIPO_SERIE: Record<TipoSerie, string> = {
  aquecimento: "Aquecimento",
  preparatoria: "Preparatória",
  valida: "Válida",
};

// Configuração de um "grupo" de séries dentro de um exercício.
// Cada série do grupo tem seu próprio percentual (ex: preparatória 1 = 60%, preparatória 2 = 90%).
export interface ConfigSerie {
  tipo: TipoSerie;
  percentuais: number[]; // um valor por série; o comprimento do array é a quantidade de séries desse tipo (válida sempre [100, 100, ...])
  descansoSegundos: number; // tempo padrão de descanso após cada série deste tipo
}

// Exercício dentro de um template
export interface ExercicioTemplate {
  id: string;
  nome: string;
  ordem: number;
  configSeries: ConfigSerie[];
  repsMin: number | null; // faixa de repetições alvo para as séries válidas (ex: 5)
  repsMax: number | null; // (ex: 8)
}

// Template de treino (Treino A, B, C...)
export interface Template {
  id: string;
  nome: string;
  exercicios: ExercicioTemplate[];
  criadoEm: number;
}

// --- Execução real de um treino (sessão) ---

// Uma série executada de fato, com peso e reps reais
export interface SerieExecutada {
  tipo: TipoSerie;
  indiceNoTipo: number; // 0, 1, 2... (para diferenciar 1ª e 2ª válida, por ex.)
  percentual: number; // % configurado no template para este tipo de série (100 para válida)
  pesoSugerido: number | null; // calculado a partir do peso válido de referência
  pesoUsado: number | null; // o que o usuário efetivamente confirmou/ajustou
  repsAnterior: number | null; // reps feitas nesta mesma série (mesmo índice) na sessão anterior
  reps: number | null;
  concluida: boolean;
}

export interface ExercicioExecutado {
  exercicioTemplateId: string;
  nome: string;
  repsMin: number | null;
  repsMax: number | null;
  pesoValidoReferencia: number | null; // peso base (100%) usado para calcular os demais
  series: SerieExecutada[];
}

export interface SessaoTreino {
  id: string;
  templateId: string;
  templateNome: string;
  dataInicio: number;
  dataFim: number | null;
  exercicios: ExercicioExecutado[];
}

// Histórico: cada linha representa uma sessão concluída, com o peso e reps
// de cada série válida individualmente (série 1, série 2...), para comparação direta.
export interface LinhaHistoricoExercicio {
  sessaoId: string;
  data: number;
  seriesValidas: { peso: number | null; reps: number | null }[];
}
