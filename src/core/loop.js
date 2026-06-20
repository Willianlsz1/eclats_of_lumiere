// Loop de simulação — tick FIXO (100ms) + render por frame (CP-1).
// Acumula o tempo real e roda passos fixos; teto de catch-up evita travar
// após uma aba ficar em 2º plano por muito tempo.

const TICK_MS = 100;          // passo de simulação fixo
const DT = TICK_MS / 1000;    // dt em segundos
const MAX_CATCHUP = 50;       // máx. de passos por frame (ausências longas)

export function startLoop(onTick) {
  let last = performance.now();
  let acc = 0;

  function frame(now) {
    acc += now - last;
    last = now;
    let steps = 0;
    while (acc >= TICK_MS && steps < MAX_CATCHUP) {
      onTick(DT);
      acc -= TICK_MS;
      steps += 1;
    }
    if (steps >= MAX_CATCHUP) acc = 0; // descarta o excedente (evita espiral)
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
