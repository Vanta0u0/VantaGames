/**
 * REACTION TRAINER - ENGINE V8
 * Optimización de latencia para sistemas PC de alto rendimiento.
 */

const GAME_CONFIG = {
    DURATION: 60,
    TARGET_SIZE_PC: 80,
    TARGET_SIZE_MOB: 65,
    MOBILE_BREAKPOINT: 768
};

let gameState = {
    isRunning: false,
    timer: GAME_CONFIG.DURATION,
    hits: 0,
    misses: 0,
    totalReactionTime: 0,
    spawnTimestamp: 0,
    currentSize: GAME_CONFIG.TARGET_SIZE_PC
};

// 1. Sincronización de dispositivo
const updateLayout = () => {
    const isMobile = window.innerWidth <= GAME_CONFIG.MOBILE_BREAKPOINT;
    gameState.currentSize = isMobile ? GAME_CONFIG.TARGET_SIZE_MOB : GAME_CONFIG.TARGET_SIZE_PC;
};

// 2. Generador de Posiciones Aleatorias
const spawnNewTarget = () => {
    if (!gameState.isRunning) return;

    const target = document.getElementById('game-target');
    const padding = 30; // Margen para evitar bordes
    
    // Calcular límites seguros
    const maxX = window.innerWidth - gameState.currentSize - padding;
    const maxY = window.innerHeight - gameState.currentSize - padding;
    const minX = padding;
    const minY = 100; // Evitar el área del HUD superior

    const randomX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
    const randomY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

    target.style.width = `${gameState.currentSize}px`;
    target.style.height = `${gameState.currentSize}px`;
    target.style.left = `${randomX}px`;
    target.style.top = `${randomY}px`;
    
    target.classList.remove('hidden');
    gameState.spawnTimestamp = performance.now();
};

// 3. Lógica Principal
document.addEventListener('DOMContentLoaded', () => {
    updateLayout();
    window.addEventListener('resize', updateLayout);

    const btnStart = document.getElementById('btn-play-now');
    const gameTarget = document.getElementById('game-target');

    // Iniciar Juego
    btnStart.addEventListener('click', () => {
        gameState.isRunning = true;
        document.getElementById('modal-start').classList.add('hidden');
        document.getElementById('hud-container').classList.remove('hidden');
        spawnNewTarget();

        const gameInterval = setInterval(() => {
            if (!gameState.isRunning) {
                clearInterval(gameInterval);
                return;
            }

            gameState.timer--;
            const timerDisplay = document.getElementById('timer-val');
            timerDisplay.innerText = `00:${gameState.timer.toString().padStart(2, '0')}`;

            if (gameState.timer <= 0) {
                endGame();
            }
        }, 1000);
    });

    // Evento de Acierto
    gameTarget.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que cuente como fallo en el body
        if (!gameState.isRunning) return;

        const hitTime = performance.now();
        gameState.totalReactionTime += (hitTime - gameState.spawnTimestamp);
        gameState.hits++;

        document.getElementById('hits-val').innerText = gameState.hits;
        spawnNewTarget();
    });

    // Evento de Fallo
    document.body.addEventListener('click', () => {
        if (!gameState.isRunning) return;

        gameState.misses++;
        document.getElementById('misses-val').innerText = gameState.misses;

        // Feedback Visual de error
        document.body.style.backgroundColor = "#400";
        setTimeout(() => {
            document.body.style.backgroundColor = "#0a0a0a";
        }, 100);
    });
});

// 4. Finalización y Resultados
const endGame = () => {
    gameState.isRunning = false;
    document.getElementById('game-target').classList.add('hidden');
    document.getElementById('modal-results').classList.remove('hidden');

    const avgReaction = gameState.hits > 0 
        ? Math.round(gameState.totalReactionTime / gameState.hits) 
        : 0;
    
    const totalAttempts = gameState.hits + gameState.misses;
    const accuracy = totalAttempts > 0 
        ? Math.round((gameState.hits / totalAttempts) * 100) 
        : 0;

    document.getElementById('final-hits').innerText = gameState.hits;
    document.getElementById('final-ms').innerText = `${avgReaction} ms`;
    document.getElementById('final-accuracy').innerText = `${accuracy}%`;
};
