import "./BarraNavegacao.css";

export type Aba = "home" | "historico";

interface Props {
  abaAtiva: Aba;
  onMudarAba: (aba: Aba) => void;
  desabilitada?: boolean;
}

export function BarraNavegacao({ abaAtiva, onMudarAba, desabilitada }: Props) {
  return (
    <nav className="barra-nav">
      <button
        className={`barra-nav__item ${abaAtiva === "home" ? "barra-nav__item--ativo" : ""}`}
        onClick={() => onMudarAba("home")}
        disabled={desabilitada}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Treinos</span>
      </button>
      <button
        className={`barra-nav__item ${abaAtiva === "historico" ? "barra-nav__item--ativo" : ""}`}
        onClick={() => onMudarAba("historico")}
        disabled={desabilitada}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 19V10M11 19V5M18 19v-7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <span>Histórico</span>
      </button>
    </nav>
  );
}
