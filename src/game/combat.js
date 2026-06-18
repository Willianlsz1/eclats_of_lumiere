// STUB de casca visual (sem lógica) — reset "folha em branco" 2026-06-18.
// O motor de combate/navegação foi removido. subareaUnlockLevel devolve um nível de
// amostra; as ações de navegação/onda são no-op (a cena fica estática).

export const subareaUnlockLevel = (_map, n) => (n <= 1 ? 0 : (n - 1) * 50);

export const resetPack     = () => {};
export const changeSubarea = () => {};
export const enterSubarea  = () => {};
export const travelToMap   = () => false;
