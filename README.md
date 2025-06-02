#1 simulador-ecuacion-laplace
Simulador interactivo de la Ecuación de Laplace usando el método de Diferencias Finitas.
**Explicación del Código**
**La Función calculateLaplace()**
La función calculateLaplace() es el cerebro central de este simulador. Es la encargada de orquestar todo el proceso: desde la obtención de los parámetros definidos por el usuario, la aplicación de las condiciones de frontera, hasta la ejecución del algoritmo numérico para resolver la Ecuación de Laplace y finalmente, la visualización de los resultados.

Este núcleo del simulador implementa el Método de Diferencias Finitas mediante un proceso iterativo de "relajación".

#2**1. Preparación y Validación de Parámetros**
Al inicio, la función se encarga de configurar el entorno y asegurar que los datos de entrada sean válidos:

*Mensaje de Estado Inicial:*
Se actualiza el mensaje de estado en la interfaz para indicar que el cálculo está en progreso.
```statusMessage.textContent = "Calculando...";
statusMessage.style.backgroundColor = '#e7f3ff';
statusMessage.style.color = '#0056b3';
```
*Obtención de Parámetros:*
Se recuperan los valores definidos por el usuario para el tamaño de la malla (N), el número máximo de iteraciones (maxIterations) y la tolerancia de convergencia (tolerance) desde los elementos HTML.

```const N = parseInt(gridSizeInput.value);
const maxIterations = parseInt(maxIterationsInput.value);
const tolerance = parseFloat(toleranceInput.value);
```
*Validación de Entradas:*
Se realizan comprobaciones para asegurar que los parámetros ingresados sean números válidos y estén dentro de rangos aceptables. Si alguna validación falla, se muestra un mensaje de error claro en la interfaz y la función se detiene.



```if (isNaN(N) || N < 5 || N > 100) { /* ... error ... */ return; }
if (isNaN(maxIterations) || maxIterations < 100) { /* ... error ... */ return; }
if (isNaN(tolerance) || tolerance <= 0) { /* ... error ... */ return; }
```

#2**2. Inicialización de la Cuadrícula (Malla)**
Creación de Matrices de Potencial:
Se inicializan dos matrices 2D, V y V_new, ambas de tamaño N×N. Estas matrices representarán la cuadrícula de puntos en la que se calculará el potencial:

V: Almacena los valores de potencial de la iteración actual.
V_new: Se utiliza para almacenar los valores de potencial calculados para la siguiente iteración.


```let V = Array(N).fill(0).map(() => Array(N).fill(0));
let V_new = Array(N).fill(0).map(() => Array(N).fill(0));
```

#2**3. Aplicación de las Condiciones de Frontera (applyBoundaryConditions)**
Esta función auxiliar es vital para definir el problema. La Ecuación de Laplace requiere que el potencial sea conocido en los límites de la región.

Funcionalidad:

La función applyBoundaryConditions(grid) lee las configuraciones de los cuatro bordes de la interfaz de usuario.
Para cada borde (Superior, Inferior, Izquierdo, Derecho), aplica el potencial según el tipo seleccionado:
Constante: Asigna un valor fijo a todos los puntos de ese borde.
Lineal: Calcula un potencial que varía gradualmente entre un valor de inicio y un valor final a lo largo del borde, utilizando interpolación lineal.
Manejo de Esquinas: Es importante destacar que los puntos de las esquinas se definen por los bordes superior e inferior primero, y luego los bordes izquierdo y derecho se aplican solo a los puntos intermedios para evitar sobrescribir las esquinas ya establecidas.
Uso en el Proceso:

Se llama a applyBoundaryConditions(V); al inicio para establecer la configuración inicial del campo de potencial.
Se llama a applyBoundaryConditions(V_new); dentro de cada iteración del bucle principal para asegurar que los valores de potencial en los bordes permanezcan fijos y no se vean afectados por el proceso de relajación que actualiza los puntos internos.
#2**4. El Proceso Iterativo de Relajación (El Núcleo del Solucionador)**
Este es el corazón del algoritmo numérico. La Ecuación de Laplace implica que, en un estado de equilibrio, el potencial en cualquier punto es el promedio de sus vecinos. El proceso de relajación busca alcanzar este equilibrio de forma iterativa.

Bucle Principal (while):
El cálculo se realiza dentro de un bucle while que continúa ejecutándose hasta que se cumple una de las dos condiciones de parada:

El número de iteration alcanza el maxIterations predefinido (para evitar bucles infinitos).
La maxDiff (máxima diferencia de potencial entre una iteración y la siguiente) cae por debajo de la tolerance (indicando que la solución ha convergido y no cambia significativamente).


```let iteration = 0;
let maxDiff = Infinity;

while (iteration < maxIterations && maxDiff > tolerance) {
    maxDiff = 0; // Se reinicia en cada iteración
    // ... (código de copia y cálculo) ...
    iteration++;
}
```
Copia de Datos para la Iteración:
Al comienzo de cada iteración, los valores de la cuadrícula actual (V) se copian a V_new. Esto es crucial para que los cálculos de esta iteración utilicen los valores de potencial del paso anterior, no los que ya están siendo actualizados en la misma iteración. Luego, se vuelven a aplicar las applyBoundaryConditions a V_new para reafirmar los valores de los bordes.


```for(let i = 0; i < N; i++) {
    for(let j = 0; j < N; j++) {
        V_new[i][j] = V[i][j];
    }
}
applyBoundaryConditions(V_new);
```

Actualización de Puntos Internos:
Dentro del bucle principal, se recorren todos los puntos internos de la malla (excluyendo los bordes, que ya están fijos por las condiciones de frontera).

Fórmula de Diferencias Finitas: Para cada punto (i, j), el nuevo valor de potencial (newValue) se calcula como el promedio de los valores de potencial de sus cuatro vecinos adyacentes (arriba, abajo, izquierda, derecha) de la cuadrícula V de la iteración anterior. Esta es la esencia de la relajación.

```const newValue = 0.25 * (
    V[i + 1][j] + V[i - 1][j] + // Vecinos en dirección X
    V[i][j + 1] + V[i][j - 1]   // Vecinos en dirección Y
);
```
Cálculo de la Diferencia Máxima: Se calcula la diferencia absoluta entre el newValue y el valor anterior de V[i][j]. Si esta diferencia es mayor que el maxDiff actual para la iteración, maxDiff se actualiza. Esto nos permite rastrear el cambio más grande que ocurrió en cualquier punto de la cuadrícula durante esta iteración, que es nuestro criterio para la convergencia.


```const diff = Math.abs(newValue - V[i][j]);
if (diff > maxDiff) {
    maxDiff = diff;
}
V_new[i][j] = newValue; // El nuevo valor se guarda en la cuadrícula de la siguiente iteración.
```

Intercambio de Cuadrículas:
Al finalizar cada iteración, las matrices V y V_new se intercambian. Esto significa que los valores recién calculados en V_new se convierten en la base (V) para la siguiente iteración. Este proceso asegura que el cálculo siempre avanza con los datos más actualizados.


```let temp = V;
V = V_new;
V_new = temp;
```
#2**5. Resultados y Visualización**
Una vez que el bucle de iteración termina (ya sea por convergencia o por alcanzar el máximo de iteraciones), la función informa al usuario el resultado del cálculo y procede a la visualización:

Mensaje de Estado Final:
Se actualiza el mensaje en la interfaz (statusMessage) indicando si la solución ha convergido y en cuántas iteraciones, o si se alcanzó el límite de iteraciones.



```if (maxDiff <= tolerance) { /* ... mensaje de convergencia ... */ }
else { /* ... mensaje de máximo de iteraciones ... */ }
```
Llamadas a Funciones de Visualización:
Finalmente, la función calculateLaplace() invoca a las funciones drawEquipotentials() y draw3DPlot(), pasando la potentialGrid (V) ya resuelta y el tamaño de la malla (N). Estas funciones se encargarán de renderizar los resultados en 2D (mapa de calor y líneas de contorno) y 3D (superficie de potencial interactiva).



```drawEquipotentials(V, N);
draw3DPlot(V, N);
```

