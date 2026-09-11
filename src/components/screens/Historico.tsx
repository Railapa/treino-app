import { useMemo, useState } from "react";
import type { Template, ExercicioTemplate } from "../../types";
import { sessoesPorExercicio } from "../../storage/db";
import "./Historico.css";

interface Props {
  templates: Template[];
}

type Selecao =
  | { etapa: "treinos" }
  | { etapa: "exercicios"; template: Template }
  | { etapa: "detalhe"; template: Template; exercicio: ExercicioTemplate };

export function Historico({ templates }: Props) {
  const [selecao, setSelecao] = useState<Selecao>({ etapa: "treinos" });

  if (templates.length === 0) {
    return (
      <div className="tela-historico">
        <header className="tela-historico__cabecalho">
          <h1>Histórico</h1>
        </header>
        <div className="tela-historico__vazio">
          <p>Nenhum treino cadastrado ainda.</p>
          <p className="tela-historico__vazio-dica">
            Crie um treino e complete algumas sessões para ver sua evolução aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tela-historico">
      <header className="tela-historico__cabecalho">
        {selecao.etapa !== "treinos" && (
          <button
            className="botao-icone"
            aria-label="Voltar"
            onClick={() =>
              setSelecao(
                selecao.etapa === "detalhe"
                  ? { etapa: "exercicios", template: selecao.template }
                  : { etapa: "treinos" }
              )
            }
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h1>
          {selecao.etapa === "treinos" && "Histórico"}
          {selecao.etapa === "exercicios" && selecao.template.nome}
          {selecao.etapa === "detalhe" && selecao.exercicio.nome}
        </h1>
      </header>

      {selecao.etapa === "treinos" && (
        <ul className="tela-historico__lista">
          {templates.map((template) => (
            <li key={template.id}>
              <button
                className="item-lista-historico"
                onClick={() => setSelecao({ etapa: "exercicios", template })}
              >
                <span>{template.nome}</span>
                <span className="item-lista-historico__seta">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selecao.etapa === "exercicios" && (
        <ul className="tela-historico__lista">
          {selecao.template.exercicios.map((exercicio) => (
            <li key={exercicio.id}>
              <button
                className="item-lista-historico"
                onClick={() =>
                  setSelecao({ etapa: "detalhe", template: selecao.template, exercicio })
                }
              >
                <span>{exercicio.nome}</span>
                <span className="item-lista-historico__seta">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selecao.etapa === "detalhe" && (
        <TabelaExercicio exercicio={selecao.exercicio} />
      )}
    </div>
  );
}

function TabelaExercicio({ exercicio }: { exercicio: ExercicioTemplate }) {
  const sessoes = useMemo(() => sessoesPorExercicio(exercicio.id), [exercicio.id]);

  const numeroMaximoDeValidas = useMemo(() => {
    let max = 0;
    sessoes.forEach((sessao) => {
      const exec = sessao.exercicios.find((e) => e.exercicioTemplateId === exercicio.id);
      const qtd = exec?.series.filter((s) => s.tipo === "valida").length ?? 0;
      if (qtd > max) max = qtd;
    });
    return max;
  }, [sessoes, exercicio.id]);

  if (sessoes.length === 0) {
    return (
      <div className="tela-historico__vazio">
        <p>Ainda não há sessões concluídas para este exercício.</p>
      </div>
    );
  }

  const temFaixaReps = exercicio.repsMin !== null && exercicio.repsMax !== null;

  return (
    <div className="tabela-historico-wrap">
      {temFaixaReps && (
        <p className="tabela-historico__faixa">
          Meta de reps: {exercicio.repsMin}–{exercicio.repsMax}
        </p>
      )}
      <table className="tabela-historico">
        <thead>
          <tr>
            <th>Data</th>
            {Array.from({ length: numeroMaximoDeValidas }).map((_, i) => (
              <th key={i}>Série {i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...sessoes].reverse().map((sessao) => {
            const exec = sessao.exercicios.find((e) => e.exercicioTemplateId === exercicio.id);
            const validas = exec?.series.filter((s) => s.tipo === "valida") ?? [];
            return (
              <tr key={sessao.id}>
                <td className="tabela-historico__data">
                  {new Date(sessao.dataInicio).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </td>
                {Array.from({ length: numeroMaximoDeValidas }).map((_, i) => {
                  const serie = validas[i];
                  if (!serie || (serie.pesoUsado === null && serie.reps === null)) {
                    return (
                      <td key={i} className="tabela-historico__vazio-celula">
                        —
                      </td>
                    );
                  }
                  const noTeto =
                    temFaixaReps && serie.reps !== null && serie.reps >= (exercicio.repsMax ?? Infinity);
                  return (
                    <td key={i} className={noTeto ? "tabela-historico__celula--teto" : undefined}>
                      <span className="numeros">{serie.pesoUsado ?? "—"}kg</span>
                      <span className="tabela-historico__reps numeros">
                        {serie.reps ?? "—"} reps
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
