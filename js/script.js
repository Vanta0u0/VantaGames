const MOBILE_BREAKPOINT = 768; // Ancho máximo para aplicar dificultad móvil
// Tiempo de inactividad (antes de que el círculo se mueva solo)
const PC_INACTIVITY_MS = 1000; // 1.00 segundo (PC)
const MOBILE_INACTIVITY_MS = 750; // 0.75 segundos (Móvil)
// Tamaño del círculo
const CIRCLE_SIZE_PC = '80px';
const CIRCLE_SIZE_MOBILE = '55px';
// -----------------------------------------------------------------
let aciertos = 0;
let fallos = 0;
let movementTimerId; 
let countdownTimerId; 
let tiempoRestante = 60; 
let juegoActivo = false; 
const RETRASO_INICIO = 1000;

// Variables para el Cálculo del Tiempo de Reacción
let currentInactivityTime; 
let tiempoMovimiento; // Momento exacto en que el círculo se mueve (INSTANTÁNEO)
let sumaTiemposReaccion = 0; // Suma total de todos los tiempos de acierto
// La constante PENALIZACION_FALLO_MS se ha ELIMINADO de los cálculos.

const COLOR_ACENTO = '#00FFC0';
const COLOR_VERDE_MOVIMIENTO = '#00CC00'; 
const COLOR_AZUL_CELEBRACION_FLASH = 'rgba(0, 191, 255, 0.5)';
const COLOR_FONDO_FALLO = 'rgba(255, 0, 0, 0.5)';
const COLOR_FONDO_BASE = '#121212'; 
const SHADOW_ACENTO = '0 0 15px ' + COLOR_ACENTO;
const SHADOW_VERDE = '0 0 15px ' + COLOR_VERDE_MOVIMIENTO;

// -----------------------------------------------------
// [NUEVO] FUNCIONES ADITIVAS PARA BLINK EDITION
// -----------------------------------------------------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function sonarBlink(frecuencia, tipo, duracion) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duracion);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + duracion);
    } catch (e) { console.log("Audio esperando interacción"); }
}

// -----------------------------------------------------
// FUNCIONES DE CÁLCULO DE PUNTUACIÓN
// -----------------------------------------------------
function calcularTiempoReaccionPromedio() {
    // Calcula el tiempo de reacción promedio (en ms).
    // Ya no se aplica penalización por fallos.
    
    if (aciertos === 0) {
        // Si no hay aciertos, devuelve un valor alto para evitar división por cero.
        return 9999.00.toFixed(2);
    }
    
    // El promedio es el tiempo total de aciertos dividido por el número de aciertos.
    const promedio = sumaTiemposReaccion / aciertos;
    
    return promedio.toFixed(2);
}

// -----------------------------------------------------
// FUNCIÓN PRINCIPAL DE INICIO
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    
    const modalInicioJuego = document.querySelector('#modal-inicio-juego');
    const btnIniciar = document.querySelector('#btn-iniciar');

    const conteoAciertosDisplay = document.querySelector('#conteo-aciertos');
    const conteoFallosDisplayExterno = document.querySelector('#conteo-fallos-exterior');
    const conteoFallosDisplayInterno = document.querySelector('#conteo-fallos');
    const temporizadorDisplay = document.querySelector('#temporizador');
    const botonCirculo = document.querySelector('#btn-circulo'); 
    const cuerpoPagina = document.querySelector('body');
    const mainContainer = document.querySelector('#main-container'); 

    const modalFinJuego = document.querySelector('#modal-fin-juego');
    const modalContenidoFin = document.querySelector('#modal-fin-juego .modal-contenido'); 
    const finalAciertosDisplay = document.querySelector('#final-aciertos');
    const finalFallosDisplay = document.querySelector('#final-fallos');
    const btnReiniciar = document.querySelector('#btn-reiniciar');
    const tiempoReaccionEstimadoDisplay = document.querySelector('#tiempo-reaccion-estimado');

    const elementosDelJuego = [
        conteoAciertosDisplay, conteoFallosDisplayExterno, temporizadorDisplay, 
        botonCirculo, mainContainer
    ];
    
    // -----------------------------------------------------
    // LÓGICA DE DETECCIÓN Y AJUSTE DE DIFICULTAD
    // -----------------------------------------------------
    function aplicarAjusteMovil() {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            currentInactivityTime = MOBILE_INACTIVITY_MS;
            
            botonCirculo.style.width = CIRCLE_SIZE_MOBILE;
            botonCirculo.style.height = CIRCLE_SIZE_MOBILE;
            centrarCirculo(); 
            
        } else {
            currentInactivityTime = PC_INACTIVITY_MS;
            botonCirculo.style.width = CIRCLE_SIZE_PC;
            botonCirculo.style.height = CIRCLE_SIZE_PC;
        }
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
        
        aplicarAjusteMovil();
        centrarCirculo();
        
        window.addEventListener('resize', () => {
             aplicarAjusteMovil();
             centrarCirculo();
        });
        
        actualizarContadores();
        actualizarTemporizadorDisplay(); 
    }

    function iniciarJuego() {
        elementosDelJuego.forEach(el => el.classList.remove('oculto'));

        modalInicioJuego.style.display = 'none';

        iniciarTemporizadorCountdown(); 
    }

    function actualizarContadores() {
        conteoAciertosDisplay.textContent = `Aciertos: ${aciertos}`;
        conteoFallosDisplayExterno.textContent = `Fallos Totales: ${fallos}`;
        conteoFallosDisplayInterno.textContent = `Fallos: ${fallos}`;
    }

    function actualizarTemporizadorDisplay() {
        const minutos = Math.floor(tiempoRestante / 60);
        const segundos = tiempoRestante % 60;
        const segundosFormateados = segundos < 10 ? `0${segundos}` : segundos;
        temporizadorDisplay.textContent = `${minutos}:${segundosFormateados}`;

        if (tiempoRestante <= 10 && tiempoRestante > 0) {
            temporizadorDisplay.style.color = 'red';
            temporizadorDisplay.style.borderColor = 'red';
        } else {
            temporizadorDisplay.style.color = '#FFFFFF';
            temporizadorDisplay.style.borderColor = '#FFFFFF';
        }
    }

    function iniciarTemporizadorCountdown() {
        countdownTimerId = setInterval(() => {
            if (tiempoRestante > 0) {
                tiempoRestante--;
                actualizarTemporizadorDisplay();
            } else {
                clearInterval(countdownTimerId);
                finalizarJuego();
            }
        }, 1000); 
        
        juegoActivo = false; 
        
        setTimeout(() => {
            juegoActivo = true;
            moverCirculoAleatoriamente(); 
            resetMovementTimer();
        }, RETRASO_INICIO); 
    }

    function finalizarJuego() {
        juegoActivo = false; 
        temporizadorDisplay.textContent = "¡FIN!";
        temporizadorDisplay.style.color = COLOR_ACENTO;
        temporizadorDisplay.style.borderColor = COLOR_ACENTO;
        
        clearTimeout(movementTimerId); 
        
        botonCirculo.style.display = 'none';

        const tiempoReaccionFinal = calcularTiempoReaccionPromedio(); 
        const tiempoEstimadoNumber = parseFloat(tiempoReaccionFinal); 

        // LÓGICA DE CIERRE AUTOMÁTICO (Si el tiempo promedio es extremadamente bajo)
        if (tiempoEstimadoNumber <= 90.00) { 
            modalFinJuego.style.display = 'flex';
            modalFinJuego.style.pointerEvents = 'none'; 
            
            modalContenidoFin.innerHTML = `
                <div style="color: #FFD700; border: 2px solid #FFD700; border-radius: 10px; padding: 20px; box-shadow: 0 0 20px #FFD700;">
                    <h2>¡TIEMPO DE REACCIÓN EXTREMO!</h2>
                    <p>Tu tiempo de reacción promedio fue de:</p>
                    <p style="font-size: 2em; font-weight: bold; margin: 15px 0;">
                        ${tiempoReaccionFinal} ms
                    </p>
                    <p>El juego se ha detenido automáticamente.</p>
                    <p style="font-size: 0.9em; margin-top: 20px;">
                        Para volver a jugar, debes recargar la página.
                    </p>
                </div>
            `;
            
        } else {
            // Flujo Normal de Fin de Juego
            finalAciertosDisplay.textContent = aciertos;
            finalFallosDisplay.textContent = fallos;
            tiempoReaccionEstimadoDisplay.textContent = `${tiempoReaccionFinal} ms`;
            
            btnReiniciar.style.display = 'block'; 
            modalFinJuego.style.pointerEvents = 'auto'; 
            modalFinJuego.style.display = 'flex';
        }
    }

    function reiniciarJuego() {
        aciertos = 0;
        fallos = 0;
        tiempoRestante = 60;
        sumaTiemposReaccion = 0; // Reinicia la suma de tiempos

        clearTimeout(movementTimerId);
        clearInterval(countdownTimerId); 

        modalFinJuego.style.display = 'none';
        botonCirculo.style.display = 'block';

        aplicarAjusteMovil(); 
        centrarCirculo();

        actualizarContadores();
        actualizarTemporizadorDisplay();
        
        iniciarTemporizadorCountdown(); 
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
        
        // [NUEVO] Feedback de aparición para evitar Blink Atencional
        sonarBlink(600, 'sine', 0.1);
        botonCirculo.classList.remove('blink-active');
        void botonCirculo.offsetWidth; 
        botonCirculo.classList.add('blink-active');

        // REGISTRA EL TIEMPO INSTANTÁNEO EN QUE EL CÍRCULO LLEGÓ A SU NUEVA POSICIÓN
        tiempoMovimiento = performance.now();
    }


    function manejarAcierto() {
        if (tiempoRestante === 0 || !juegoActivo) return;

        // CALCULAR EL TIEMPO DE REACCIÓN
        const tiempoReaccion = performance.now() - tiempoMovimiento;
        sumaTiemposReaccion += tiempoReaccion; 
        
        aciertos++;
        conteoAciertosDisplay.textContent = `Aciertos: ${aciertos}`;
        conteoAciertosDisplay.style.backgroundColor = '#202020';
        
        // [NUEVO] Sonido de Acierto
        sonarBlink(880, 'sine', 0.1);

        botonCirculo.style.backgroundColor = COLOR_VERDE_MOVIMIENTO;
        botonCirculo.style.boxShadow = SHADOW_VERDE;
        
        if (aciertos % 25 === 0) {
            cuerpoPagina.style.backgroundColor = COLOR_AZUL_CELEBRACION_FLASH;
        }
        
        moverCirculoAleatoriamente();
        resetMovementTimer(); 
        
        setTimeout(() => {
            cuerpoPagina.style.backgroundColor = COLOR_FONDO_BASE;
            conteoAciertosDisplay.style.backgroundColor = 'transparent';
        }, 150);
        
        setTimeout(() => {
            botonCirculo.style.backgroundColor = COLOR_ACENTO;
            botonCirculo.style.boxShadow = SHADOW_ACENTO; 
        }, 150); 
    }

    function manejarFallo(event) {
        if (tiempoRestante === 0 || !juegoActivo) return;

        if (event.target.id !== 'btn-circulo') {
            fallos++;
            
            // [NUEVO] Sonido de Fallo
            sonarBlink(200, 'square', 0.15);

            conteoFallosDisplayInterno.textContent = `Fallos: ${fallos}`;
            conteoFallosDisplayExterno.textContent = `Fallos Totales: ${fallos}`; 
            
            cuerpoPagina.style.backgroundColor = COLOR_FONDO_FALLO;
            conteoFallosDisplayExterno.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
            
            moverCirculoAleatoriamente();
            resetMovementTimer(); 
            
            botonCirculo.style.backgroundColor = COLOR_ACENTO; 
            botonCirculo.style.boxShadow = SHADOW_ACENTO;
            
            setTimeout(() => {
                cuerpoPagina.style.backgroundColor = COLOR_FONDO_BASE;
                conteoFallosDisplayExterno.style.backgroundColor = '#1a1a1a';
            }, 150);
        }
    }

    // -----------------------------------------------------
    // EVENT LISTENERS Y LLAMADAS INICIALES
    // -----------------------------------------------------
    botonCirculo.addEventListener('click', manejarAcierto);
    cuerpoPagina.addEventListener('click', manejarFallo);
    btnReiniciar.addEventListener('click', reiniciarJuego); 
    btnIniciar.addEventListener('click', iniciarJuego); 

    inicializarPantalla();
});
