// DOM Elements
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

// Function to toggle boundary input visibility
function toggleBoundaryInputs(boundary) {
    const type = document.getElementById(`${boundary}BoundaryType`).value;
    document.getElementById(`${boundary}Constant`).classList.toggle('hidden', type === 'linear');
    document.getElementById(`${boundary}Linear`).classList.toggle('hidden', type === 'constant');
}

// Initialize boundary input visibility on load
document.addEventListener('DOMContentLoaded', () => {
    toggleBoundaryInputs('top');
    toggleBoundaryInputs('bottom');
    toggleBoundaryInputs('left');
    toggleBoundaryInputs('right');
    // Run initial calculation with default values
    calculateLaplace();
});


// Core Laplace Solver
function calculateLaplace() {
    statusMessage.textContent = "Calculando...";
    statusMessage.style.backgroundColor = '#e7f3ff';
    statusMessage.style.color = '#0056b3';

    const N = parseInt(gridSizeInput.value); // Grid size (N x N)
    const maxIterations = parseInt(maxIterationsInput.value);
    const tolerance = parseFloat(toleranceInput.value);

    // Validate inputs
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

    // Initialize potential grid
    let V = Array(N).fill(0).map(() => Array(N).fill(0));
    let V_new = Array(N).fill(0).map(() => Array(N).fill(0)); // Used for swapping

    // Function to apply boundary conditions
    function applyBoundaryConditions(grid) {
        // Top Boundary (V(x,b))
        const topType = topBoundaryType.value;
        if (topType === 'constant') {
            const val = parseFloat(document.getElementById('topV').value);
            for (let j = 0; j < N; j++) grid[0][j] = val;
        } else { // Linear
            const start = parseFloat(document.getElementById('topVStart').value);
            const end = parseFloat(document.getElementById('topVEnd').value);
            for (let j = 0; j < N; j++) {
                grid[0][j] = start + (end - start) * (j / (N - 1));
            }
        }

        // Bottom Boundary (V(x,0))
        const bottomType = bottomBoundaryType.value;
        if (bottomType === 'constant') {
            const val = parseFloat(document.getElementById('bottomV').value);
            for (let j = 0; j < N; j++) grid[N - 1][j] = val;
        } else { // Linear
            const start = parseFloat(document.getElementById('bottomVStart').value);
            const end = parseFloat(document.getElementById('bottomVEnd').value);
            for (let j = 0; j < N; j++) {
                grid[N - 1][j] = start + (end - start) * (j / (N - 1));
            }
        }

        // Left Boundary (V(0,y))
        const leftType = leftBoundaryType.value;
        if (leftType === 'constant') {
            const val = parseFloat(document.getElementById('leftV').value);
            for (let i = 1; i < N - 1; i++) grid[i][0] = val; // Exclude corners
        } else { // Linear
            const start = parseFloat(document.getElementById('leftVStart').value);
            const end = parseFloat(document.getElementById('leftVEnd').value);
            for (let i = 1; i < N - 1; i++) { // Exclude corners
                grid[i][0] = start + (end - start) * (i / (N - 1));
            }
        }

        // Right Boundary (V(a,y))
        const rightType = rightBoundaryType.value;
        if (rightType === 'constant') {
            const val = parseFloat(document.getElementById('rightV').value);
            for (let i = 1; i < N - 1; i++) grid[i][N - 1] = val; // Exclude corners
        } else { // Linear
            const start = parseFloat(document.getElementById('rightVStart').value);
            const end = parseFloat(document.getElementById('rightVEnd').value);
            for (let i = 1; i < N - 1; i++) { // Exclude corners
                grid[i][N - 1] = start + (end - start) * (i / (N - 1));
            }
        }
    }

    // Apply boundary conditions initially
    applyBoundaryConditions(V);

    let iteration = 0;
    let maxDiff = Infinity;

    while (iteration < maxIterations && maxDiff > tolerance) {
        maxDiff = 0;

        // Copy V to V_new, and apply boundaries to V_new to ensure they aren't overwritten by internal calculations
        for(let i = 0; i < N; i++) {
            for(let j = 0; j < N; j++) {
                V_new[i][j] = V[i][j];
            }
        }
        applyBoundaryConditions(V_new); // Re-apply to ensure boundaries are fixed.

        // Iterate over internal points (1 to N-2 for 0-indexed array)
        for (let i = 1; i < N - 1; i++) {
            for (let j = 1; j < N - 1; j++) {
                const newValue = 0.25 * (
                    V[i + 1][j] + V[i - 1][j] + // Neighbors in x
                    V[i][j + 1] + V[i][j - 1]   // Neighbors in y
                );
                const diff = Math.abs(newValue - V[i][j]);
                if (diff > maxDiff) {
                    maxDiff = diff;
                }
                V_new[i][j] = newValue;
            }
        }

        // Swap grids for the next iteration
        let temp = V;
        V = V_new;
        V_new = temp; // V_new now holds the old V, ready to be overwritten

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
}

// Function to draw the equipotential lines and heatmap
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

    // Draw Heatmap
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            const potential = potentialGrid[i][j];
            const normalizedPotential = (potential - minV) / (maxV - minV);

            // Interpolate color from a gradient (blue to red)
            const r = Math.floor(255 * normalizedPotential);
            const b = Math.floor(255 * (1 - normalizedPotential));
            ctx.fillStyle = `rgb(${r}, 0, ${b})`;
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }

    // Draw Equipotential Lines
    // Determine contour levels. Let's aim for 10-15 lines.
    const numLevels = 15;
    const levelStep = (maxV - minV) / (numLevels + 1);
    const contourLevels = [];
    for (let i = 1; i <= numLevels; i++) {
        contourLevels.push(minV + i * levelStep);
    }

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.font = `${Math.max(10, cellSize * 0.5)}px Arial`; // Dynamic font size for labels
    ctx.fillStyle = 'white'; // Label color

    contourLevels.forEach(level => {
        // Simple Marching Squares-like approach to find line segments
        for (let i = 0; i < N - 1; i++) {
            for (let j = 0; j < N - 1; j++) {
                // Get potentials at the four corners of the current cell
                const p1 = potentialGrid[i][j];     // Top-left
                const p2 = potentialGrid[i][j+1];   // Top-right
                const p3 = potentialGrid[i+1][j+1]; // Bottom-right
                const p4 = potentialGrid[i+1][j];   // Bottom-left

                
                let cellCase = 0;
                if (p1 > level) cellCase |= 1; // 0001
                if (p2 > level) cellCase |= 2; // 0010
                if (p3 > level) cellCase |= 4; // 0100
                if (p4 > level) cellCase |= 8; // 1000

              
                let crossings = [];

                
                function interpolate(val1, val2, coord1, coord2, target) {
                    if (val1 === val2) return (coord1 + coord2) / 2; // Avoid division by zero
                    return coord1 + (coord2 - coord1) * (target - val1) / (val2 - val1);
                }

                
                ctx.beginPath();
                switch (cellCase) {
                    case 1: // P1 is above, others below
                    case 14: // P1 is below, others above
                        ctx.moveTo(j * cellSize, interpolate(p1, p4, 0, cellSize, level) + i * cellSize); // Left edge
                        ctx.lineTo(interpolate(p1, p2, 0, cellSize, level) + j * cellSize, i * cellSize); // Top edge
                        break;
                    case 2: // P2 above
                    case 13: // P2 below
                        ctx.moveTo(interpolate(p1, p2, 0, cellSize, level) + j * cellSize, i * cellSize); // Top edge
                        ctx.lineTo((j + 1) * cellSize, interpolate(p2, p3, 0, cellSize, level) + i * cellSize); // Right edge
                        break;
                    case 4: // P3 above
                    case 11: // P3 below
                        ctx.moveTo((j + 1) * cellSize, interpolate(p2, p3, 0, cellSize, level) + i * cellSize); // Right edge
                        ctx.lineTo(interpolate(p4, p3, 0, cellSize, level) + j * cellSize, (i + 1) * cellSize); // Bottom edge
                        break;
                    case 8: // P4 above
                    case 7: // P4 below
                        ctx.moveTo(interpolate(p4, p3, 0, cellSize, level) + j * cellSize, (i + 1) * cellSize); // Bottom edge
                        ctx.lineTo(j * cellSize, interpolate(p1, p4, 0, cellSize, level) + i * cellSize); // Left edge
                        break;
                    case 3: // P1, P2 above
                    case 12: // P1, P2 below
                        ctx.moveTo(j * cellSize, interpolate(p1, p4, 0, cellSize, level) + i * cellSize); // Left
                        ctx.lineTo((j + 1) * cellSize, interpolate(p2, p3, 0, cellSize, level) + i * cellSize); // Right
                        break;
                    case 5: // P1, P3 above
                    case 10: // P1, P3 below
                        ctx.moveTo(interpolate(p1, p2, 0, cellSize, level) + j * cellSize, i * cellSize); // Top
                        ctx.lineTo(interpolate(p4, p3, 0, cellSize, level) + j * cellSize, (i + 1) * cellSize); // Bottom
                        break;
                    case 6: // P2, P3 above
                    case 9: // P2, P3 below
                        ctx.moveTo(j * cellSize, interpolate(p1, p4, 0, cellSize, level) + i * cellSize); // Left
                        ctx.lineTo(interpolate(p4, p3, 0, cellSize, level) + j * cellSize, (i + 1) * cellSize); // Bottom
                        break;
                }
                ctx.stroke();

               
            }
        }
    });

   
    ctx.strokeStyle = '#95a5a6'; // Light gray
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



calculateButton.addEventListener('click', calculateLaplace);


topBoundaryType.addEventListener('change', () => toggleBoundaryInputs('top'));
bottomBoundaryType.addEventListener('change', () => toggleBoundaryInputs('bottom'));
leftBoundaryType.addEventListener('change', () => toggleBoundaryInputs('left'));
rightBoundaryType.addEventListener('change', () => toggleBoundaryInputs('right'));
