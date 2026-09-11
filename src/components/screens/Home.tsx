import type { Template } from "../../types";
import "./Home.css";

interface Props {
  templates: Template[];
  onIniciarTreino: (template: Template) => void;
  onCriarTemplate: () => void;
  onEditarTemplate: (template: Template) => void;
}

export function Home({ templates, onIniciarTreino, onCriarTemplate, onEditarTemplate }: Props) {
  return (
    <div className="tela-home">
      <header className="tela-home__cabecalho">
        <h1>Seus treinos</h1>
        <p className="tela-home__subtitulo">Escolha um treino para começar</p>
      </header>

      {templates.length === 0 ? (
        <div className="tela-home__vazio">
          <p>Você ainda não criou nenhum treino.</p>
          <p className="tela-home__vazio-dica">
            Crie um template com seus exercícios, séries e percentuais de carga.
          </p>
        </div>
      ) : (
        <ul className="tela-home__lista">
          {templates.map((template) => (
            <li key={template.id} className="cartao-template">
              <button
                className="cartao-template__principal"
                onClick={() => onIniciarTreino(template)}
              >
                <span className="cartao-template__nome">{template.nome}</span>
                <span className="cartao-template__meta">
                  {template.exercicios.length}{" "}
                  {template.exercicios.length === 1 ? "exercício" : "exercícios"}
                </span>
              </button>
              <button
                className="cartao-template__editar"
                onClick={() => onEditarTemplate(template)}
                aria-label={`Editar ${template.nome}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button className="botao-flutuante" onClick={onCriarTemplate}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Novo treino
      </button>
    </div>
  );
}
