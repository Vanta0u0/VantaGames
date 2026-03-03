// --- CONSTANTES Y VARIABLES (Manteniendo tu lógica original) ---
const MOBILE_BREAKPOINT = 768;
const PC_INACTIVITY_MS = 1000;
const MOBILE_INACTIVITY_MS = 750;
const CIRCLE_SIZE_PC = '80px';
const CIRCLE_SIZE_MOBILE = '55px';

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

const COLOR_ACENTO = '#00FFC0';
const COLOR_VERDE_MOVIMIENTO = '#00CC00'; 
const COLOR_AZUL_CELEBRACION_FLASH = 'rgba(0, 191, 255, 0.5)';
const COLOR_FONDO_FALLO = 'rgba(255, 0, 0, 0.5)';
const COLOR_FONDO_BASE = '#121212'; 
const SHADOW_ACENTO = '0 0 15px ' + COLOR_ACENTO;
const SHADOW_VERDE = '0 0 15px ' + COLOR_VERDE_MOVIMIENTO;

// --- MOTOR DE AUDIO (Protegido contra errores de carga) ---
let audioCtx;
function sonarBlink(frecuencia, tipo, duracion) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duracion);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + duracion);
    } catch (e) { console.warn("Audio esperando interacción del usuario."); }
}

function calcularTiempoReaccionPromedio() {
    if (aciertos === 0) return "9999.00";
    return (sumaTiemposReaccion / aciertos).toFixed(2);
}

// --- INICIO PRINCIPAL ---
document.addEventListener('DOMContentLoaded', function() {
    // Referencias al DOM
    const modalInicioJuego = document.getElementById('modal-inicio-juego');
    const btnIniciar = document.getElementById('btn-iniciar');
    const conteoAciertosDisplay = document.getElementById('conteo-aciertos');
    const conteoFallosDisplayExterno = document.getElementById('conteo-fallos-exterior');
    const conteoFallosDisplayInterno = document.getElementById('conteo-fallos');
    const temporizadorDisplay = document.getElementById('temporizador');
    const botonCirculo = document.getElementById('btn-circulo'); 
    const cuerpoPagina = document.body;
    const mainContainer = document.getElementById('main-container'); 
    const modalFinJuego = document.getElementById('modal-fin-juego');
    const modalContenidoFin = document.querySelector('#modal-fin-juego .modal-contenido'); 
    const finalAciertosDisplay = document.getElementById('final-aciertos');
    const finalFallosDisplay = document.getElementById('final-fallos');
    const btnReiniciar = document.getElementById('btn-reiniciar');
    const tiempoReaccionEstimadoDisplay = document.getElementById('tiempo-reaccion-estimado');

    function aplicarAjusteMovil() {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            currentInactivityTime = MOBILE_INACTIVITY_MS;
            botonCirculo.style.width = CIRCLE_SIZE_MOBILE;
            botonCirculo.style.height = CIRCLE_SIZE_MOBILE;
        } else {
            currentInactivityTime = PC_INACTIVITY_MS;
            botonCirculo.style.width = CIRCLE_SIZE_PC;
            botonCirculo.style.height = CIRCLE_SIZE_PC;
        }
    }

    function moverCirculoAleatoriamente() {
        const xMax = window.innerWidth - botonCirculo.offsetWidth;
        const yMax = window.innerHeight - botonCirculo.offsetHeight;
        const nuevoX = Math.floor(Math.random() * Math.max(0, xMax));
        const nuevoY = Math.floor(Math.random() * Math.max(0, yMax));
        
        botonCirculo.style.left = `${nuevoX}px`;
        botonCirculo.style.top = `${nuevoY}px`;
        
        sonarBlink(600, 'sine', 0.1);
        botonCirculo.classList.remove('blink-active');
        void botonCirculo.offsetWidth; // Forzar reinicio de animación
        botonCirculo.classList.add('blink-active');
        tiempoMovimiento = performance.now();
    }

    function resetMovementTimer() {
        clearTimeout(movementTimerId);
        movementTimerId = setTimeout(() => {
            if (juegoActivo) {
                moverCirculoAleatoriamente();
                resetMovementTimer();
            }
        }, currentInactivityTime);
    }

    function finalizarJuego() {
        juegoActivo = false;
        clearTimeout(movementTimerId);
        clearInterval(countdownTimerId);
        botonCirculo.classList.add('oculto');
        
        const trFinal = calcularTiempoReaccionPromedio();
        modalFinJuego.classList.remove('oculto');

        if (parseFloat(trFinal) <= 90.00 && aciertos > 0) {
            modalContenidoFin.innerHTML = `
                <div class="tr-extrema-container">
                    <h2>¡TIEMPO EXTREMO!</h2>
                    <p style="font-size: 2em;">${trFinal} ms</p>
                    <p>Recarga para jugar.</p>
                </div>`;
        } else {
            finalAciertosDisplay.textContent = aciertos;
            finalFallosDisplay.textContent = fallos;
            tiempoReaccionEstimadoDisplay.textContent = `${trFinal} ms`;
        }
    }

    function iniciarJuego() {
        aciertos = 0;
        fallos = 0;
        tiempoRestante = 60;
        sumaTiemposReaccion = 0;
        
        modalInicioJuego.classList.add('oculto');
        mainContainer.classList.remove('oculto');
        conteoAciertosDisplay.classList.remove('oculto');
        conteoFallosDisplayExterno.classList.remove('oculto');
        temporizadorDisplay.classList.remove('oculto');
        botonCirculo.classList.remove('oculto');

        countdownTimerId = setInterval(() => {
            if (tiempoRestante > 0) {
                tiempoRestante--;
                const m = Math.floor(tiempoRestante / 60);
                const s = tiempoRestante % 60;
                temporizadorDisplay.textContent = `${m}:${s < 10 ? '0'+s : s}`;
                if (tiempoRestante <= 10) temporizadorDisplay.style.color = 'red';
            } else {
                finalizarJuego();
            }
        }, 1000);

        setTimeout(() => {
            juegoActivo = true;
            moverCirculoAleatoriamente();
            resetMovementTimer();
        }, RETRASO_INICIO);
    }

    // --- MANEJO DE EVENTOS ---
    btnIniciar.addEventListener('click', () => {
        sonarBlink(440, 'sine', 0.1);
        iniciarJuego();
    });

    btnReiniciar.addEventListener('click', () => location.reload());

    botonCirculo.addEventListener('click', (e) => {
        if (!juegoActivo) return;
        e.stopPropagation();
        sumaTiemposReaccion += (performance.now() - tiempoMovimiento);
        aciertos++;
        conteoAciertosDisplay.textContent = `Aciertos: ${aciertos}`;
        sonarBlink(880, 'sine', 0.1);
        
        botonCirculo.style.backgroundColor = COLOR_VERDE_MOVIMIENTO;
        setTimeout(() => botonCirculo.style.backgroundColor = COLOR_ACENTO, 100);
        
        moverCirculoAleatoriamente();
        resetMovementTimer();
    });

    cuerpoPagina.addEventListener('click', (e) => {
        if (!juegoActivo || e.target.id === 'btn-circulo') return;
        fallos++;
        conteoFallosDisplayExterno.textContent = `Fallos Totales: ${fallos}`;
        sonarBlink(200, 'square', 0.15);
        cuerpoPagina.style.backgroundColor = COLOR_FONDO_FALLO;
        setTimeout(() => cuerpoPagina.style.backgroundColor = COLOR_FONDO_BASE, 150);
    });

    aplicarAjusteMovil();
});
