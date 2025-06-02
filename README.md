# simulador-ecuacion-laplace
Simulador interactivo de la Ecuación de Laplace usando el método de Diferencias Finitas.
Explicación del Código: La Función calculateLaplace()
La función calculateLaplace() es el cerebro central de este simulador. Es la encargada de orquestar todo el proceso: desde la obtención de los parámetros definidos por el usuario, la aplicación de las condiciones de frontera, hasta la ejecución del algoritmo numérico para resolver la Ecuación de Laplace y finalmente, la visualización de los resultados.

Este núcleo del simulador implementa el Método de Diferencias Finitas mediante un proceso iterativo de "relajación".

1. Preparación y Validación de Parámetros
Al inicio, la función se encarga de configurar el entorno y asegurar que los datos de entrada sean válidos:

Mensaje de Estado Inicial:
Se actualiza el mensaje de estado en la interfaz para indicar que el cálculo está en progreso.
```statusMessage.textContent = "Calculando...";
statusMessage.style.backgroundColor = '#e7f3ff';
statusMessage.style.color = '#0056b3'; ´´´ 
