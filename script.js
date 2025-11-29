let aciertos = 0;
let fallos = 0;
let movementTimerId; 
let countdownTimerId; 
let tiempoRestante = 60; // 1 minuto
let juegoActivo = false; 
const INACTIVITY_TIME = 1000; // Tiempo que el círculo permanece antes de moverse por sí mismo
const RETRASO_INICIO = 1000; // 1 segundo de gracia al inicio/reiniciar
const ACIERTOS_UMBRAL = 40; // Umbral para la estimación de tiempo de reacción

const COLOR_ACENTO = '#00FFC0';
const COLOR_VERDE_MOVIMIENTO = '#00CC00'; 
const COLOR_AZUL_CELEBRACION_FLASH = 'rgba(0, 191, 255, 0.5)';
const COLOR_FONDO_FALLO = 'rgba(255, 0, 0, 0.5)';
const COLOR_FONDO_BASE = '#121212'; 

const SHADOW_ACENTO = '0 0 15px ' + COLOR_ACENTO;
const SHADOW_VERDE = '0 0 15px ' + COLOR_VERDE_MOVIMIENTO;

// -----------------------------------------------------
// FUNCIONES DE UTILIDAD (TIEMPO DE REACCIÓN)
// -----------------------------------------------------

function generarNumeroAleatorio(min, max) {
    // Genera un número flotante aleatorio entre min y max, con 2 decimales.
    return (Math.random() * (max - min) + min).toFixed(2);
}

function calcularTiempoReaccionEstimado(aciertos) {
    let min, max;
    
    if (aciertos > ACIERTOS_UMBRAL) {
        // Rango Rápido Extremo: De 90 ms a 110 ms
        min = 90;
        max = 110;
    } else {
        // Rango Estándar: De 150 ms a 300 ms
        min = 150;
        max = 300;
    }
    
    return generarNumeroAleatorio(min, max);
}

// -----------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos del DOM (Todos los IDs están siendo capturados aquí)
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
    // FUNCIONES DE CONTROL DE PANTALLA Y POSICIONAMIENTO
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
        
        centrarCirculo();
        
        window.addEventListener('resize', centrarCirculo);
        
        actualizarContadores();
        actualizarTemporizadorDisplay(); 
    }

    function iniciarJuego() {
        elementosDelJuego.forEach(el => el.classList.remove('oculto'));

        modalInicioJuego.style.display = 'none';

        iniciarTemporizadorCountdown(); 
    }

    // -----------------------------------------------------
    // FUNCIONES DE JUEGO PRINCIPALES
    // -----------------------------------------------------

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

        // Calcular el tiempo de reacción estimado
        const tiempoEstimadoString = calcularTiempoReaccionEstimado(aciertos);
        const tiempoEstimadoNumber = parseFloat(tiempoEstimadoString); 

        // LÓGICA DE CIERRE AUTOMÁTICO (95 ms a 100 ms o menos)
        if (tiempoEstimadoNumber <= 100.00) { 
            // Cierre automático
            modalFinJuego.style.display = 'flex';
            modalFinJuego.style.pointerEvents = 'none'; 
            
            // Reemplazar el contenido del modal
            modalContenidoFin.innerHTML = `
                <div style="color: #FFD700; border: 2px solid #FFD700; border-radius: 10px; padding: 20px; box-shadow: 0 0 20px #FFD700;">
                    <h2>¡TIEMPO DE REACCIÓN EXTREMO!</h2>
                    <p>Tu tiempo de reacción estimado fue de:</p>
                    <p style="font-size: 2em; font-weight: bold; margin: 15px 0;">
                        ${tiempoEstimadoString} ms
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
            tiempoReaccionEstimadoDisplay.textContent = `${tiempoEstimadoString} ms`;
            
            btnReiniciar.style.display = 'block'; 
            modalFinJuego.style.pointerEvents = 'auto'; 
            modalFinJuego.style.display = 'flex';
        }
    }

    function reiniciarJuego() {
        aciertos = 0;
        fallos = 0;
        tiempoRestante = 60;

        clearTimeout(movementTimerId);
        clearInterval(countdownTimerId); 

        modalFinJuego.style.display = 'none';
        botonCirculo.style.display = 'block';

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
        }, INACTIVITY_TIME);
    }

    function manejarAcierto() {
        if (tiempoRestante === 0 || !juegoActivo) return;

        aciertos++;
        conteoAciertosDisplay.textContent = `Aciertos: ${aciertos}`;
        conteoAciertosDisplay.style.backgroundColor = '#202020';
        
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

    function moverCirculoAleatoriamente() {
        const anchoMaximo = window.innerWidth - botonCirculo.clientWidth;
        const altoMaximo = window.innerHeight - botonCirculo.clientHeight;

        const nuevoX = Math.floor(Math.random() * anchoMaximo);
        const nuevoY = Math.floor(Math.random() * altoMaximo);
        
        botonCirculo.style.position = 'fixed'; 
        botonCirculo.style.left = `${nuevoX}px`;
        botonCirculo.style.top = `${nuevoY}px`;
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
