const MOBILE_BREAKPOINT = 768; 
// --- DIFICULTAD BASE (PC/Mouse) ---
const PC_INACTIVITY_MS = 1000; // 1.00 segundo (PC)
const CIRCLE_SIZE_PC = '80px';
// --- DIFICULTAD ESTRICTA (Móvil/Táctil) ---
const MOBILE_INACTIVITY_MS = 750; // 0.75 segundos (Móvil)
const CIRCLE_SIZE_MOBILE = '55px';

// -----------------------------------------------------------------
let aciertos = 0;
let fallos = 0;
let movementTimerId; 
let countdownTimerId; 
let tiempoRestante = 60; 
let juegoActivo = false; 
const RETRASO_INICIO = 1000;

let currentInactivityTime; 
let tiempoMovimiento; 
let sumaTiemposReaccion = 0; 
const UMBRAL_CIERRE_EXTREMO = 90.00;

const COLOR_ACENTO = '#00FFC0';
const COLOR_VERDE_MOVIMIENTO = '#00CC00'; 
const COLOR_AZUL_CELEBRACION_FLASH = 'rgba(0, 191, 255, 0.5)';
const COLOR_FONDO_FALLO = 'rgba(255, 0, 0, 0.5)';
const COLOR_FONDO_BASE = '#121212'; 
const SHADOW_ACENTO = '0 0 15px ' + COLOR_ACENTO;
const SHADOW_VERDE = '0 0 15px ' + COLOR_VERDE_MOVIMIENTO;

// Variable para rastrear el tiempo del inicio del intento (usado solo en PC)
let tiempoInicioIntentoPC; 
// -----------------------------------------------------

// -----------------------------------------------------
// FUNCIONES DE CÁLCULO DE PUNTUACIÓN (Sin cambios)
// -----------------------------------------------------
function calcularTiempoReaccionPromedio() {
    if (aciertos === 0) {
        return 9999.00.toFixed(2);
    }
    const promedio = sumaTiemposReaccion / aciertos;
    return promedio.toFixed(2);
}

// -----------------------------------------------------
// LÓGICA DE DIFICULTAD CONDICIONAL (Movil vs PC)
// -----------------------------------------------------
function aplicarAjusteMovil(botonCirculo) {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
        // DIFICULTAD Y TAMAÑO MÓVIL
        currentInactivityTime = MOBILE_INACTIVITY_MS;
        botonCirculo.style.width = CIRCLE_SIZE_MOBILE;
        botonCirculo.style.height = CIRCLE_SIZE_MOBILE;
    } else {
        // DIFICULTAD Y TAMAÑO PC (BASE)
        currentInactivityTime = PC_INACTIVITY_MS;
        botonCirculo.style.width = CIRCLE_SIZE_PC;
        botonCirculo.style.height = CIRCLE_SIZE_PC;
    }
    centrarCirculo(botonCirculo);
}
// -----------------------------------------------------


document.addEventListener('DOMContentLoaded', function() {
    
    // --- ELEMENTOS GENERALES ---
    const modalInicioJuego = document.querySelector('#modal-inicio-juego');
    const btnIniciar = document.querySelector('#btn-iniciar');
    const conteoAciertosDisplay = document.querySelector('#conteo-aciertos');
    const conteoFallosDisplayExterno = document.querySelector('#conteo-fallos-exterior');
    const conteoFallosDisplayInterno = document.querySelector('#conteo-fallos');
    const temporizadorDisplay = document.querySelector('#temporizador');
    const botonCirculo = document.querySelector('#btn-circulo'); 
    const cuerpoPagina = document.querySelector('body');
    const modalFinJuego = document.querySelector('#modal-fin-juego');
    const finalAciertosDisplay = document.querySelector('#final-aciertos');
    const finalFallosDisplay = document.querySelector('#final-fallos');
    const btnReiniciar = document.querySelector('#btn-reiniciar');
    const tiempoReaccionEstimadoDisplay = document.querySelector('#tiempo-reaccion-estimado');

    const elementosDelJuego = [conteoAciertosDisplay, conteoFallosDisplayExterno, temporizadorDisplay, botonCirculo, document.querySelector('#main-container')];
    
    // --- LÓGICA DE CONTROL MÓVIL DEL MODAL (Omitida por brevedad) ---
    const principalColumna = document.getElementById('principal-columna');
    const explicacionColumna = document.getElementById('explicacion-columna');
    const novedadesColumna = document.getElementById('novedades-columna');
    const btnAbrirExplicacion = document.getElementById('btn-abrir-explicacion');
    const btnAbrirNovedades = document.getElementById('btn-abrir-novedades');
    const btnCerrarColumnas = document.querySelectorAll('.btn-cerrar-columna');

    function abrirColumna(columna) {
        if (window.innerWidth <= MOBILE_BREAKPOINT) { principalColumna.style.display = 'none'; }
        explicacionColumna.style.display = 'none';
        novedadesColumna.style.display = 'none';
        columna.style.display = 'flex'; columna.style.flexDirection = 'column';
    }

    function cerrarColumna() {
        explicacionColumna.style.display = 'none';
        novedadesColumna.style.display = 'none';
        if (window.innerWidth <= MOBILE_BREAKPOINT) { principalColumna.style.display = 'flex'; principalColumna.style.flexDirection = 'column'; }
    }
    // -----------------------------------------------------

    function centrarCirculo() {
        botonCirculo.style.position = 'fixed'; 
        const anchoVentana = window.innerWidth;
        const altoVentana = window.innerHeight;
        const anchoCirculo = botonCirculo.clientWidth; 
        const altoCirculo = botonCirculo.clientHeight;
        const nuevoX = (anchoVentana / 2) - (anchoCirculo / 2);
        const nuevoY = (altoVentana / 2) - (altoCirculo / 2);
        botonCirculo.style.left = `${nuevoX}px`;
        botonCirculo.style.top = `${nuevoY}px`;
    }

    function inicializarPantalla() {
        elementosDelJuego.forEach(el => el.classList.add('oculto'));
        aplicarAjusteMovil(botonCirculo);
        window.addEventListener('resize', () => { aplicarAjusteMovil(botonCirculo); });
        actualizarContadores();
        actualizarTemporizadorDisplay(); 
    }

    function iniciarTemporizadorCountdown() {
        // ... (Contador de tiempo restante) ...
        juegoActivo = false; 
        setTimeout(() => {
            juegoActivo = true;
            moverCirculoAleatoriamente(); 
            resetMovementTimer();
        }, RETRASO_INICIO); 
    }

    function resetMovementTimer() {
        clearTimeout(movementTimerId);
        movementTimerId = setTimeout(() => {
            moverCirculoAleatoriamente();
            botonCirculo.style.backgroundColor = COLOR_ACENTO; 
            botonCirculo.style.boxShadow = SHADOW_ACENTO;
            resetMovementTimer(); 
        }, currentInactivityTime);
    }

    function moverCirculoAleatoriamente() {
        const anchoMaximo = window.innerWidth - botonCirculo.clientWidth;
        const altoMaximo = window.innerHeight - botonCirculo.clientHeight;

        const nuevoX = Math.floor(Math.random() * anchoMaximo);
        const nuevoY = Math.floor(Math.random() * altoMaximo);
        
        botonCirculo.style.position = 'fixed'; 
        botonCirculo.style.left = `${nuevoX}px`;
        botonCirculo.style.top = `${nuevoY}px`;
        
        // REINICIO DE LOS CONTADORES
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            // MÓVIL: Usa el tiempo de llegada del círculo
            tiempoMovimiento = performance.now(); 
        } else {
            // PC: Usa el tiempo de inicio de la interacción del usuario
            tiempoInicioIntentoPC = performance.now(); 
        }
    }


    function manejarAcierto() {
        if (tiempoRestante === 0 || !juegoActivo) return;

        let tiempoReaccion;
        
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            // MÓVIL: CÁLCULO DE REACCIÓN PURA
            // Tiempo de clic - Tiempo de llegada del círculo (Punto B)
            tiempoReaccion = performance.now() - tiempoMovimiento;
        } else {
            // PC: CÁLCULO ESTÁNDAR (Incluye tiempo de movimiento del mouse)
            // Tiempo de clic - Tiempo de inicio del intento (Punto A)
            tiempoReaccion = performance.now() - tiempoInicioIntentoPC;
        }

        sumaTiemposReaccion += tiempoReaccion; 
        
        aciertos++;
        // ... (Actualización de display y estilos) ...
        
        moverCirculoAleatoriamente(); 
        resetMovementTimer(); 
        
        // ... (Efectos visuales) ...
    }

    function manejarFallo(event) {
        if (tiempoRestante === 0 || !juegoActivo) return;

        if (event.target.id !== 'btn-circulo') {
            fallos++;
            // ... (Actualización de display y estilos) ...
            
            // Si el intento falla, siempre reiniciamos el contador para la nueva posición (tanto para móvil como para PC).
            moverCirculoAleatoriamente(); 
            resetMovementTimer(); 
            
            // ... (Efectos visuales) ...
        }
    }
    
    // ... (El resto de las funciones de juego, inicio, fin y listeners permanecen iguales) ...

    // -----------------------------------------------------
    // EVENT LISTENERS Y LLAMADAS INICIALES
    // -----------------------------------------------------
    botonCirculo.addEventListener('click', manejarAcierto);
    cuerpoPagina.addEventListener('click', manejarFallo);
    // ... (Otros listeners) ...
    
    inicializarPantalla();
});
