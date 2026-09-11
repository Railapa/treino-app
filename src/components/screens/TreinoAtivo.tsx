import { useState } from "react";
import type { ExercicioExecutado, SessaoTreino, SerieExecutada, TipoSerie } from "../../types";
import { LABEL_TIPO_SERIE } from "../../types";
import { calcularPesoSugerido, formatarPeso } from "../../utils/calculo";
import { useTimer } from "../../hooks/useTimer";
import { OverlayCronometro } from "../common/OverlayCronometro";
import "./TreinoAtivo.css";

interface Props {
  sessao: SessaoTreino;
  descansoPorTipoEExercicio: Record<string, Record<TipoSerie, number>>;
  onAtualizarSessao: (sessao: SessaoTreino) => void;
  onFinalizar: () => void;
  onSair: () => void;
}

export function TreinoAtivo({
  sessao,
  descansoPorTipoEExercicio,
  onAtualizarSessao,
  onFinalizar,
  onSair,
}: Props) {
  const [expandidoId, setExpandidoId] = useState<string | null>(
    sessao.exercicios[0]?.exercicioTemplateId ?? null
  );
  const timer = useTimer();
  const [cronometroAberto, setCronometroAberto] = useState(false);
  const [tipoSerieCronometro, setTipoSerieCronometro] = useState<TipoSerie>("valida");

  function exercicioCompleto(ex: ExercicioExecutado): boolean {
    return ex.series.every((s) => s.concluida);
  }

  function atualizarExercicio(exercicioId: string, patch: Partial<ExercicioExecutado>) {
    const novaSessao: SessaoTreino = {
      ...sessao,
      exercicios: sessao.exercicios.map((ex) =>
        ex.exercicioTemplateId === exercicioId ? { ...ex, ...patch } : ex
      ),
    };
    onAtualizarSessao(novaSessao);
  }

  function atualizarPesoReferencia(exercicioId: string, peso: number | null) {
    const exercicio = sessao.exercicios.find((e) => e.exercicioTemplateId === exercicioId);
    if (!exercicio) return;
    const seriesAtualizadas = exercicio.series.map((s) => ({
      ...s,
      pesoSugerido: s.tipo === "valida" ? peso : calcularPesoSugerido(peso, s.percentual),
    }));
    atualizarExercicio(exercicioId, { pesoValidoReferencia: peso, series: seriesAtualizadas });
  }

  function atualizarSerie(exercicioId: string, tipo: TipoSerie, indice: number, patch: Partial<SerieExecutada>) {
    const exercicio = sessao.exercicios.find((e) => e.exercicioTemplateId === exercicioId);
    if (!exercicio) return;
    const novasSeries = exercicio.series.map((s) =>
      s.tipo === tipo && s.indiceNoTipo === indice ? { ...s, ...patch } : s
    );
    atualizarExercicio(exercicioId, { series: novasSeries });
  }

  function abrirCronometro(exercicioId: string, tipo: TipoSerie) {
    const segundos = descansoPorTipoEExercicio[exercicioId]?.[tipo] ?? 60;
    setTipoSerieCronometro(tipo);
    timer.iniciar(segundos);
    setCronometroAberto(true);
  }

  return (
    <div className="treino-ativo">
      <header className="treino-ativo__cabecalho">
        <button className="botao-icone" onClick={onSair} aria-label="Sair do treino">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>{sessao.templateNome}</h1>
        <div style={{ width: 22 }} />
      </header>

      <div className="treino-ativo__lista">
        {sessao.exercicios.map((exercicio) => {
          const expandido = expandidoId === exercicio.exercicioTemplateId;
          const completo = exercicioCompleto(exercicio);
          return (
            <div
              key={exercicio.exercicioTemplateId}
              className={`cartao-exercicio ${completo ? "cartao-exercicio--completo" : ""}`}
            >
              <button
                className="cartao-exercicio__cabecalho"
                onClick={() =>
                  setExpandidoId(expandido ? null : exercicio.exercicioTemplateId)
                }
              >
                <div className="cartao-exercicio__titulo">
                  {completo && <span className="cartao-exercicio__check">✓</span>}
                  <span>{exercicio.nome}</span>
                </div>
                <span className="cartao-exercicio__resumo">
                  {exercicio.repsMin !== null && exercicio.repsMax !== null
                    ? `${exercicio.repsMin}–${exercicio.repsMax} reps`
                    : `${exercicio.series.length} séries`}
                </span>
              </button>

              {expandido && (
                <div className="cartao-exercicio__corpo">
                  <label className="campo-peso-referencia">
                    <span>Peso da série válida (kg)</span>
                    <input
                      type="number"
                      step={0.5}
                      placeholder="Ex: 60"
                      value={exercicio.pesoValidoReferencia ?? ""}
                      onChange={(e) =>
                        atualizarPesoReferencia(
                          exercicio.exercicioTemplateId,
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                    />
                  </label>

                  {agruparSeriesPorTipo(exercicio.series).map(({ tipo, series }) => (
                    <div key={tipo} className={`grupo-serie grupo-serie--${tipo}`}>
                      <p className="grupo-serie__titulo">{LABEL_TIPO_SERIE[tipo]}</p>
                      {series.map((serie) => {
                        const meta = calcularMetaReps(serie, exercicio.repsMax);
                        return (
                          <div key={`${serie.tipo}-${serie.indiceNoTipo}`} className="linha-serie">
                            <span className="linha-serie__numero">{serie.indiceNoTipo + 1}</span>
                            <span className="linha-serie__peso numeros">
                              {formatarPeso(serie.pesoUsado ?? serie.pesoSugerido)}
                            </span>
                            <input
                              className="linha-serie__input linha-serie__input--peso"
                              type="number"
                              step={0.5}
                              placeholder="peso"
                              value={serie.pesoUsado ?? ""}
                              onChange={(e) =>
                                atualizarSerie(exercicio.exercicioTemplateId, serie.tipo, serie.indiceNoTipo, {
                                  pesoUsado: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                            />
                            <input
                              className="linha-serie__input linha-serie__input--reps"
                              type="number"
                              placeholder={meta !== null ? `${meta} (meta)` : "reps"}
                              value={serie.reps ?? ""}
                              onChange={(e) =>
                                atualizarSerie(exercicio.exercicioTemplateId, serie.tipo, serie.indiceNoTipo, {
                                  reps: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                            />
                            <button
                              className={`linha-serie__concluir ${serie.concluida ? "linha-serie__concluir--ativo" : ""}`}
                              onClick={() =>
                                atualizarSerie(exercicio.exercicioTemplateId, serie.tipo, serie.indiceNoTipo, {
                                  concluida: !serie.concluida,
                                })
                              }
                              aria-label="Marcar série como concluída"
                            >
                              ✓
                            </button>
                            {serie.repsAnterior !== null && (
                              <span className="linha-serie__anterior">
                                Semana passada: {serie.repsAnterior} reps
                              </span>
                            )}
                          </div>
                        );
                      })}
                      <button
                        className="grupo-serie__descanso"
                        onClick={() => abrirCronometro(exercicio.exercicioTemplateId, tipo)}
                      >
                        Iniciar descanso ({descansoPorTipoEExercicio[exercicio.exercicioTemplateId]?.[tipo] ?? 60}s)
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="treino-ativo__rodape">
        <button className="botao-primario" onClick={onFinalizar}>
          Finalizar treino
        </button>
      </div>

      {cronometroAberto && (
        <OverlayCronometro
          timer={timer}
          tipoSerie={tipoSerieCronometro}
          onFechar={() => {
            setCronometroAberto(false);
            timer.cancelar();
          }}
        />
      )}
    </div>
  );
}

function agruparSeriesPorTipo(series: SerieExecutada[]) {
  const tipos: TipoSerie[] = ["aquecimento", "preparatoria", "valida"];
  return tipos
    .map((tipo) => ({ tipo, series: series.filter((s) => s.tipo === tipo) }))
    .filter((grupo) => grupo.series.length > 0);
}

function calcularMetaReps(serie: SerieExecutada, repsMax: number | null): number | null {
  if (serie.tipo !== "valida" || serie.repsAnterior === null) return null;
  if (repsMax !== null && serie.repsAnterior >= repsMax) return repsMax; // já no teto, repete o teto (hora de subir peso)
  return serie.repsAnterior + 1;
}
