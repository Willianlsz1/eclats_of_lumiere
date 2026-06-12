// Game loop: tick fixo de 100ms com acumulador.
// O setInterval dispara perto de 100ms, mas o tempo real manda: o acumulador
// converte o tempo decorrido em N ticks fixos, mantendo a simulação determinística.

import { TICK_SECONDS, MAX_CATCHUP_TICKS } from '../data/constants.js';

export function startLoop(tickFn) {
  let last = performance.now();
  let accumulator = 0;

  setInterval(() => {
    const now = performance.now();
    accumulator += (now - last) / 1000;
    last = now;

    let ticks = 0;
    while (accumulator >= TICK_SECONDS && ticks < MAX_CATCHUP_TICKS) {
      tickFn(TICK_SECONDS);
      accumulator -= TICK_SECONDS;
      ticks++;
    }
    // Aba em background por muito tempo: descarta o excedente.
    // Ausências longas são cobertas pelo progresso offline (§15) no reload.
    if (ticks >= MAX_CATCHUP_TICKS) accumulator = 0;
  }, TICK_SECONDS * 1000);
}
