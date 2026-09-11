import { useTimer } from "../../hooks/useTimer";
import { formatarTempo } from "../../utils/calculo";
import type { TipoSerie } from "../../types";
import "./OverlayCronometro.css";

interface Props {
  timer: ReturnType<typeof useTimer>;
  tipoSerie: TipoSerie;
  onFechar: () => void;
}

const COR_POR_TIPO: Record<TipoSerie, string> = {
  aquecimento: "var(--cor-aquecimento)",
  preparatoria: "var(--cor-preparatoria)",
  valida: "var(--cor-valida)",
};

export function OverlayCronometro({ timer, tipoSerie, onFechar }: Props) {
  const progresso =
    timer.segundosTotal > 0 ? 1 - timer.segundosRestantes / timer.segundosTotal : 0;
  const cor = COR_POR_TIPO[tipoSerie];

  return (
    <div className="overlay-cronometro">
      <button className="overlay-cronometro__fechar" onClick={onFechar} aria-label="Fechar cronômetro">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <p className="overlay-cronometro__legenda">Descanso</p>

      <div className="overlay-cronometro__anel" style={{ ["--cor-anel" as string]: cor, ["--progresso" as string]: progresso }}>
        <span className="overlay-cronometro__tempo numeros">
          {timer.finalizado ? `+${formatarTempo(timer.segundosExtras)}` : formatarTempo(timer.segundosRestantes)}
        </span>
      </div>

      {timer.finalizado && <p className="overlay-cronometro__aviso">Tempo esgotado! 🔔</p>}

      <div className="overlay-cronometro__controles">
        {timer.rodando ? (
          <button className="botao-cronometro" onClick={timer.pausar}>
            Pausar
          </button>
        ) : (
          <button className="botao-cronometro" onClick={timer.retomar}>
            Retomar
          </button>
        )}
        <button className="botao-cronometro botao-cronometro--fantasma" onClick={timer.reiniciar}>
          Reiniciar
        </button>
      </div>

      <button className="overlay-cronometro__concluir" onClick={onFechar}>
        Concluir descanso
      </button>
    </div>
  );
}
