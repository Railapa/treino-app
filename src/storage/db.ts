import type { Template, SessaoTreino, ConfigSerie, ExercicioTemplate } from "../types";

const CHAVE_TEMPLATES = "treino-app:templates";
const CHAVE_SESSOES = "treino-app:sessoes";
const CHAVE_SESSAO_ATIVA = "treino-app:sessaoAtiva";

function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return padrao;
    return JSON.parse(bruto) as T;
  } catch {
    return padrao;
  }
}

function escrever<T>(chave: string, valor: T): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (e) {
    console.error("Erro ao salvar no armazenamento local:", e);
  }
}

// --- Migração de dados de versões antigas do app ---
// Uma versão anterior guardava cada ConfigSerie como { quantidade, percentual }
// (um único percentual repetido). A versão atual guarda { percentuais: number[] },
// um valor por série. Esta função detecta o formato antigo e converte.
function migrarConfigSerie(config: unknown): ConfigSerie {
  const c = config as Record<string, unknown>;
  if (Array.isArray(c.percentuais)) {
    return c as unknown as ConfigSerie;
  }
  const quantidade = typeof c.quantidade === "number" ? c.quantidade : 1;
  const percentual = typeof c.percentual === "number" ? c.percentual : 100;
  return {
    tipo: c.tipo as ConfigSerie["tipo"],
    percentuais: Array(quantidade).fill(percentual),
    descansoSegundos: typeof c.descansoSegundos === "number" ? c.descansoSegundos : 60,
  };
}

function migrarExercicioTemplate(ex: unknown): ExercicioTemplate {
  const e = ex as Record<string, unknown>;
  return {
    id: e.id as string,
    nome: e.nome as string,
    ordem: e.ordem as number,
    configSeries: Array.isArray(e.configSeries)
      ? e.configSeries.map(migrarConfigSerie)
      : [],
    repsMin: typeof e.repsMin === "number" ? e.repsMin : null,
    repsMax: typeof e.repsMax === "number" ? e.repsMax : null,
  };
}

function migrarTemplate(template: unknown): Template {
  const t = template as Record<string, unknown>;
  return {
    id: t.id as string,
    nome: t.nome as string,
    criadoEm: t.criadoEm as number,
    exercicios: Array.isArray(t.exercicios) ? t.exercicios.map(migrarExercicioTemplate) : [],
  };
}

// Sessões antigas não tinham `percentual` nem `repsAnterior` em cada série,
// nem `repsMin`/`repsMax` no exercício executado. Preenchemos com valores neutros
// para que o histórico e o app não quebrem ao ler sessões já salvas.
function migrarSessao(sessao: unknown): SessaoTreino {
  const s = sessao as Record<string, unknown>;
  const exercicios = Array.isArray(s.exercicios)
    ? s.exercicios.map((exBruto) => {
        const ex = exBruto as Record<string, unknown>;
        const series = Array.isArray(ex.series)
          ? ex.series.map((serieBruta) => {
              const serie = serieBruta as Record<string, unknown>;
              return {
                tipo: serie.tipo,
                indiceNoTipo: serie.indiceNoTipo,
                percentual: typeof serie.percentual === "number" ? serie.percentual : 100,
                pesoSugerido: serie.pesoSugerido ?? null,
                pesoUsado: serie.pesoUsado ?? null,
                repsAnterior: typeof serie.repsAnterior === "number" ? serie.repsAnterior : null,
                reps: serie.reps ?? null,
                concluida: Boolean(serie.concluida),
              };
            })
          : [];
        return {
          exercicioTemplateId: ex.exercicioTemplateId,
          nome: ex.nome,
          repsMin: typeof ex.repsMin === "number" ? ex.repsMin : null,
          repsMax: typeof ex.repsMax === "number" ? ex.repsMax : null,
          pesoValidoReferencia: ex.pesoValidoReferencia ?? null,
          series,
        };
      })
    : [];
  return {
    id: s.id as string,
    templateId: s.templateId as string,
    templateNome: s.templateNome as string,
    dataInicio: s.dataInicio as number,
    dataFim: (s.dataFim as number | null) ?? null,
    exercicios,
  } as SessaoTreino;
}

// --- Templates ---

export function listarTemplates(): Template[] {
  const brutos = ler<unknown[]>(CHAVE_TEMPLATES, []);
  const migrados = brutos.map(migrarTemplate);
  // Persiste de volta já no formato novo, para não precisar migrar de novo a cada leitura.
  if (brutos.length > 0) {
    escrever(CHAVE_TEMPLATES, migrados);
  }
  return migrados;
}

export function salvarTemplate(template: Template): void {
  const templates = listarTemplates();
  const idx = templates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    templates[idx] = template;
  } else {
    templates.push(template);
  }
  escrever(CHAVE_TEMPLATES, templates);
}

export function excluirTemplate(id: string): void {
  const templates = listarTemplates().filter((t) => t.id !== id);
  escrever(CHAVE_TEMPLATES, templates);
}

export function buscarTemplate(id: string): Template | undefined {
  return listarTemplates().find((t) => t.id === id);
}

// --- Sessões (histórico) ---

export function listarSessoes(): SessaoTreino[] {
  const brutas = ler<unknown[]>(CHAVE_SESSOES, []);
  const migradas = brutas.map(migrarSessao);
  if (brutas.length > 0) {
    escrever(CHAVE_SESSOES, migradas);
  }
  return migradas;
}

export function salvarSessao(sessao: SessaoTreino): void {
  const sessoes = listarSessoes();
  const idx = sessoes.findIndex((s) => s.id === sessao.id);
  if (idx >= 0) {
    sessoes[idx] = sessao;
  } else {
    sessoes.push(sessao);
  }
  escrever(CHAVE_SESSOES, sessoes);
}

export function sessoesPorExercicio(exercicioTemplateId: string): SessaoTreino[] {
  return listarSessoes()
    .filter((s) => s.dataFim !== null)
    .filter((s) => s.exercicios.some((e) => e.exercicioTemplateId === exercicioTemplateId))
    .sort((a, b) => a.dataInicio - b.dataInicio);
}

// Pega a sessão mais recente concluída que contém esse exercício,
// usada para sugerir o peso válido de referência.
export function ultimaExecucaoDoExercicio(exercicioTemplateId: string) {
  const sessoes = sessoesPorExercicio(exercicioTemplateId);
  if (sessoes.length === 0) return undefined;
  const ultima = sessoes[sessoes.length - 1];
  return ultima.exercicios.find((e) => e.exercicioTemplateId === exercicioTemplateId);
}

// --- Sessão ativa em andamento (rascunho, para não perder progresso ao fechar o app) ---

export function lerSessaoAtiva(): SessaoTreino | null {
  const bruta = ler<unknown | null>(CHAVE_SESSAO_ATIVA, null);
  if (!bruta) return null;
  return migrarSessao(bruta);
}

export function salvarSessaoAtiva(sessao: SessaoTreino | null): void {
  escrever(CHAVE_SESSAO_ATIVA, sessao);
}

export function limparSessaoAtiva(): void {
  localStorage.removeItem(CHAVE_SESSAO_ATIVA);
}

export function gerarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
