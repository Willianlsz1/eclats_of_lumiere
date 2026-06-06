// Runner de testes mínimo — sem dependências.
// É só isto: uma função `test` que roda outra função e conta se passou ou falhou.
let passed = 0, failed = 0;
const failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log("  ✅ " + name); }
  catch (e) { failed++; failures.push(name + " — " + e.message); console.log("  ❌ " + name + " — " + e.message); }
}

// Lança um erro se a condição for falsa. Os outros asserts usam este por baixo.
function assert(cond, msg) { if (!cond) throw new Error(msg || "assert falhou"); }

// Compara igualdade exata (===). Bom para inteiros, strings, booleans.
function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error((msg || "esperado") + ` ${expected}, recebido ${actual}`);
}

// Para números com casas decimais (floats), comparar com tolerância — nunca use === com float.
function assertClose(actual, expected, tol, msg) {
  tol = tol == null ? 1e-6 : tol;
  if (Math.abs(actual - expected) > tol) throw new Error((msg || "esperado ~") + `${expected}, recebido ${actual}`);
}

// Imprime o resumo no fim. Se algo falhou, marca a saída do processo como erro (exit code 1).
function report() {
  console.log(`\n${passed} passaram, ${failed} falharam.`);
  if (failed > 0) { process.exitCode = 1; }
}

module.exports = { test, assert, assertEqual, assertClose, report };
