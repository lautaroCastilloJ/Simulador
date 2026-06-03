# Documentación: Explicación de la Interfaz
<img width="1112" height="630" alt="image" src="https://github.com/user-attachments/assets/d97c292a-4782-4ba6-9513-7c638a5fa846" />

## Días = 30 (fijo)
  El horizonte de simulación es siempre 1 mes laboral. Está bloqueado a propósito porque el modelo matemático del trabajo está pensado para ese período. No se lo puede cambiar a menos que el cliente lo pida.

## α: cantidad de proyectores por día
  Es el ritmo de llegada de proyectores RAEE a la planta. Es el corazón de la simulación.
  - Internamente se usa como la media de una distribución de Poisson, o sea: "en promedio llegan α equipos por día, pero algunos días llegan más y otros menos".
  - Valor por defecto: 3. Si lo subís a 6, estás simulando una planta con el doble de demanda → más trabajo, más tiempo acumulado.
  - Uno lo puede interpretar como ¿qué tan saturada está la recepción?
<img width="576" height="77" alt="image" src="https://github.com/user-attachments/assets/47c5cd86-02dd-4a37-88b6-49cab13a1767" />


## Umbral capacidad (horas/mes)
  El cliente maneja cuántas horas de trabajo necesitará en el mes que quiere pronosticar, para no pagar horas extra por anticipado o simplemente para delegar esas horas en otras tareas.
  - Por defecto: 100 horas.
  - Al final, el simulador compara el tiempo total que llevó procesar todo contra este umbral. Si lo supera → te avisa que hay que reubicar operarios o cambiar la estrategia. Si no → la planta opera tranquila.
<img width="616" height="85" alt="image" src="https://github.com/user-attachments/assets/1b33afd3-4b9d-4b28-8a4a-1ee8af53beff" />


## Semilla n₀ (seed)
  Es la "semilla" del generador de números aleatorios. Acá está la clave de la reproducibilidad:
  - Si dejás un número fijo (ej: 12345), cada vez que simulás obtenés exactamente el mismo resultado. Ideal para mostrar, comparar o defender el trabajo.
  - El botón ↺ al lado vacía el campo → entonces usa la hora actual (Date.now()) como semilla, dándote un resultado distinto cada vez (como una "tirada nueva").
  - Pensalo como: ¿quiero el mismo escenario reproducible, o una corrida nueva al azar?
<img width="719" height="87" alt="image" src="https://github.com/user-attachments/assets/6b1eb0e8-e78e-427b-88b6-0df3886cd9d9" />


## Parámetros MCM 
  Son los tres números (a, c, m) del Método Congruencial Mixto, que es el algoritmo que genera los números pseudoaleatorios sobre los que se construye todo lo demás (distribuciones de probabilidad). 
  Vienen con valores estándar probados.
  - No hace falta tocarlos para usar el simulador normalmente. Están ahí por transparencia académica para mostrar que los aleatorios no son una "caja negra".
  - Si cargás valores inválidos (ej: a ≥ m), la interfaz te marca el error en rojo y bloquea el botón.
<img width="803" height="285" alt="image" src="https://github.com/user-attachments/assets/db8fcf3a-178a-403a-adf6-ed777da200a0" />



## Validación y el botón Simular

  - Mientras escribís, la interfaz valida en vivo. Si algún campo queda inconsistente (vacío, negativo, fuera de rango), se pinta de rojo, aparece el mensaje del error y el botón Simular se deshabilita.
  - Cuando todo está OK, apretás Simular y aparece debajo el bloque de resultados.
<img width="1076" height="121" alt="image" src="https://github.com/user-attachments/assets/db2d4ce5-607e-4ca9-898c-7257d884fc5e" />


  Básicamente, el flujo típico es dejar los valores por defecto (o ajustás α y el umbral según el escenario que quieras probar), tener en cuenta que antes de presionar Simular siempre se debe cambiar la semilla 
  para obtener resultados diferentes y poder hacer un promedio luego de una cantidad de iteraciones.

