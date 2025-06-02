// DOM Elements existentes
const gridSizeInput = document.getElementById('gridSize');
const maxIterationsInput = document.getElementById('maxIterations');
const toleranceInput = document.getElementById('tolerance');
const calculateButton = document.getElementById('calculateButton');
const statusMessage = document.getElementById('statusMessage');
const laplaceCanvas = document.getElementById('laplaceCanvas');
const ctx = laplaceCanvas.getContext('2d');
const minPotentialLabel = document.getElementById('minPotentialLabel');
const maxPotentialLabel = document.getElementById('maxPotentialLabel');

// Boundary Type Selectors
const topBoundaryType = document.getElementById('topBoundaryType');
const bottomBoundaryType = document.getElementById('bottomBoundaryType');
const leftBoundaryType = document.getElementById('leftBoundaryType');
const rightBoundaryType = document.getElementById('rightBoundaryType');

// Boundary Input Containers
const topConstant = document.getElementById('topConstant');
const topLinear = document.getElementById('topLinear');
const bottomConstant = document.getElementById('bottomConstant');
const bottomLinear = document.getElementById('bottomLinear');
const leftConstant = document.getElementById('leftConstant');
const leftLinear = document.getElementById('leftLinear');
const rightConstant = document.getElementById('rightConstant');
const rightLinear = document.getElementById('rightLinear');

// Función para alternar la visibilidad de las entradas de frontera
function toggleBoundaryInputs(boundary) {
    const type = document.getElementById(`${boundary}BoundaryType`).value;
    document.getElementById(`${boundary}Constant`).classList.toggle('hidden', type === 'linear');
    document.getElementById(`${boundary}Linear`).classList.toggle('hidden', type === 'constant');
}

// Inicializar la visibilidad de las entradas de frontera al cargar
document.addEventListener('DOMContentLoaded', () => {
    toggleBoundaryInputs('top');
    toggleBoundaryInputs('bottom');
    toggleBoundaryInputs('left');
    toggleBoundaryInputs('right');
    // Ejecutar cálculo inicial con valores por defecto
    calculateLaplace();
});

// Core Laplace Solver
function calculateLaplace() {
    statusMessage.textContent = "Calculando...";
    statusMessage.style.backgroundColor = '#e7f3ff';
    statusMessage.style.color = '#0056b3';

    const N = parseInt(gridSizeInput.value); // Tamaño de la malla (N x N)
    const maxIterations = parseInt(maxIterationsInput.value);
    const tolerance = parseFloat(toleranceInput.value);

    // Validar entradas
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

    // Inicializar la cuadrícula de potencial
    let V = Array(N).fill(0).map(() => Array(N).fill(0));
    let V_new = Array(N).fill(0).map(() => Array(N).fill(0)); // Usado para el intercambio

    // Función para aplicar condiciones de frontera
    function applyBoundaryConditions(grid) {
        // Borde Superior (V(x,b))
        const topType = topBoundaryType.value;
        if (topType === 'constant') {
            const val = parseFloat(document.getElementById('topV').value);
            for (let j = 0; j < N; j++) grid[0][j] = val;
        } else { // Lineal
            const start = parseFloat(document.getElementById('topVStart').value);
            const end = parseFloat(document.getElementById('topVEnd').value);
            for (let j = 0; j < N; j++) {
                grid[0][j] = start + (end - start) * (j / (N - 1));
            }
        }

        // Borde Inferior (V(x,0))
        const bottomType = bottomBoundaryType.value;
        if (bottomType === 'constant') {
            const val = parseFloat(document.getElementById('bottomV').value);
            for (let j = 0; j < N; j++) grid[N - 1][j] = val;
        } else { // Lineal
            const start = parseFloat(document.getElementById('bottomVStart').value);
            const end = parseFloat(document.getElementById('bottomVEnd').value);
            for (let j = 0; j < N; j++) {
                grid[N - 1][j] = start + (end - start) * (j / (N - 1));
            }
        }

        // Borde Izquierdo (V(0,y))
        const leftType = leftBoundaryType.value;
        if (leftType === 'constant') {
            const val = parseFloat(document.getElementById('leftV').value);
            for (let i = 1; i < N - 1; i++) grid[i][0] = val; // Excluir esquinas
        } else { // Lineal
            const start = parseFloat(document.getElementById('leftVStart').value);
            const end = parseFloat(document.getElementById('leftVEnd').value);
            for (let i = 1; i < N - 1; i++) { // Excluir esquinas
                grid[i][0] = start + (end - start) * (i / (N - 1));
            }
        }

        // Borde Derecho (V(a,y))
        const rightType = rightBoundaryType.value;
        if (rightType === 'constant') {
            const val = parseFloat(document.getElementById('rightV').value);
            for (let i = 1; i < N - 1; i++) grid[i][N - 1] = val; // Excluir esquinas
        } else { // Lineal
            const start = parseFloat(document.getElementById('rightVStart').value);
            const end = parseFloat(document.getElementById('rightVEnd').value);
            for (let i = 1; i < N - 1; i++) { // Excluir esquinas
                grid[i][N - 1] = start + (end - start) * (i / (N - 1));
            }
        }
    }

    // Aplicar condiciones de frontera inicialmente
    applyBoundaryConditions(V);

    let iteration = 0;
    let maxDiff = Infinity;

    while (iteration < maxIterations && maxDiff > tolerance) {
        maxDiff = 0;

        // Copiar V a V_new y aplicar límites para asegurar que no se sobrescriban
        for(let i = 0; i < N; i++) {
            for(let j = 0; j < N; j++) {
                V_new[i][j] = V[i][j];
            }
        }
        applyBoundaryConditions(V_new); // Volver a aplicar para asegurar que los límites estén fijos.

        // Iterar sobre los puntos internos (1 a N-2 para arrays 0-indexed)
        for (let i = 1; i < N - 1; i++) {
            for (let j = 1; j < N - 1; j++) {
                const newValue = 0.25 * (
                    V[i + 1][j] + V[i - 1][j] + // Vecinos en x
                    V[i][j + 1] + V[i][j - 1]   // Vecinos en y
                );
                const diff = Math.abs(newValue - V[i][j]);
                if (diff > maxDiff) {
                    maxDiff = diff;
                }
                V_new[i][j] = newValue;
            }
        }

        // Intercambiar cuadrículas para la siguiente iteración
        let temp = V;
        V = V_new;
        V_new = temp;

        iteration++;
    }

    if (maxDiff <= tolerance) {
        statusMessage.textContent = `¡Convergencia alcanzada en ${iteration} iteraciones! Diferencia máxima: ${maxDiff.toExponential(2)}`;
        statusMessage.style.backgroundColor = '#e6ffe6';
        statusMessage.style.color = '#006600';
    } else {
        statusMessage.textContent = `Máximo de ${maxIterations} iteraciones alcanzado. Diferencia máxima: ${maxDiff.toExponential(2)}`;
        statusMessage.style.backgroundColor = '#fffbe6';
        statusMessage.style.color = '#996600';
    }

    drawEquipotentials(V, N);
    //Llama a la función para dibujar el gráfico 3D
    draw3DPlot(V, N);
}

// Función para dibujar las líneas equipotenciales 
function drawEquipotentials(potentialGrid, N) {
    const canvasSize = laplaceCanvas.width; // 500px
    const cellSize = canvasSize / N;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    let minV = potentialGrid[0][0];
    let maxV = potentialGrid[0][0];
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (potentialGrid[i][j] < minV) minV = potentialGrid[i][j];
            if (potentialGrid[i][j] > maxV) maxV = potentialGrid[i][j];
        }
    }

    minPotentialLabel.textContent = `${minV.toFixed(2)} V`;
    maxPotentialLabel.textContent = `${maxV.toFixed(2)} V`;

    // Dibujar Mapa de Calor
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            const potential = potentialGrid[i][j];
            const normalizedPotential = (potential - minV) / (maxV - minV);

            
            const r = Math.floor(255 * normalizedPotential);
            const b = Math.floor(255 * (1 - normalizedPotential));
            ctx.fillStyle = `rgb(${r}, 0, ${b})`;
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }

    // Dibujar Líneas Equipotenciales
    const numLevels = 15; // Número de líneas de contorno a dibujar
    const levels = [];
    const step = (maxV - minV) / (numLevels + 1);
    for (let i = 1; i <= numLevels; i++) {
        levels.push(minV + i * step);
    }

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.font = `${Math.max(10, cellSize * 0.5)}px Arial`; // Tamaño de fuente dinámico para etiquetas
    ctx.fillStyle = 'white'; // Color de etiqueta

    levels.forEach(level => {
        // Implementación simplificada de Marching Squares para dibujar segmentos de línea
        for (let i = 0; i < N - 1; i++) {
            for (let j = 0; j < N - 1; j++) {
                const p1 = potentialGrid[i][j];     // Superior-izquierda
                const p2 = potentialGrid[i][j+1];   // Superior-derecha
                const p3 = potentialGrid[i+1][j+1]; // Inferior-derecha
                const p4 = potentialGrid[i+1][j];   // Inferior-izquierda

                let cellCase = 0;
                if (p1 > level) cellCase |= 1;
                if (p2 > level) cellCase |= 2;
                if (p3 > level) cellCase |= 4;
                if (p4 > level) cellCase |= 8;

                function interpolate(val1, val2, coord1, coord2, target) {
                    if (val1 === val2) return (coord1 + coord2) / 2;
                    return coord1 + (coord2 - coord1) * (target - val1) / (val2 - val1);
                }

                ctx.beginPath();
                switch (cellCase) {
                    // Aquí se dibujan los segmentos de línea basados en el "caso" de Marching Squares
                
                    case 1: case 14:
                        ctx.moveTo(j * cellSize, interpolate(p1, p4, 0, cellSize, level) + i * cellSize);
                        ctx.lineTo(interpolate(p1, p2, 0, cellSize, level) + j * cellSize, i * cellSize);
                        break;
                    case 2: case 13:
                        ctx.moveTo(interpolate(p1, p2, 0, cellSize, level) + j * cellSize, i * cellSize);
                        ctx.lineTo((j + 1) * cellSize, interpolate(p2, p3, 0, cellSize, level) + i * cellSize);
                        break;
                    case 4: case 11:
                        ctx.moveTo((j + 1) * cellSize, interpolate(p2, p3, 0, cellSize, level) + i * cellSize);
                        ctx.lineTo(interpolate(p4, p3, 0, cellSize, level) + j * cellSize, (i + 1) * cellSize);
                        break;
                    case 8: case 7:
                        ctx.moveTo(interpolate(p4, p3, 0, cellSize, level) + j * cellSize, (i + 1) * cellSize);
                        ctx.lineTo(j * cellSize, interpolate(p1, p4, 0, cellSize, level) + i * cellSize);
                        break;
                    case 3: case 12: // P1, P2 arriba (o abajo)
                        ctx.moveTo(j * cellSize, interpolate(p1, p4, 0, cellSize, level) + i * cellSize);
                        ctx.lineTo((j + 1) * cellSize, interpolate(p2, p3, 0, cellSize, level) + i * cellSize);
                        break;
                    case 5: case 10: // P1, P3 arriba (o abajo)
                        ctx.moveTo(interpolate(p1, p2, 0, cellSize, level) + j * cellSize, i * cellSize);
                        ctx.lineTo(interpolate(p4, p3, 0, cellSize, level) + j * cellSize, (i + 1) * cellSize);
                        break;
                    case 6: case 9: // P2, P3 arriba (o abajo)
                        ctx.moveTo(j * cellSize, interpolate(p1, p4, 0, cellSize, level) + i * cellSize);
                        ctx.lineTo(interpolate(p4, p3, 0, cellSize, level) + j * cellSize, (i + 1) * cellSize);
                        break;
                }
                ctx.stroke();
            }
        }
    });

    // Dibujar líneas de la cuadrícula en la parte superior (opcional)
    ctx.strokeStyle = '#95a5a6'; // Gris claro
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= N; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvasSize, i * cellSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvasSize);
        ctx.stroke();
    }
}


// Función para dibujar el gráfico 3D usando Plotly.js
function draw3DPlot(potentialGrid, N) {
    const zData = potentialGrid;

    // Crea arrays para las coordenadas X e Y
    // Plotly esperará que X e Y sean arrays 1D que definan las coordenadas
    // para las columnas y filas de matriz Z, respectivamente.
    const xCoords = Array.from({ length: N }, (_, i) => i); // Del 0 a N-1
    const yCoords = Array.from({ length: N }, (_, i) => (N - 1) - i); // Del N-1 a 0 (para que el origen (0,0) esté en la parte inferior izquierda en el gráfico)


    const data = [{
        z: zData,
        x: xCoords,
        y: yCoords,
        type: 'surface',
        colorbar: {
            title: 'Potencial (V)',
            titleside: 'right',
            titlefont: { size: 14, color: '#333' },
            tickfont: { size: 10, color: '#333' }
        },
        // Puedes cambiar la escala de colores: 'Viridis', 'Jet', 'Portland', 'Greys', 'Electric'
        colorscale: 'Viridis'
    }];

    const layout = {
        title: {
            text: 'Distribución de Potencial (3D)',
            font: { size: 18, color: '#2980b9' }
        },
        scene: {
            xaxis: {
                title: 'Posición X',
                autorange: true,
                showgrid: true,
                zeroline: true,
                gridcolor: '#e0e0e0',
                titlefont: { size: 12, color: '#555' }
            },
            yaxis: {
                title: 'Posición Y',
                autorange: true,
                showgrid: true,
                zeroline: true,
                gridcolor: '#e0e0e0',
                titlefont: { size: 12, color: '#555' }
            },
            zaxis: {
                title: 'Potencial (V)',
                autorange: true,
                showgrid: true,
                zeroline: true,
                gridcolor: '#e0e0e0',
                titlefont: { size: 12, color: '#555' }
            },
            // Configura la cámara para una vista inicial si lo deseas
            // camera: {
            //     eye: { x: 1.25, y: 1.25, z: 1.25 }
            // }
        },
        margin: {
            l: 0, r: 0, b: 0, t: 30 // Reduce márgenes para aprovechar espacio
        },
        hovermode: 'closest' // Mejor experiencia al pasar el mouse
    };

    // Renderiza el gráfico en el div con id 'laplace3DPlot'
    Plotly.newPlot('laplace3DPlot', data, layout, { responsive: true, displayModeBar: true });
}


//  botón de calcular
calculateButton.addEventListener('click', calculateLaplace);

// los cambios en el tipo de frontera
topBoundaryType.addEventListener('change', () => toggleBoundaryInputs('top'));
bottomBoundaryType.addEventListener('change', () => toggleBoundaryInputs('bottom'));
leftBoundaryType.addEventListener('change', () => toggleBoundaryInputs('left'));
rightBoundaryType.addEventListener('change', () => toggleBoundaryInputs('right'));
