import { useCallback, useEffect, useRef, useState } from "react";

// Toca um "bipe" usando Web Audio API — não depende de nenhum arquivo de áudio externo.
function tocarBipe() {
  try {
    const AudioContextCls =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextCls();

    const tocarNota = (tempoInicio: number, frequencia: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequencia;
      gain.gain.setValueAtTime(0.0001, tempoInicio);
      gain.gain.exponentialRampToValueAtTime(0.3, tempoInicio + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, tempoInicio + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(tempoInicio);
      osc.stop(tempoInicio + 0.4);
    };

    const agora = ctx.currentTime;
    tocarNota(agora, 880);
    tocarNota(agora + 0.45, 880);
    tocarNota(agora + 0.9, 1046.5);

    setTimeout(() => ctx.close(), 1500);
  } catch (e) {
    console.error("Não foi possível tocar o som do cronômetro:", e);
  }
}

function vibrar() {
  if ("vibrate" in navigator) {
    navigator.vibrate([300, 150, 300, 150, 500]);
  }
}

interface UseTimerResult {
  segundosRestantes: number;
  segundosTotal: number;
  rodando: boolean;
  finalizado: boolean;
  segundosExtras: number;
  iniciar: (segundos: number) => void;
  pausar: () => void;
  retomar: () => void;
  reiniciar: () => void;
  cancelar: () => void;
}

export function useTimer(): UseTimerResult {
  const [segundosTotal, setSegundosTotal] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [rodando, setRodando] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [segundosExtras, setSegundosExtras] = useState(0);
  const alarmeDisparado = useRef(false);

  useEffect(() => {
    if (!rodando) return;

    const intervalo = setInterval(() => {
      setSegundosRestantes((atual) => {
        if (atual <= 1) {
          if (!alarmeDisparado.current) {
            alarmeDisparado.current = true;
            tocarBipe();
            vibrar();
            setFinalizado(true);
          }
          setSegundosExtras((e) => e + 1);
          return 0;
        }
        return atual - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [rodando]);

  const iniciar = useCallback((segundos: number) => {
    setSegundosTotal(segundos);
    setSegundosRestantes(segundos);
    setFinalizado(false);
    setSegundosExtras(0);
    alarmeDisparado.current = false;
    setRodando(true);
  }, []);

  const pausar = useCallback(() => setRodando(false), []);
  const retomar = useCallback(() => {
    if (segundosTotal > 0) setRodando(true);
  }, [segundosTotal]);

  const reiniciar = useCallback(() => {
    setSegundosRestantes(segundosTotal);
    setFinalizado(false);
    setSegundosExtras(0);
    alarmeDisparado.current = false;
    setRodando(true);
  }, [segundosTotal]);

  const cancelar = useCallback(() => {
    setRodando(false);
    setSegundosTotal(0);
    setSegundosRestantes(0);
    setFinalizado(false);
    setSegundosExtras(0);
    alarmeDisparado.current = false;
  }, []);

  return {
    segundosRestantes,
    segundosTotal,
    rodando,
    finalizado,
    segundosExtras,
    iniciar,
    pausar,
    retomar,
    reiniciar,
    cancelar,
  };
}
