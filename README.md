# Documentación: Explicación de la Interfaz
<img width="1363" height="628" alt="image" src="https://github.com/user-attachments/assets/72bc5e6b-c167-4337-9ac5-64ea5fa2e181" />

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

Cuando usted aprieta Simular, el modelo procesa los 30 días equipo por equipo y abajo aparece el bloque de resultados.

## 1. Las tarjetas de indicadores
<img width="1056" height="174" alt="image" src="https://github.com/user-attachments/assets/8043aed6-55f3-46c2-b22c-ca4f3aba2d63" />
🕒 Tiempo total de revisión — el indicador estrella
  Es la suma de todo el tiempo de trabajo del mes: triaje + servicio de todos los proyectores que llegaron.
  - Se muestra en horas (el número grande) y abajo en minutos (el dato fino).
  - Este es el valor que se compara contra tu umbral de capacidad. Cuanto más alto, más cargada estuvo la planta.

  ♻️  Mercurio recuperado
  Masa de mercurio recuperada en el mes. Solo lo generan los equipos que cayeron en la ruta Descontaminación (cada uno aporta entre 100 y 300 unidades × 70% de tasa de recuperación).

  🔩 Materiales recuperados
  Masa de plásticos/metales recuperada, y solo viene de la ruta Desensamblaje (800–1200 unidades × 35%).

  📦 Proyectores procesados
  Cuántos equipos llegaron y se procesaron en total en los 30 días. Es la suma de todas las llegadas diarias. Como las llegadas son aleatorias (Poisson), este número cambia entre corridas si no fijás semilla.

  Las dos tarjetas verdes (Triaje acumulado / Servicio acumulado)
  Son el desglose del "Tiempo total de revisión". Te muestran de dónde vino ese tiempo:
  - Triaje acumulado: la inspección inicial que reciben todos los equipos (20–35 min cada uno).
  - Servicio acumulado: el tiempo del tratamiento específico según la ruta.
  - Si los sumás (triaje + servicio), te da el tiempo total de revisión. Sirven para ver si la planta se "come" el tiempo en la inspección o en el procesamiento.

  ▎ 💡 Truco de lectura: si "Triaje acumulado" pesa mucho frente a "Servicio", significa que llegan muchos equipos pero con tratamientos cortos; si pesa más el servicio, hay pocos equipos pero con rutas lentas (típicamente Reacondicionamiento, que es la más larga).

## 2. El cartel de decisión
<img width="1030" height="177" alt="image" src="https://github.com/user-attachments/assets/67e718dd-6a6f-44f0-81d6-32f8c277abbc" />
Es la conclusión gerencial automática, lo más importante para el trabajo. Cambia de color según el resultado:

  - 🟢 Verde — "Dentro de la capacidad operativa": el tiempo total fue ≤ el umbral. La planta puede seguir operando con el mismo método.
  - 🔴 Rojo — "Supera el umbral de capacidad": el tiempo total superó el umbral. Recomendación: reubicar operarios o cambiar la estrategia para descongestionar.

  Adentro te muestra la comparación exacta: X h > / ≤ Y h (y entre paréntesis los mismos valores en minutos). O sea, te transparenta por qué tomó esa decisión. Este cartel es la respuesta directa a la pregunta del problema: ¿la planta da abasto o no?

## 3. Derivación por ruta
<img width="568" height="263" alt="image" src="https://github.com/user-attachments/assets/2123dc7a-6f77-452b-b100-519a6f667593" />

Ruta es el destino del equipo (Reacondicionamiento, Desensamblaje, Descontaminación, Almacenamiento)
Equipos es la cantidad que cayó en esa ruta (resultado simulado)
% es el conteo como porcentaje del total 
Probabilidad Teórica es la probabilidad que dice el modelo (35%, 40%, 10%, 15%)

  ▎ 💡 Cómo leerla: compará la columna % (lo que pasó) contra Prob. teórica (lo que debería pasar). Si están parecidas, la simulación es coherente. Las diferencias son normales por azar y se achican cuanto más proyectores haya procesado (ley de los grandes números). Esta tabla es tu prueba de que la clasificación multinomial funciona bien.

## 4. Llegadas por día
<img width="1059" height="279" alt="image" src="https://github.com/user-attachments/assets/74a96e5c-7806-463f-8153-25fbcca7f69d" />

Cada barra = un día del mes (1 al 30), y su altura = cuántos proyectores llegaron ese día.
  - Sirve para ver la variabilidad de la demanda: vas a notar días picos y días flojos, aunque el promedio sea α. Eso es justamente el comportamiento Poisson (no llega un número constante todos los días).
  - Si pasás el mouse por una barra, el tooltip te muestra el detalle: Día X: N proyectores · T min.
  - Al lado del título aparece la semilla usada — útil para anotarla y poder reproducir exactamente esa misma corrida después.

## ¿Cómo leer todo junto?

  1. Mirá el cartel de decisión → ¿la planta da abasto este mes? (la respuesta).
  2. Mirá el tiempo total y su desglose (triaje vs servicio) → ¿por qué da ese resultado?
  3. Revisá la tabla de rutas → ¿la distribución de trabajo fue la esperada?
  4. Mirá el histograma → ¿hubo días pico que explican la carga?

Para experimentar: suba alfa (α) o baje el umbral horario y vuelva a simular para ver cómo la planta pasa de verde a rojo. Si desea comparar dos escenarios con justicia, deje la misma semilla en ambos así la única variable que cambia es la que usted tocó.











