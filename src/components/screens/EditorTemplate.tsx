import { useState } from "react";
import type { ConfigSerie, ExercicioTemplate, Template, TipoSerie } from "../../types";
import { TIPOS_SERIE, LABEL_TIPO_SERIE } from "../../types";
import { gerarId } from "../../storage/db";
import "./EditorTemplate.css";

interface Props {
  templateExistente: Template | null;
  onSalvar: (template: Template) => void;
  onExcluir: (id: string) => void;
  onCancelar: () => void;
}

const CONFIG_PADRAO: Record<TipoSerie, ConfigSerie> = {
  aquecimento: { tipo: "aquecimento", percentuais: [50], descansoSegundos: 45 },
  preparatoria: { tipo: "preparatoria", percentuais: [75], descansoSegundos: 60 },
  valida: { tipo: "valida", percentuais: [100, 100], descansoSegundos: 90 },
};

function criarExercicioVazio(ordem: number): ExercicioTemplate {
  return {
    id: gerarId(),
    nome: "",
    ordem,
    configSeries: [
      { ...CONFIG_PADRAO.aquecimento, percentuais: [...CONFIG_PADRAO.aquecimento.percentuais] },
      { ...CONFIG_PADRAO.preparatoria, percentuais: [...CONFIG_PADRAO.preparatoria.percentuais] },
      { ...CONFIG_PADRAO.valida, percentuais: [...CONFIG_PADRAO.valida.percentuais] },
    ],
    repsMin: null,
    repsMax: null,
  };
}

export function EditorTemplate({ templateExistente, onSalvar, onExcluir, onCancelar }: Props) {
  const [nome, setNome] = useState(templateExistente?.nome ?? "");
  const [exercicios, setExercicios] = useState<ExercicioTemplate[]>(
    templateExistente?.exercicios ?? []
  );

  function adicionarExercicio() {
    setExercicios((atual) => [...atual, criarExercicioVazio(atual.length)]);
  }

  function atualizarExercicio(id: string, patch: Partial<ExercicioTemplate>) {
    setExercicios((atual) => atual.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removerExercicio(id: string) {
    setExercicios((atual) => atual.filter((e) => e.id !== id));
  }

  function moverExercicio(id: string, direcao: -1 | 1) {
    setExercicios((atual) => {
      const idx = atual.findIndex((e) => e.id === id);
      const novoIdx = idx + direcao;
      if (novoIdx < 0 || novoIdx >= atual.length) return atual;
      const copia = [...atual];
      [copia[idx], copia[novoIdx]] = [copia[novoIdx], copia[idx]];
      return copia.map((e, i) => ({ ...e, ordem: i }));
    });
  }

  function atualizarConfigSerie(exercicioId: string, tipo: TipoSerie, patch: Partial<ConfigSerie>) {
    setExercicios((atual) =>
      atual.map((e) => {
        if (e.id !== exercicioId) return e;
        return {
          ...e,
          configSeries: e.configSeries.map((c) => (c.tipo === tipo ? { ...c, ...patch } : c)),
        };
      })
    );
  }

  function podeSalvar() {
    if (!nome.trim()) return false;
    if (exercicios.length === 0) return false;
    return exercicios.every((e) => e.nome.trim().length > 0);
  }

  function handleSalvar() {
    const template: Template = {
      id: templateExistente?.id ?? gerarId(),
      nome: nome.trim(),
      exercicios,
      criadoEm: templateExistente?.criadoEm ?? Date.now(),
    };
    onSalvar(template);
  }

  return (
    <div className="editor-template">
      <header className="editor-template__cabecalho">
        <button className="botao-icone" onClick={onCancelar} aria-label="Voltar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>{templateExistente ? "Editar treino" : "Novo treino"}</h1>
        {templateExistente ? (
          <button
            className="botao-icone botao-icone--perigo"
            onClick={() => onExcluir(templateExistente.id)}
            aria-label="Excluir treino"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : (
          <div style={{ width: 22 }} />
        )}
      </header>

      <div className="editor-template__corpo">
        <label className="campo">
          <span className="campo__rotulo">Nome do treino</span>
          <input
            className="campo__input"
            type="text"
            placeholder="Ex: Treino A — Costas e Bíceps"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>

        <div className="editor-template__secao-titulo">
          <h2>Exercícios</h2>
        </div>

        {exercicios.map((exercicio, idx) => (
          <BlocoExercicio
            key={exercicio.id}
            exercicio={exercicio}
            posicao={idx}
            total={exercicios.length}
            onAtualizar={(patch) => atualizarExercicio(exercicio.id, patch)}
            onAtualizarConfig={(tipo, patch) => atualizarConfigSerie(exercicio.id, tipo, patch)}
            onRemover={() => removerExercicio(exercicio.id)}
            onMover={(dir) => moverExercicio(exercicio.id, dir)}
          />
        ))}

        <button className="botao-secundario" onClick={adicionarExercicio}>
          + Adicionar exercício
        </button>
      </div>

      <div className="editor-template__rodape">
        <button className="botao-primario" disabled={!podeSalvar()} onClick={handleSalvar}>
          Salvar treino
        </button>
      </div>
    </div>
  );
}

interface BlocoExercicioProps {
  exercicio: ExercicioTemplate;
  posicao: number;
  total: number;
  onAtualizar: (patch: Partial<ExercicioTemplate>) => void;
  onAtualizarConfig: (tipo: TipoSerie, patch: Partial<ConfigSerie>) => void;
  onRemover: () => void;
  onMover: (direcao: -1 | 1) => void;
}

function BlocoExercicio({
  exercicio,
  posicao,
  total,
  onAtualizar,
  onAtualizarConfig,
  onRemover,
  onMover,
}: BlocoExercicioProps) {
  function mudarQuantidade(tipo: TipoSerie, config: ConfigSerie, novaQuantidade: number) {
    const quantidade = Math.max(0, novaQuantidade);
    const percentuaisAtuais = config.percentuais;
    let novosPercentuais: number[];
    if (quantidade > percentuaisAtuais.length) {
      // Adiciona séries novas repetindo o último percentual (ou 100 para válida)
      const valorPadrao =
        tipo === "valida" ? 100 : percentuaisAtuais[percentuaisAtuais.length - 1] ?? 75;
      novosPercentuais = [
        ...percentuaisAtuais,
        ...Array(quantidade - percentuaisAtuais.length).fill(valorPadrao),
      ];
    } else {
      novosPercentuais = percentuaisAtuais.slice(0, quantidade);
    }
    onAtualizarConfig(tipo, { percentuais: novosPercentuais });
  }

  function mudarPercentualDaSerie(tipo: TipoSerie, config: ConfigSerie, indice: number, valor: number) {
    const novosPercentuais = config.percentuais.map((p, i) => (i === indice ? valor : p));
    onAtualizarConfig(tipo, { percentuais: novosPercentuais });
  }

  return (
    <div className="bloco-exercicio">
      <div className="bloco-exercicio__topo">
        <input
          className="bloco-exercicio__nome"
          type="text"
          placeholder="Nome do exercício"
          value={exercicio.nome}
          onChange={(e) => onAtualizar({ nome: e.target.value })}
        />
        <div className="bloco-exercicio__acoes">
          <button
            className="botao-icone-pequeno"
            onClick={() => onMover(-1)}
            disabled={posicao === 0}
            aria-label="Mover para cima"
          >
            ↑
          </button>
          <button
            className="botao-icone-pequeno"
            onClick={() => onMover(1)}
            disabled={posicao === total - 1}
            aria-label="Mover para baixo"
          >
            ↓
          </button>
          <button className="botao-icone-pequeno botao-icone-pequeno--perigo" onClick={onRemover} aria-label="Remover exercício">
            ×
          </button>
        </div>
      </div>

      <label className="campo-faixa-reps">
        <span>Faixa de repetições alvo (séries válidas)</span>
        <div className="campo-faixa-reps__inputs">
          <input
            type="number"
            min={1}
            placeholder="mín"
            value={exercicio.repsMin ?? ""}
            onChange={(e) =>
              onAtualizar({ repsMin: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
          <span className="campo-faixa-reps__separador">a</span>
          <input
            type="number"
            min={1}
            placeholder="máx"
            value={exercicio.repsMax ?? ""}
            onChange={(e) =>
              onAtualizar({ repsMax: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
          <span className="campo-faixa-reps__unidade">reps</span>
        </div>
      </label>

      {TIPOS_SERIE.map((tipo) => {
        const config = exercicio.configSeries.find((c) => c.tipo === tipo);
        if (!config) return null;
        return (
          <div key={tipo} className={`bloco-config bloco-config--${tipo}`}>
            <div className="bloco-config__cabecalho">
              <span className="bloco-config__rotulo">{LABEL_TIPO_SERIE[tipo]}</span>
              <label className="bloco-config__quantidade">
                <span>Séries</span>
                <input
                  type="number"
                  min={0}
                  value={config.percentuais.length}
                  onChange={(e) => mudarQuantidade(tipo, config, Number(e.target.value))}
                />
              </label>
              <label className="bloco-config__descanso">
                <span>Descanso (s)</span>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={config.descansoSegundos}
                  onChange={(e) =>
                    onAtualizarConfig(tipo, {
                      descansoSegundos: Math.max(0, Number(e.target.value)),
                    })
                  }
                />
              </label>
            </div>

            {tipo !== "valida" && config.percentuais.length > 0 && (
              <div className="bloco-config__percentuais">
                {config.percentuais.map((percentual, i) => (
                  <label key={i} className="campo-percentual-serie">
                    <span>Série {i + 1}</span>
                    <div className="campo-percentual-serie__input">
                      <input
                        type="number"
                        min={0}
                        max={200}
                        value={percentual}
                        onChange={(e) =>
                          mudarPercentualDaSerie(tipo, config, i, Math.max(0, Number(e.target.value)))
                        }
                      />
                      <span>%</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
