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

// AUDIO ENGINE
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
    } catch (e) { console.log("Audio esperando clic"); }
}

function calcularTiempoReaccionPromedio() {
    if (aciertos === 0) return 9999.00.toFixed(2);
    return (sumaTiemposReaccion / aciertos).toFixed(2);
}

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

    const elementosDelJuego = [conteoAciertosDisplay, conteoFallosDisplayExterno, temporizadorDisplay, botonCirculo, mainContainer];

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
        const nuevoX = Math.floor(Math.random() * (window.innerWidth - botonCirculo.clientWidth));
        const nuevoY = Math.floor(Math.random() * (window.innerHeight - botonCirculo.clientHeight));
        botonCirculo.style.left = `${nuevoX}px`;
        botonCirculo.style.top = `${nuevoY}px`;
        
        sonarBlink(600, 'sine', 0.1);
        botonCirculo.classList.remove('blink-active');
        void botonCirculo.offsetWidth; 
        botonCirculo.classList.add('blink-active');
        tiempoMovimiento = performance.now();
    }

    function iniciarJuego() {
        elementosDelJuego.forEach(el => el.classList.remove('oculto'));
        modalInicioJuego.style.display = 'none';
        countdownTimerId = setInterval(() => {
            if (tiempoRestante > 0) {
                tiempoRestante--;
                const min = Math.floor(tiempoRestante / 60);
                const seg = tiempoRestante % 60;
                temporizadorDisplay.textContent = `${min}:${seg < 10 ? '0'+seg : seg}`;
            } else {
                clearInterval(countdownTimerId);
                finalizarJuego();
            }
        }, 1000); 
        setTimeout(() => { juegoActivo = true; moverCirculoAleatoriamente(); resetMovementTimer(); }, RETRASO_INICIO);
    }

    function finalizarJuego() {
        juegoActivo = false;
        clearTimeout(movementTimerId);
        botonCirculo.style.display = 'none';
        const trFinal = calcularTiempoReaccionPromedio();
        if (parseFloat(trFinal) <= 90.00) {
            modalFinJuego.style.display = 'flex';
            modalContenidoFin.innerHTML = `<div class="tr-extrema-container"><h2>¡TIEMPO EXTREMO!</h2><p>${trFinal} ms</p></div>`;
        } else {
            finalAciertosDisplay.textContent = aciertos;
            finalFallosDisplay.textContent = fallos;
            tiempoReaccionEstimadoDisplay.textContent = `${trFinal} ms`;
            modalFinJuego.style.display = 'flex';
        }
    }

    function resetMovementTimer() {
        clearTimeout(movementTimerId);
        movementTimerId = setTimeout(() => {
            moverCirculoAleatoriamente();
            resetMovementTimer();
        }, currentInactivityTime);
    }

    // EVENT LISTENERS CORREGIDOS
    btnIniciar.onclick = () => { iniciarJuego(); sonarBlink(440, 'sine', 0.1); };
    btnReiniciar.onclick = () => location.reload();
    botonCirculo.onclick = (e) => {
        if (!juegoActivo) return;
        sumaTiemposReaccion += (performance.now() - tiempoMovimiento);
        aciertos++;
        conteoAciertosDisplay.textContent = `Aciertos: ${aciertos}`;
        sonarBlink(880, 'sine', 0.1);
        moverCirculoAleatoriamente();
        resetMovementTimer();
    };
    cuerpoPagina.onclick = (e) => {
        if (!juegoActivo || e.target.id === 'btn-circulo' || e.target.id === 'btn-iniciar') return;
        fallos++;
        conteoFallosDisplayExterno.textContent = `Fallos Totales: ${fallos}`;
        sonarBlink(200, 'square', 0.15);
        cuerpoPagina.style.backgroundColor = COLOR_FONDO_FALLO;
        setTimeout(() => cuerpoPagina.style.backgroundColor = COLOR_FONDO_BASE, 150);
    };

    aplicarAjusteMovil();
});
