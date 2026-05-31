# Generación de números aleatorios: ¿por qué cada distribución obtiene un `u` distinto?

Este documento explica **cómo darte cuenta** de que, cada vez que se ejecuta una
distribución, internamente se genera un número pseudoaleatorio `u` **distinto** —
y cómo comprobarlo vos mismo.

---

## 1. El motor: el generador avanza su estado en cada llamada

Todas las distribuciones se alimentan del **Método Congruencial Mixto (MCM)**
implementado en [`src/utils/pseudoRandom.js`](../src/utils/pseudoRandom.js).

La clave está en estas dos líneas de `next()`:

```js
state = (bigA * state + bigC) % bigM   // ① muta el estado interno
return Number(state) / m               // ② devuelve u ∈ [0, 1)
```

La línea ① **reescribe** `state` antes de devolver el valor. Es decir, el generador
no devuelve siempre lo mismo: cada llamada parte del estado que dejó la llamada
anterior y produce uno nuevo. Por eso dos `next()` consecutivos nunca coinciden
(dentro del período del generador, que con los parámetros por defecto es 2³² ≈ 4.300
millones de valores antes de repetirse).

> **Comprobado:** 100.000 llamadas seguidas a `next()` producen 100.000 valores
> distintos.

---

## 2. Las distribuciones reciben la *función*, no un valor

Mirá la firma de cualquier distribución, por ejemplo
[`distributionUniform.js`](../src/utils/distributionUniform.js):

```js
export function uniformRandom(nextU, a, b) {
  return a + (b - a) * nextU()   // ← invoca nextU() en el momento de usarlo
}
```

El primer parámetro `nextU` es **una función** (típicamente `() => gen.next()`), no
un número ya calculado. La distribución la **invoca** cada vez que necesita un `u`.
Como cada invocación avanza el estado del MCM (sección 1), cada `u` que entra a la
fórmula es nuevo.

Esto vale para todas:

| Distribución | Archivo | `u` que consume por llamada |
|---|---|---|
| Uniforme | `distributionUniform.js` | exactamente **1** |
| Exponencial | `distributionExponential.js` | **1** (reintenta solo si saliera `u = 0`) |
| Multinomial | `distributionMultinomial.js` | exactamente **1** |
| Poisson | `distributionPoisson.js` | **varios** (uno por iteración del `while`, mínimo 1) |

El caso de Poisson es el más ilustrativo: su algoritmo de Knuth llama a `nextU()`
*dentro de un bucle*, y cada iteración consume un `u` distinto:

```js
while (p > b) {
  p = p * nextU()   // ← un u nuevo en cada vuelta
  x = x + 1
}
```

---

## 3. El único caso en que se rompería

La garantía depende de pasar la **función**, no un valor congelado:

```js
// ✅ BIEN: un u nuevo cada vez que la distribución lo pide
uniformRandom(() => gen.next(), 20, 35)
poissonRandom(() => gen.next(), 3)

// ❌ MAL: u queda "congelado"; siempre se usa el mismo número
const u = gen.next()
poissonRandom(() => u, 3)   // además puede colgar: si u > e^-α el while no termina
```

En todo el simulador ([`plantSimulation.js`](../src/utils/plantSimulation.js)) se usa
siempre la forma correcta: se define una sola vez `const nextU = () => gen.next()` y
se la pasa a cada distribución.

---

## 4. Cómo comprobarlo vos mismo

Hay un script que lo demuestra envolviendo `next()` con un "espía" que registra
cada `u` consumido y verifica que **todos sean distintos**:

```bash
npm run verificar:u
```

(o directamente `node scripts/verificar-u.mjs`)

Ver [`scripts/verificar-u.mjs`](../scripts/verificar-u.mjs). La técnica es:

```js
function tracedNext(log) {
  return () => {
    const u = gen.next()
    log.push(u)   // anota cada u que la distribución pide
    return u
  }
}
```

Se le pasa `tracedNext(log)` a la distribución en lugar de `() => gen.next()`. Al
terminar, `log` contiene exactamente los `u` que se usaron internamente; si
`new Set(log).size === log.length`, no hubo ninguno repetido.

### Salida esperada (resumen)

```
▸ POISSON (α = 3) — consume varios u por llamada (uno por iteración)
  llamada 3: x=3 | 4 u consumidos | distintos: true
     u: 0.543156, 0.634904, 0.910030, 0.112462
...
¿TODOS distintos entre sí?  ✓ SÍ
```

---

## Resumen

1. El generador MCM **muta su estado** en cada llamada → nunca repite (dentro de su período).
2. Las distribuciones reciben la **función** `nextU` y la **invocan** cada vez que necesitan un `u`.
3. Por lo tanto, cada ejecución de una distribución consume uno o más `u` **nuevos**.
4. Lo podés verificar empíricamente con `npm run verificar:u`.
