// CONFIGURACIÓN DE HARDWARE Y JUEGO
const CONFIG = {
    MOBILE_WIDTH: 768,
    PC_SIZE: 85,
    MOBILE_SIZE: 70,
    DURATION: 60
};

let game = {
    active: false,
    score: 0,
    misses: 0,
    timeLeft: CONFIG.DURATION,
    totalReaction: 0,
    lastSpawn: 0,
    currentSize: CONFIG.PC_SIZE
};

// Sincronización de pantalla y dispositivos
function syncDevice() {
    const isMobile = window.innerWidth <= CONFIG.MOBILE_WIDTH;
    const grid = document.getElementById('grid-inicio');
    if (grid) {
        grid.className = isMobile ? 'mobile-layout' : 'pc-layout';
    }
    game.currentSize = isMobile ? CONFIG.MOBILE_SIZE : CONFIG.PC_SIZE;
}

// Generación de objetivo con detección de zonas de UI
function spawnTarget() {
    if (!game.active) return;
    const btn = document.getElementById('btn-circulo');
    
    // Evitar que aparezca sobre los marcadores
    const x = Math.random() * (window.innerWidth - game.currentSize - 40) + 20;
    const y = Math.random() * (window.innerHeight - game.currentSize - 100) + 80;

    btn.style.width = `${game.currentSize}px`;
    btn.style.height = `${game.currentSize}px`;
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    btn.classList.remove('oculto');
    game.lastSpawn = performance.now();
}

// Inicialización controlada
window.addEventListener('DOMContentLoaded', () => {
    syncDevice();
    window.addEventListener('resize', syncDevice);

    const btnIniciar = document.getElementById('btn-iniciar');
    
    btnIniciar.addEventListener('click', () => {
        game.active = true;
        document.getElementById('modal-inicio-juego').classList.add('oculto');
        document.getElementById('ui-container').classList.remove('oculto');
        spawnTarget();

        const countdown = setInterval(() => {
            if (!game.active) return clearInterval(countdown);
            game.timeLeft--;
            document.getElementById('temporizador').innerText = `0:${game.timeLeft.toString().padStart(2, '0')}`;
            if (game.timeLeft <= 0) endGame();
        }, 1000);
    });

    document.getElementById('btn-circulo').addEventListener('click', (e) => {
        e.stopPropagation();
        if (!game.active) return;
        
        game.totalReaction += (performance.now() - game.lastSpawn);
        game.score++;
        document.getElementById('conteo-aciertos').innerText = `Aciertos: ${game.score}`;
        spawnTarget();
    });

    document.body.addEventListener('click', () => {
        if (!game.active) return;
        game.misses++;
        document.getElementById('conteo-fallos-exterior').innerText = `Fallos: ${game.misses}`;
        document.body.style.backgroundColor = "#300";
        setTimeout(() => {
            document.body.style.backgroundColor = "#0a0a0a";
        }, 80);
    });
});

function endGame() {
    game.active = false;
    document.getElementById('btn-circulo').classList.add('oculto');
    document.getElementById('modal-fin-juego').classList.remove('oculto');
    document.getElementById('final-aciertos').innerText = game.score;
    
    const avg = game.score > 0 ? (game.totalReaction / game.score).toFixed(0) : 0;
    document.getElementById('tiempo-reaccion-estimado').innerText = avg;
}
