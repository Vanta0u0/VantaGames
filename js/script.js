/**
 * REACTION TRAINER - BLINK EDITION
 * Versión Reforzada: Segmentación Inteligente y Protección de Renderizado
 */

const MOBILE_BREAKPOINT = 768;
const PC_INACTIVITY_MS = 1000; 
const MOBILE_INACTIVITY_MS = 750; 
const CIRCLE_SIZE_PC = 80;      // Tamaño garantizado para PC
const CIRCLE_SIZE_MOBILE = 65;  // Tamaño optimizado para móviles
const MARGEN_SEGURIDAD_UI = 20; 

let aciertos = 0;
let fallos = 0;
let movementTimerId = null; 
let countdownTimerId = null; 
let tiempoRestante = 60; 
let juegoActivo = false; 
const RETRASO_INICIO = 1000;

let currentInactivityTime = PC_INACTIVITY_MS; 
let currentSize = CIRCLE_SIZE_PC; 
let tiempoMovimiento = 0;
let sumaTiemposReaccion = 0;

const COLOR_ACENTO = '#00FFC0';
const COLOR_VERDE_MOVIMIENTO = '#00CC00'; 
const COLOR_AZUL_CELEBRACION_FLASH = 'rgba(0, 191, 255, 0.5)';
const COLOR_FONDO_FALLO = 'rgba(255, 0, 0, 0.5)';
const COLOR_FONDO_BASE = '#121212'; 

let audioCtx = null;

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
    } catch (e) { console.log("Audio waiting..."); }
}

function calcularTiempoReaccionPromedio() {
    if (aciertos === 0) return "9999.00";
    return (sumaTiemposReaccion / aciertos).toFixed(2);
}

document.addEventListener('DOMContentLoaded', function() {
    const modalInicio = document.getElementById('modal-inicio-juego');
    const btnIniciar = document.getElementById('btn-iniciar');
    const conteoAciertos = document.getElementById('conteo-aciertos');
    const conteoFallosExt = document.getElementById('conteo-fallos-exterior');
    const temporizadorDisplay = document.getElementById('temporizador');
    const botonCirculo = document.getElementById('btn-circulo'); 
    const mainContainer = document.getElementById('main-container'); 
    const modalFin = document.getElementById('modal-fin-juego');
    const modalContenidoFin = document.querySelector('#modal-fin-juego .modal-contenido'); 
    const finalAciertos = document.getElementById('final-aciertos');
    const finalFallos = document.getElementById('final-fallos');
    const btnReiniciar = document.getElementById('btn-reiniciar');
    const tiempoReaccionDisplay = document.getElementById('tiempo-reaccion-estimado');

    const elementosUI = [temporizadorDisplay, conteoFallosExt, conteoAciertos];

    // MODIFICACIÓN: Segmentación real de hardware
    function aplicarAjusteDispositivo() {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            currentInactivityTime = MOBILE_INACTIVITY_MS;
            currentSize = CIRCLE_SIZE_MOBILE;
        } else {
            currentInactivityTime = PC_INACTIVITY_MS;
            currentSize = CIRCLE_SIZE_PC;
        }
        // Forzado de tamaño visual para resolver el bug de PC
        botonCirculo.style.setProperty('width', currentSize + 'px', 'important');
        botonCirculo.style.setProperty('height', currentSize + 'px', 'important');
    }

    function obtenerZonasProhibidas() {
        const zonas = [];
        elementosUI.forEach(el => {
            if (el && !el.classList.contains('oculto')) {
                const rect = el.getBoundingClientRect();
                zonas.push({
                    top: rect.top - MARGEN_SEGURIDAD_UI,
                    bottom: rect.bottom + MARGEN_SEGURIDAD_UI,
                    left: rect.left - MARGEN_SEGURIDAD_UI,
                    right: rect.right + MARGEN_SEGURIDAD_UI
                });
            }
        });
        return zonas;
    }

    function colisionaConUI(x, y, radioCirculo, zonasProhibidas) {
        const rectCirculo = {
            top: y,
            bottom: y + (radioCirculo * 2),
            left: x,
            right: x + (radioCirculo * 2)
        };
        for (const zona of zonasProhibidas) {
            if (rectCirculo.left < zona.right && rectCirculo.right > zona.left &&
                rectCirculo.top < zona.bottom && rectCirculo.bottom > zona.top) {
                return true;
            }
        }
        return false;
    }

    function moverCirculoAleatoriamente() {
        if (!juegoActivo) return;
        const radio = currentSize / 2;
        const xMax = window.innerWidth - currentSize;
        const yMax = window.innerHeight - currentSize;
        const zonasProhibidas = obtenerZonasProhibidas();
        
        let nuevoX, nuevoY, posicionSegura = false, intentos = 0;
        while (!posicionSegura && intentos < 50) {
            nuevoX = Math.floor(Math.random() * Math.max(0, xMax));
            nuevoY = Math.floor(Math.random() * Math.max(0, yMax));
            if (!colisionaConUI(nuevoX, nuevoY, radio, zonasProhibidas)) posicionSegura = true;
            intentos++;
        }
        botonCirculo.style.left = `${nuevoX}px`;
        botonCirculo.style.top = `${nuevoY}px`;
        sonarBlink(600, 'sine', 0.1);
        botonCirculo.classList.remove('blink-active');
        void botonCirculo.offsetWidth; 
        botonCirculo.classList.add('blink-active');
        tiempoMovimiento = performance.now();
    }

    function resetMovementTimer() {
        clearTimeout(movementTimerId);
        movementTimerId = setTimeout(() => {
            if (juegoActivo) { moverCirculoAleatoriamente(); resetMovementTimer(); }
        }, currentInactivityTime);
    }

    function finalizarJuego() {
        juegoActivo = false;
        clearInterval(countdownTimerId);
        clearTimeout(movementTimerId);
        botonCirculo.classList.add('oculto');
        const trFinal = calcularTiempoReaccionPromedio();
        if (parseFloat(trFinal) <= 90.00 && aciertos > 0) {
            modalContenidoFin.innerHTML = `<div class="tr-extrema-container"><h2>¡TIEMPO EXTREMO!</h2><p style="font-size: 2.5em; font-weight: bold;">${trFinal} ms</p><p>Recarga para volver a intentar.</p></div>`;
            modalFin.style.pointerEvents = 'none';
        } else {
            finalAciertos.textContent = aciertos;
            finalFallos.textContent = fallos;
            tiempoReaccionDisplay.textContent = `${trFinal} ms`;
        }
        modalFin.classList.remove('oculto');
    }

    function iniciarJuego() {
        aplicarAjusteDispositivo(); // Refuerzo de tamaño al arrancar
        aciertos = 0; fallos = 0; tiempoRestante = 60; sumaTiemposReaccion = 0;
        modalInicio.classList.add('oculto');
        [mainContainer, botonCirculo, conteoAciertos, conteoFallosExt, temporizadorDisplay].forEach(el => el?.classList.remove('oculto'));
        
        countdownTimerId = setInterval(() => {
            if (tiempoRestante > 0) { 
                tiempoRestante--; 
                const min = Math.floor(tiempoRestante / 60);
                const seg = tiempoRestante % 60;
                temporizadorDisplay.textContent = `${min}:${seg < 10 ? '0'+seg : seg}`;
            } else { finalizarJuego(); }
        }, 1000);
        setTimeout(() => { juegoActivo = true; moverCirculoAleatoriamente(); resetMovementTimer(); }, RETRASO_INICIO);
    }

    btnIniciar.onclick = () => { sonarBlink(440, 'sine', 0.1); iniciarJuego(); };
    botonCirculo.onclick = (e) => {
        if (!juegoActivo) return;
        e.stopPropagation(); 
        sumaTiemposReaccion += (performance.now() - tiempoMovimiento);
        aciertos++;
        conteoAciertos.textContent = `Aciertos: ${aciertos}`;
        sonarBlink(880, 'sine', 0.1);
        botonCirculo.style.backgroundColor = COLOR_VERDE_MOVIMIENTO;
        if (aciertos % 25 === 0) document.body.style.backgroundColor = COLOR_AZUL_CELEBRACION_FLASH;
        setTimeout(() => { botonCirculo.style.backgroundColor = COLOR_ACENTO; document.body.style.backgroundColor = COLOR_FONDO_BASE; }, 100);
        moverCirculoAleatoriamente(); resetMovementTimer();
    };

    document.body.onclick = (e) => {
        if (!juegoActivo || e.target.id === 'btn-circulo' || e.target.closest('#grid-inicio')) return;
        fallos++;
        conteoFallosExt.textContent = `Fallos Totales: ${fallos}`;
        sonarBlink(200, 'square', 0.15);
        document.body.style.backgroundColor = COLOR_FONDO_FALLO;
        setTimeout(() => document.body.style.backgroundColor = COLOR_FONDO_BASE, 150);
        moverCirculoAleatoriamente(); resetMovementTimer();
    };

    if (btnReiniciar) btnReiniciar.onclick = () => location.reload();
    aplicarAjusteDispositivo();
    window.addEventListener('resize', aplicarAjusteDispositivo);
});
