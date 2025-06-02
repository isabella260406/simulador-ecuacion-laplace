# simulador-ecuacion-laplace
Simulador interactivo de la Ecuación de Laplace usando el método de Diferencias Finitas.
//function calculateLaplace() {
    // 1. Mensaje de Estado Inicial
    statusMessage.textContent = "Calculando...";
    statusMessage.style.backgroundColor = '#e7f3ff';
    statusMessage.style.color = '#0056b3';

    // 2. Obtención y Parsing de Parámetros de Usuario
    const N = parseInt(gridSizeInput.value); // Tamaño de la malla (N x N puntos)
    const maxIterations = parseInt(maxIterationsInput.value); // Límite de iteraciones
    const tolerance = parseFloat(toleranceInput.value); // Umbral de convergencia

    // 3. Validación de Entradas
    // Se verifica que los parámetros ingresados por el usuario sean válidos y estén dentro de rangos razonables.
    // Si algún valor no es válido, se muestra un mensaje de error y la función termina.
    if (isNaN(N) || N < 5 || N > 100) {
        statusMessage.textContent = "Error: El tamaño de la malla debe ser entre 5 y 100.";
        statusMessage.style.backgroundColor = '#ffe7e7';
        statusMessage.style.color = '#cc0000';
        return;
    }
    if (isNaN(maxIterations) || maxIterations < 100) {
        statusMessage.textContent = "Error: El máximo de iteraciones debe ser al menos 100.";
        statusMessage.style.backgroundColor = '#ffe7e7';
        statusMessage.style.color = '#cc0000';
        return;
    }
    if (isNaN(tolerance) || tolerance <= 0) {
        statusMessage.textContent = "Error: La tolerancia debe ser un número positivo.";
        statusMessage.style.backgroundColor = '#ffe7e7';
        statusMessage.style.color = '#cc0000';
        return;
    }

    // 4. Inicialización de la Cuadrícula de Potencial
    // Se crean dos matrices 2D (cuadrículas) de tamaño N x N:
    // - 'V': Almacena los valores de potencial de la iteración actual.
    // - 'V_new': Se utiliza para calcular los nuevos valores de potencial en la siguiente iteración.
    let V = Array(N).fill(0).map(() => Array(N).fill(0));
    let V_new = Array(N).fill(0).map(() => Array(N).fill(0));

    // 5. Función Anidada: applyBoundaryConditions(grid)
    // Esta función auxiliar es crucial para establecer los valores de potencial en los límites de la región.
    // Se llama tanto al inicio como en cada iteración para asegurar que los bordes se mantengan fijos.
    function applyBoundaryConditions(grid) {
        // Para cada uno de los cuatro bordes (Superior, Inferior, Izquierdo, Derecho):
        // Se lee el tipo de condición (constante o lineal) y los valores correspondientes.
        // - Si es 'constant': Todos los puntos del borde reciben el mismo valor fijo.
        // - Si es 'linear': Los puntos del borde reciben un valor que varía linealmente
        //   entre un valor inicial y uno final, interpolando a lo largo del borde.
        //   Por ejemplo, para el borde superior: grid[0][j] = start + (end - start) * (j / (N - 1));
        //   Nótese que para los bordes izquierdo y derecho, se excluyen las esquinas (i=1 a N-2)
        //   ya que estas son definidas por los bordes superior e inferior.
        // ... (código detallado para cada borde) ...
    }

    // 6. Aplicación Inicial de las Condiciones de Frontera
    // Los valores de potencial en los bordes de la cuadrícula 'V' se establecen antes de comenzar las iteraciones.
    applyBoundaryConditions(V);

    // 7. Proceso Iterativo de Relajación (Método de Diferencias Finitas)
    // Este bucle 'while' es el corazón del algoritmo numérico.
    // Continúa ejecutándose hasta que se cumple una de las condiciones de parada:
    // - 'iteration' alcanza 'maxIterations'.
    // - 'maxDiff' (la máxima diferencia entre los valores de potencial de dos iteraciones consecutivas)
    //   cae por debajo de la 'tolerance' especificada.
    let iteration = 0;
    let maxDiff = Infinity; // Se inicializa con infinito para asegurar que el bucle se ejecute al menos una vez.

    while (iteration < maxIterations && maxDiff > tolerance) {
        maxDiff = 0; // Se reinicia 'maxDiff' en cada iteración.

        // a. Copiar y Fijar Bordes para la Siguiente Iteración
        // Los valores de la cuadrícula actual 'V' se copian a 'V_new'.
        // Luego, las condiciones de frontera se vuelven a aplicar a 'V_new'.
        // Esto es crucial para que los valores de los bordes permanezcan inalterados
        // durante el cálculo de los puntos internos en esta iteración.
        for(let i = 0; i < N; i++) {
            for(let j = 0; j < N; j++) {
                V_new[i][j] = V[i][j];
            }
        }
        applyBoundaryConditions(V_new);

        // b. Actualización de Puntos Internos
        // Se recorren todos los puntos internos de la cuadrícula (desde la fila 1 hasta N-2 y columna 1 hasta N-2).
        // Los puntos de los bordes (fila 0, N-1 y columna 0, N-1) no se actualizan aquí,
        // ya que sus valores están fijos por las condiciones de frontera.
        for (let i = 1; i < N - 1; i++) {
            for (let j = 1; j < N - 1; j++) {
                // Se calcula el nuevo valor de potencial para el punto (i, j)
                // como el promedio de sus cuatro vecinos adyacentes (arriba, abajo, izquierda, derecha).
                // Esta es la aproximación por diferencias finitas de la Ecuación de Laplace:
                // V_nuevo(i,j) = 1/4 * ( V(i+1,j) + V(i-1,j) + V(i,j+1) + V(i,j-1) )
                const newValue = 0.25 * (
                    V[i + 1][j] + V[i - 1][j] + // Vecinos en dirección X
                    V[i][j + 1] + V[i][j - 1]   // Vecinos en dirección Y
                );

                // Se calcula la diferencia absoluta entre el nuevo valor y el valor anterior del punto.
                const diff = Math.abs(newValue - V[i][j]);
                // Se actualiza 'maxDiff' si esta diferencia es la más grande encontrada hasta ahora en la iteración.
                if (diff > maxDiff) {
                    maxDiff = diff;
                }
                // El nuevo valor calculado se almacena en la cuadrícula de la siguiente iteración, 'V_new'.
                V_new[i][j] = newValue;
            }
        }

        // c. Intercambio de Cuadrículas
        // Al final de cada iteración, las cuadrículas 'V' y 'V_new' se intercambian.
        // Esto significa que los valores recién calculados en 'V_new' se convierten en los valores 'V'
        // para la siguiente iteración, asegurando que el proceso se base en los datos más recientes.
        let temp = V;
        V = V_new;
        V_new = temp;

        iteration++; // Se incrementa el contador de iteraciones.
    }

    // 8. Mensaje de Estado Final
    // Una vez que el bucle termina (ya sea por convergencia o por alcanzar el máximo de iteraciones),
    // se muestra un mensaje informativo al usuario con el resultado del cálculo.
    if (maxDiff <= tolerance) {
        statusMessage.textContent = `¡Convergencia alcanzada en ${iteration} iteraciones! Diferencia máxima: ${maxDiff.toExponential(2)}`;
        statusMessage.style.backgroundColor = '#e6ffe6';
        statusMessage.style.color = '#006600'; // Éxito
    } else {
        statusMessage.textContent = `Máximo de ${maxIterations} iteraciones alcanzado. Diferencia máxima: ${maxDiff.toExponential(2)}`;
        statusMessage.style.backgroundColor = '#fffbe6';
        statusMessage.style.color = '#996600'; // Advertencia
    }

    // 9. Visualización de Resultados
    // Finalmente, se llaman a las funciones de visualización para renderizar los resultados:
    // - 'drawEquipotentials(V, N)': Dibuja el mapa de calor 2D y las líneas equipotenciales.
    // - 'draw3DPlot(V, N)': Genera el gráfico interactivo de superficie 3D de la distribución de potencial.
    drawEquipotentials(V, N);
    draw3DPlot(V, N);
}
