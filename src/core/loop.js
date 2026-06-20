// Loop de simulação — tick FIXO (100ms) via setInterval.
// setInterval CONTINUA rodando com a aba em 2º plano (o navegador só afrouxa o
// intervalo p/ ~1s); o acumulador de tempo real recupera os passos perdidos
// (catch-up) sem drift. Para ausências longas o offline catch-up (CP-8) assume —
// por isso o teto MAX_CATCHUP.

const TICK_MS = 100;          // passo de simulação fixo
const DT = TICK_MS / 1000;    // dt em segundos
const MAX_CATCHUP = 100;      // máx. de passos por disparo (~10s) — além disso, offline (CP-8)

export function startLoop(onTick) {
  let last = performance.now();

  function step() {
    const now = performance.now();
    let elapsed = now - last;
    let steps = 0;
    while (elapsed >= TICK_MS && steps < MAX_CATCHUP) {
      onTick(DT);
      elapsed -= TICK_MS;
      last += TICK_MS;   // carrega o resto (<TICK_MS) p/ o próximo disparo, sem drift
      steps += 1;
    }
    if (steps >= MAX_CATCHUP) last = now; // descarta o excedente (evita espiral)
  }

  setInterval(step, TICK_MS);
}
