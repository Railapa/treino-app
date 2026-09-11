import { useEffect, useState } from "react";
import { Home } from "./components/screens/Home";
import { EditorTemplate } from "./components/screens/EditorTemplate";
import { TreinoAtivo } from "./components/screens/TreinoAtivo";
import { Historico } from "./components/screens/Historico";
import { BarraNavegacao } from "./components/common/BarraNavegacao";
import type { Aba } from "./components/common/BarraNavegacao";
import type {
  ExercicioExecutado,
  SerieExecutada,
  SessaoTreino,
  Template,
  TipoSerie,
} from "./types";
import {
  listarTemplates,
  salvarTemplate,
  excluirTemplate,
  salvarSessao,
  gerarId,
  lerSessaoAtiva,
  salvarSessaoAtiva,
  limparSessaoAtiva,
  ultimaExecucaoDoExercicio,
} from "./storage/db";
import { calcularPesoSugerido } from "./utils/calculo";

type Rota =
  | { nome: "home" }
  | { nome: "editorTemplate"; template: Template | null }
  | { nome: "treinoAtivo" }
  | { nome: "historico" };

function criarSessaoAPartirDoTemplate(template: Template): SessaoTreino {
  const exercicios: ExercicioExecutado[] = template.exercicios.map((exTemplate) => {
    const ultimaExecucao = ultimaExecucaoDoExercicio(exTemplate.id);
    const pesoReferencia = ultimaExecucao
      ? (() => {
          const validasAnteriores = ultimaExecucao.series.filter((s) => s.tipo === "valida");
          const pesos = validasAnteriores
            .map((s) => s.pesoUsado)
            .filter((p): p is number => p !== null);
          return pesos.length ? pesos[0] : null;
        })()
      : null;

    function repsAnteriorDaSerie(tipo: TipoSerie, indice: number): number | null {
      if (!ultimaExecucao) return null;
      const serieAnterior = ultimaExecucao.series.find(
        (s) => s.tipo === tipo && s.indiceNoTipo === indice
      );
      return serieAnterior?.reps ?? null;
    }

    const series: SerieExecutada[] = [];
    exTemplate.configSeries.forEach((config) => {
      config.percentuais.forEach((percentual, i) => {
        series.push({
          tipo: config.tipo,
          indiceNoTipo: i,
          percentual,
          pesoSugerido:
            config.tipo === "valida"
              ? pesoReferencia
              : calcularPesoSugerido(pesoReferencia, percentual),
          pesoUsado: config.tipo === "valida" ? pesoReferencia : null,
          repsAnterior: repsAnteriorDaSerie(config.tipo, i),
          reps: null,
          concluida: false,
        });
      });
    });

    return {
      exercicioTemplateId: exTemplate.id,
      nome: exTemplate.nome,
      repsMin: exTemplate.repsMin,
      repsMax: exTemplate.repsMax,
      pesoValidoReferencia: pesoReferencia,
      series,
    };
  });

  return {
    id: gerarId(),
    templateId: template.id,
    templateNome: template.nome,
    dataInicio: Date.now(),
    dataFim: null,
    exercicios,
  };
}

function construirMapaDescanso(template: Template | undefined): Record<string, Record<TipoSerie, number>> {
  const mapa: Record<string, Record<TipoSerie, number>> = {};
  if (!template) return mapa;
  template.exercicios.forEach((ex) => {
    mapa[ex.id] = { aquecimento: 60, preparatoria: 60, valida: 90 };
    ex.configSeries.forEach((c) => {
      mapa[ex.id][c.tipo] = c.descansoSegundos;
    });
  });
  return mapa;
}

export default function App() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [rota, setRota] = useState<Rota>({ nome: "home" });
  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoTreino | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<Aba>("home");

  useEffect(() => {
    setTemplates(listarTemplates());
    const sessaoSalva = lerSessaoAtiva();
    if (sessaoSalva) {
      setSessaoAtiva(sessaoSalva);
      setRota({ nome: "treinoAtivo" });
    }
  }, []);

  function recarregarTemplates() {
    setTemplates(listarTemplates());
  }

  function handleIniciarTreino(template: Template) {
    const sessao = criarSessaoAPartirDoTemplate(template);
    setSessaoAtiva(sessao);
    salvarSessaoAtiva(sessao);
    setRota({ nome: "treinoAtivo" });
  }

  function handleAtualizarSessao(sessao: SessaoTreino) {
    setSessaoAtiva(sessao);
    salvarSessaoAtiva(sessao);
  }

  function handleFinalizarTreino() {
    if (!sessaoAtiva) return;
    const sessaoFinal: SessaoTreino = { ...sessaoAtiva, dataFim: Date.now() };
    salvarSessao(sessaoFinal);
    limparSessaoAtiva();
    setSessaoAtiva(null);
    setAbaAtiva("home");
    setRota({ nome: "home" });
  }

  function handleSairTreino() {
    const confirmar = window.confirm(
      "Sair sem finalizar? Seu progresso fica salvo e você pode continuar depois."
    );
    if (!confirmar) return;
    setRota({ nome: "home" });
  }

  function handleSalvarTemplate(template: Template) {
    salvarTemplate(template);
    recarregarTemplates();
    setRota({ nome: "home" });
  }

  function handleExcluirTemplate(id: string) {
    const confirmar = window.confirm("Excluir este treino? Essa ação não pode ser desfeita.");
    if (!confirmar) return;
    excluirTemplate(id);
    recarregarTemplates();
    setRota({ nome: "home" });
  }

  function handleMudarAba(aba: Aba) {
    setAbaAtiva(aba);
    setRota(aba === "home" ? { nome: "home" } : { nome: "historico" });
  }

  const templateDaSessao = sessaoAtiva
    ? templates.find((t) => t.id === sessaoAtiva.templateId)
    : undefined;

  return (
    <>
      {rota.nome === "home" && (
        <Home
          templates={templates}
          onIniciarTreino={handleIniciarTreino}
          onCriarTemplate={() => setRota({ nome: "editorTemplate", template: null })}
          onEditarTemplate={(t) => setRota({ nome: "editorTemplate", template: t })}
        />
      )}

      {rota.nome === "editorTemplate" && (
        <EditorTemplate
          templateExistente={rota.template}
          onSalvar={handleSalvarTemplate}
          onExcluir={handleExcluirTemplate}
          onCancelar={() => setRota({ nome: "home" })}
        />
      )}

      {rota.nome === "treinoAtivo" && sessaoAtiva && (
        <TreinoAtivo
          sessao={sessaoAtiva}
          descansoPorTipoEExercicio={construirMapaDescanso(templateDaSessao)}
          onAtualizarSessao={handleAtualizarSessao}
          onFinalizar={handleFinalizarTreino}
          onSair={handleSairTreino}
        />
      )}

      {rota.nome === "historico" && <Historico templates={templates} />}

      {(rota.nome === "home" || rota.nome === "historico") && (
        <BarraNavegacao abaAtiva={abaAtiva} onMudarAba={handleMudarAba} />
      )}
    </>
  );
}
