/**
 * REACTION TRAINER - BLINK EDITION
 * Versión Completa: Restauración de Seguridad + Segmentación PC/Mobile
 */

const MOBILE_BREAKPOINT = 768;
const PC_INACTIVITY_MS = 1000; 
const MOBILE_INACTIVITY_MS = 750; 
const CIRCLE_SIZE_PC = 80;      
const CIRCLE_SIZE_MOBILE = 65;  
const MARGEN_SEGURIDAD_UI = 25; // Restaurado: Margen para que no se solape con la UI

let aciertos = 0, fallos = 0, tiempoRestante = 60, juegoActivo = false;
let movementTimerId = null, countdownTimerId = null, tiempoMovimiento = 0, sumaTiemposReaccion = 0;
let currentInactivityTime = PC_INACTIVITY_MS; 
let currentSize = CIRCLE_SIZE_PC; 

const COLOR_ACENTO = '#00FFC0';
const COLOR_VERDE_MOVIMIENTO = '#00CC00'; 
const COLOR_AZUL_FLASH = 'rgba(0, 191, 255, 0.5)';
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
    } catch (e) { }
}

function calcularTiempoReaccionPromedio() {
    if (aciertos === 0) return "9999.00";
    return (sumaTiemposReaccion / aciertos).toFixed(2);
}

document.addEventListener('DOMContentLoaded', function() {
    const gridInicio = document.getElementById('grid-inicio');
    const botonCirculo = document.getElementById('btn-circulo');
    const elementosUI = [
        document.getElementById('temporizador'),
        document.getElementById('conteo-fallos-exterior'),
        document.getElementById('conteo-aciertos')
    ];

    function aplicarAjusteDispositivo() {
        const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
        if (isMobile) {
            currentInactivityTime = MOBILE_INACTIVITY_MS;
            currentSize = CIRCLE_SIZE_MOBILE;
            gridInicio?.classList.replace('pc-layout', 'mobile-layout') || gridInicio?.classList.add('mobile-layout');
        } else {
            currentInactivityTime = PC_INACTIVITY_MS;
            currentSize = CIRCLE_SIZE_PC;
            gridInicio?.classList.replace('mobile-layout', 'pc-layout') || gridInicio?.classList.add('pc-layout');
        }
        botonCirculo.style.setProperty('width', currentSize + 'px', 'important');
        botonCirculo.style.setProperty('height', currentSize + 'px', 'important');
    }

    // LINEAS RESTAURADAS: Sistema de colisión con la interfaz
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

    function colisionaConUI(x, y, radio, zonas) {
        const rectC = { top: y, bottom: y + (radio * 2), left: x, right: x + (radio * 2) };
        for (const z of zonas) {
            if (rectC.left < z.right && rectC.right > z.left && rectC.top < z.bottom && rectC.bottom > z.top) return true;
        }
        return false;
    }

    function moverCirculoAleatoriamente() {
        if (!juegoActivo) return;
        const radio = currentSize / 2;
        const xMax = window.innerWidth - currentSize;
        const yMax = window.innerHeight - currentSize;
        const zonas = obtenerZonasProhibidas();
        
        let nuevoX, nuevoY, seguro = false, intentos = 0;
        while (!seguro && intentos < 50) {
            nuevoX = Math.floor(Math.random() * Math.max(0, xMax));
            nuevoY = Math.floor(Math.random() * Math.max(0, yMax));
            if (!colisionaConUI(nuevoX, nuevoY, radio, zonas)) seguro = true;
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

    function iniciarJuego() {
        aplicarAjusteDispositivo();
        aciertos = 0; fallos = 0; tiempoRestante = 60; sumaTiemposReaccion = 0;
        document.getElementById('modal-inicio-juego').classList.add('oculto');
        [document.getElementById('main-container'), botonCirculo, ...elementosUI].forEach(el => el?.classList.remove('oculto'));
        
        countdownTimerId = setInterval(() => {
            if (tiempoRestante > 0) {
                tiempoRestante--;
                document.getElementById('temporizador').textContent = `0:${tiempoRestante < 10 ? '0'+tiempoRestante : tiempoRestante}`;
            } else { finalizarJuego(); }
        }, 1000);
        setTimeout(() => { juegoActivo = true; moverCirculoAleatoriamente(); resetMovementTimer(); }, 1000);
    }

    function finalizarJuego() {
        juegoActivo = false;
        clearInterval(countdownTimerId);
        clearTimeout(movementTimerId);
        botonCirculo.classList.add('oculto');
        const trFinal = calcularTiempoReaccionPromedio();
        
        // LINEAS RESTAURADAS: Lógica de Tiempo Extremo
        if (parseFloat(trFinal) <= 90.00 && aciertos > 0) {
            const modCont = document.querySelector('#modal-fin-juego .modal-contenido');
            modCont.innerHTML = `<div class="tr-extrema"><h2>¡TIEMPO EXTREMO!</h2><p style="font-size:3em;">${trFinal} ms</p><p>Refresca para volver a intentar.</p></div>`;
        } else {
            document.getElementById('final-aciertos').textContent = aciertos;
            document.getElementById('final-fallos').textContent = fallos;
            document.getElementById('tiempo-reaccion-estimado').textContent = `${trFinal} ms`;
        }
        document.getElementById('modal-fin-juego').classList.remove('oculto');
    }

    document.getElementById('btn-iniciar').onclick = () => { sonarBlink(440, 'sine', 0.1); iniciarJuego(); };
    botonCirculo.onclick = (e) => {
        if (!juegoActivo) return;
        e.stopPropagation();
        sumaTiemposReaccion += (performance.now() - tiempoMovimiento);
        aciertos++;
        document.getElementById('conteo-aciertos').textContent = `Aciertos: ${aciertos}`;
        sonarBlink(880, 'sine', 0.1);
        if (aciertos % 25 === 0) {
            document.body.style.backgroundColor = COLOR_AZUL_FLASH;
            setTimeout(() => document.body.style.backgroundColor = COLOR_FONDO_BASE, 100);
        }
        moverCirculoAleatoriamente(); resetMovementTimer();
    };

    document.body.onclick = (e) => {
        if (!juegoActivo || e.target.id === 'btn-circulo') return;
        fallos++;
        document.getElementById('conteo-fallos-exterior').textContent = `Fallos Totales: ${fallos}`;
        sonarBlink(200, 'square', 0.15);
        document.body.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
        setTimeout(() => document.body.style.backgroundColor = COLOR_FONDO_BASE, 150);
    };

    aplicarAjusteDispositivo();
    window.addEventListener('resize', aplicarAjusteDispositivo);
});
