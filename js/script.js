document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const mainContainer = document.getElementById('main-container');
    const circulo = document.getElementById('btn-circulo');
    const btnIniciar = document.getElementById('btn-iniciar');
    const modalInicio = document.getElementById('modal-inicio-juego');
    const modalFin = document.getElementById('modal-fin-juego');
    const modalFinContenido = document.getElementById('modal-fin-juego-contenido');
    const temporizadorElement = document.getElementById('temporizador');
    const aciertosElement = document.getElementById('conteo-aciertos');
    const fallosExteriorElement = document.getElementById('conteo-fallos-exterior');
    const conteoFallosInterno = document.getElementById('conteo-fallos');

    // Elementos de las 3 columnas
    const explicacionColumna = document.getElementById('explicacion-columna');
    const novedadesColumna = document.getElementById('novedades-columna');
    const controlMovilContainer = document.getElementById('control-movil-container');

    // --- ESTADO DEL JUEGO ---
    let juegoActivo = false;
    let aciertos = 0;
    let fallos = 0;
    let tiemposReaccion = [];
    let tiempoEsperado;
    let temporizadorJuego;
    let tiempoRestante = 60;
    let timeoutID;
    
    // --- PARÁMETROS DE DIFICULTAD (ADAPTACIÓN SIN PENALIZACIÓN) ---
    const esMovil = window.matchMedia("(max-width: 768px)").matches;
    
    // Tiempos ajustados: Escritorio tiene un rango ligeramente mayor.
    const TIEMPO_ESPERA_MIN = esMovil ? 500 : 750;
    const TIEMPO_ESPERA_MAX = esMovil ? 1500 : 2000;
    
    const TAMANO_CIRCULO_PX = esMovil ? 60 : 80;
    const LIMITE_REACCION_EXTREMA = 90; // ms

    // --- FUNCIONES DE UTILIDAD ---
    
    function mostrarElemento(elemento) {
        elemento.classList.remove('oculto');
    }

    function ocultarElemento(elemento) {
        elemento.classList.add('oculto');
    }

    function obtenerTiempoEsperaRandom() {
        return Math.floor(Math.random() * (TIEMPO_ESPERA_MAX - TIEMPO_ESPERA_MIN + 1)) + TIEMPO_ESPERA_MIN;
    }
    
    // --- LÓGICA DE COLUMNAS (MÓVIL) ---
    
    function crearBotonesMovil() {
        if (!esMovil) return;

        controlMovilContainer.innerHTML = `
            <button id="btn-abrir-explicacion" class="btn-control-movil">Cómo Jugar</button>
            <button id="btn-abrir-novedades" class="btn-control-movil">Novedades</button>
        `;
        mostrarElemento(controlMovilContainer);

        document.getElementById('btn-abrir-explicacion').addEventListener('click', () => abrirColumna(explicacionColumna));
        document.getElementById('btn-abrir-novedades').addEventListener('click', () => abrirColumna(novedadesColumna));
        
        explicacionColumna.querySelector('.btn-cerrar-columna').addEventListener('click', () => cerrarColumna(explicacionColumna));
        novedadesColumna.querySelector('.btn-cerrar-columna').addEventListener('click', () => cerrarColumna(novedadesColumna));
        
        // Muestra los botones de cerrar en el layout responsivo
        mostrarElemento(explicacionColumna.querySelector('.btn-cerrar-columna'));
        mostrarElemento(novedadesColumna.querySelector('.btn-cerrar-columna'));
    }

    function abrirColumna(columna) {
        mostrarElemento(columna);
    }
    
    function cerrarColumna(columna) {
        ocultarElemento(columna);
    }

    // --- LÓGICA DEL CÍRCULO ---
    
    function colocarCirculo() {
        circulo.style.width = `${TAMANO_CIRCULO_PX}px`;
        circulo.style.height = `${TAMANO_CIRCULO_PX}px`;
        
        const mainRect = mainContainer.getBoundingClientRect();
        const maxX = window.innerWidth - TAMANO_CIRCULO_PX;
        const maxY = window.innerHeight - TAMANO_CIRCULO_PX;

        const x = Math.floor(Math.random() * maxX);
        const y = Math.floor(Math.random() * maxY);
        
        // El círculo usa position: fixed, por lo que las coordenadas son relativas al viewport
        circulo.style.left = `${x}px`;
        circulo.style.top = `${y}px`;

        ocultarElemento(circulo);
        
        const tiempoEspera = obtenerTiempoEsperaRandom();
        
        timeoutID = setTimeout(() => {
            mostrarElemento(circulo);
            tiempoEsperado = performance.now(); 
        }, tiempoEspera);
    }
    
    // --- LÓGICA DE REACCIÓN Y ESTADO ---

    function manejarAcierto() {
        if (!juegoActivo || circulo.classList.contains('oculto')) return;

        const tiempoReaccion = performance.now() - tiempoEsperado;
        tiemposReaccion.push(tiempoReaccion);
        
        aciertos++;
        aciertosElement.textContent = `Aciertos: ${aciertos}`;

        const trPromedio = tiemposReaccion.reduce((a, b) => a + b, 0) / tiemposReaccion.length;

        ocultarElemento(circulo);
        clearTimeout(timeoutID);
        
        if (trPromedio < LIMITE_REACCION_EXTREMA && tiemposReaccion.length > 5) {
            terminarJuego(true, trPromedio);
            return;
        }

        colocarCirculo();
    }

    function manejarFallo() {
        if (!juegoActivo || !circulo.classList.contains('oculto')) {
             // Si el juego está activo pero el círculo ya apareció (click tardío), no es fallo en fondo.
             if (juegoActivo && !circulo.classList.contains('oculto')) {
                // Si el círculo está visible, el click no cuenta como fallo en fondo.
                return;
             }
        }
        
        fallos++;
        fallosExteriorElement.textContent = `Fallos: ${fallos}`;
        
        // Muestra el indicador de fallo brevemente
        mostrarElemento(conteoFallosInterno);
        setTimeout(() => ocultarElemento(conteoFallosInterno), 500);

        clearTimeout(timeoutID);
        colocarCirculo();
    }
    
    // --- LÓGICA DE TIEMPO Y FIN DE JUEGO ---

    function iniciarTemporizadorJuego() {
        temporizadorJuego = setInterval(() => {
            tiempoRestante--;
            temporizadorElement.textContent = `Tiempo: 00:${tiempoRestante.toString().padStart(2, '0')}`;
            
            if (tiempoRestante <= 0) {
                clearInterval(temporizadorJuego);
                terminarJuego(false);
            }
        }, 1000);
    }
    
    function terminarJuego(porReaccionExtrema, trPromedioExtrema = 0) {
        juegoActivo = false;
        clearInterval(temporizadorJuego);
        clearTimeout(timeoutID);
        ocultarElemento(circulo);
        
        const totalIntentos = aciertos + fallos;
        const trPromedio = porReaccionExtrema ? trPromedioExtrema : (tiemposReaccion.length > 0 ? tiemposReaccion.reduce((a, b) => a + b, 0) / tiemposReaccion.length : 0);
        const tiempoJuego = 60 - tiempoRestante;
        const aciertosPorMinuto = aciertos / tiempoJuego * 60;

        let contenidoHTML = `
            <h2>Juego Terminado</h2>
            ${porReaccionExtrema ? `<p style="color: var(--color-acento)">¡TR EXTREMA! Juego detenido en ${tiempoJuego}s.</p>` : ''}
            <p>Dispositivo: <span class="final-score-badge badge-reaccion">${esMovil ? 'Móvil' : 'Escritorio'}</span></p>
            <p>TR Promedio: <span class="final-score-badge badge-reaccion">${trPromedio.toFixed(2)} ms</span></p>
            <p>Aciertos Totales: <span class="final-score-badge badge-acierto">${aciertos}</span></p>
            <p>Fallos en Fondo: <span class="final-score-badge badge-fallo">${fallos}</span></p>
            <p>Aciertos/min: <span class="final-score-badge badge-acierto">${aciertosPorMinuto.toFixed(1)}</span></p>
            <button id="btn-reiniciar">Reiniciar</button>
        `;
        
        modalFinContenido.innerHTML = contenidoHTML;
        mostrarElemento(modalFin);
        
        document.getElementById('btn-reiniciar').addEventListener('click', reiniciarJuego);
    }

    function reiniciarJuego() {
        // Resetear estado
        juegoActivo = false;
        aciertos = 0;
        fallos = 0;
        tiemposReaccion = [];
        tiempoRestante = 60;
        
        // Resetear contadores visuales
        temporizadorElement.textContent = 'Tiempo: 00:60';
        aciertosElement.textContent = 'Aciertos: 0';
        fallosExteriorElement.textContent = 'Fallos: 0';
        
        // Ocultar contadores y modal de fin
        ocultarElemento(temporizadorElement);
        ocultarElemento(aciertosElement);
        ocultarElemento(fallosExteriorElement);
        ocultarElemento(modalFin);
        
        // Mostrar modal de inicio
        mostrarElemento(modalInicio);
    }
    
    function iniciarJuego() {
        // Ocultar modal de inicio
        ocultarElemento(modalInicio);
        
        // Mostrar contadores
        mostrarElemento(temporizadorElement);
        mostrarElemento(aciertosElement);
        mostrarElemento(fallosExteriorElement);

        // Configuración inicial del juego
        juegoActivo = true;
        iniciarTemporizadorJuego();
        colocarCirculo();
    }

    // --- INICIALIZACIÓN ---
    if (esMovil) {
        crearBotonesMovil();
    }
    
    btnIniciar.addEventListener('click', iniciarJuego);
    circulo.addEventListener('click', manejarAcierto);
    // Usamos el cuerpo (body) para detectar clics en el fondo
    document.body.addEventListener('click', manejarFallo);
    
    // Asegurarse de que el clic en los elementos interactivos no se propague al body (para evitar fallos accidentales)
    circulo.addEventListener('click', (e) => e.stopPropagation());
    btnIniciar.addEventListener('click', (e) => e.stopPropagation());
    modalFin.addEventListener('click', (e) => e.stopPropagation());
    modalInicio.addEventListener('click', (e) => {
        // Solo permite que los clicks en el grid o botones pasen, bloquea el fondo del modal si es necesario, 
        // pero la estructura actual de 3 columnas ya maneja esto. 
        // Solo necesitamos que el botón de iniciar funcione.
        if (e.target.id === 'btn-iniciar') return;
        if (e.target.closest('#grid-inicio')) return;
        e.stopPropagation();
    });
});
