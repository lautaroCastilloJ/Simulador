# Documentación: Explicación de la Interfaz
<img width="1112" height="630" alt="image" src="https://github.com/user-attachments/assets/d97c292a-4782-4ba6-9513-7c638a5fa846" />
## Días = 30 (fijo)
  El horizonte de simulación es siempre 1 mes laboral. Está bloqueado a propósito porque el modelo matemático del trabajo está pensado para ese período. No se lo puede cambiar a menos que el cliente lo pida.

## α: cantidad de proyectores por día
  Es el ritmo de llegada de proyectores RAEE a la planta. Es el corazón de la simulación.
  - Internamente se usa como la media de una distribución de Poisson, o sea: "en promedio llegan α equipos por día, pero algunos días llegan más y otros menos".
  - Valor por defecto: 3. Si lo subís a 6, estás simulando una planta con el doble de demanda → más trabajo, más tiempo acumulado.
  - Uno lo puede interpretar como ¿qué tan saturada está la recepción?

## Umbral capacidad (horas/mes)
  El cliente maneja cuántas horas de trabajo necesitará en el mes que quiere pronosticar, para no pagar horas extra por anticipado o simplemente para delegar esas horas en otras tareas.
  - Por defecto: 100 horas.
  - Al final, el simulador compara el tiempo total que llevó procesar todo contra este umbral. Si lo supera → te avisa que hay que reubicar operarios o cambiar la estrategia. Si no → la planta opera tranquila.

## Semilla n₀ (seed)
  Es la "semilla" del generador de números aleatorios. Acá está la clave de la reproducibilidad:
  - Si dejás un número fijo (ej: 12345), cada vez que simulás obtenés exactamente el mismo resultado. Ideal para mostrar, comparar o defender el trabajo.
  - El botón ↺ al lado vacía el campo → entonces usa la hora actual (Date.now()) como semilla, dándote un resultado distinto cada vez (como una "tirada nueva").
  - Pensalo como: ¿quiero el mismo escenario reproducible, o una corrida nueva al azar?

## Parámetros MCM 
  Son los tres números (a, c, m) del Método Congruencial Mixto, que es el algoritmo que genera los números pseudoaleatorios sobre los que se construye todo lo demás (distribuciones de probabilidad). 
  Vienen con valores estándar probados.
  - No hace falta tocarlos para usar el simulador normalmente. Están ahí por transparencia académica para mostrar que los aleatorios no son una "caja negra".
  - Si cargás valores inválidos (ej: a ≥ m), la interfaz te marca el error en rojo y bloquea el botón.

## Validación y el botón Simular

  - Mientras escribís, la interfaz valida en vivo. Si algún campo queda inconsistente (vacío, negativo, fuera de rango), se pinta de rojo, aparece el mensaje del error y el botón Simular se deshabilita.
  - Cuando todo está OK, apretás Simular y aparece debajo el bloque de resultados.

  Básicamente, el flujo típico es dejar los valores por defecto (o ajustás α y el umbral según el escenario que quieras probar), tener en cuenta que antes de presionar Simular siempre se debe cambiar la semilla 
  para obtener resultados diferentes y poder hacer un promedio luego de una cantidad de iteraciones.

