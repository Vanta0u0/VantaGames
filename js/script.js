const CONFIG = {
    LIMIT_MOBILE: 768,
    SIZE_PC: 85,
    SIZE_MOBILE: 70,
    SAFE_ZONE: 50
};

let gameState = {
    running: false,
    score: 0,
    misses: 0,
    timeLeft: 60,
    reactionSum: 0,
    lastSpawn: 0,
    currentCircleSize: CONFIG.SIZE_PC
};

function adjustToHardware() {
    const grid = document.getElementById('grid-inicio');
    const isMobile = window.innerWidth <= CONFIG.LIMIT_MOBILE;
    
    if (isMobile) {
        grid.className = 'mobile-layout';
        gameState.currentCircleSize = CONFIG.SIZE_MOBILE;
    } else {
        grid.className = 'pc-layout';
        gameState.currentCircleSize = CONFIG.SIZE_PC;
    }
}

function spawnTarget() {
    if (!gameState.running) return;
    const btn = document.getElementById('btn-circulo');
    
    // Obtener áreas de la UI para evitar colisión
    const uiBoxes = Array.from(document.querySelectorAll('#ui-container div:not(.oculto)'))
                        .map(el => el.getBoundingClientRect());

    let x, y, isSafe = false;
    let attempts = 0;

    while (!isSafe && attempts < 100) {
        x = Math.random() * (window.innerWidth - gameState.currentCircleSize);
        y = Math.random() * (window.innerHeight - gameState.currentCircleSize);
        
        const circleRect = {
            left: x - 10, right: x + gameState.currentCircleSize + 10,
            top: y - 10, bottom: y + gameState.currentCircleSize + 10
        };

        isSafe = !uiBoxes.some(ui => 
            circleRect.left < ui.right && circleRect.right > ui.left &&
            circleRect.top < ui.bottom && circleRect.bottom > ui.top
        );
        attempts++;
    }

    btn.style.width = gameState.currentCircleSize + "px";
    btn.style.height = gameState.currentCircleSize + "px";
    btn.style.left = x + "px";
    btn.style.top = y + "px";
    gameState.lastSpawn = performance.now();
}

// Inicialización Segura
window.onload = () => {
    adjustToHardware();
    window.onresize = adjustToHardware;

    document.getElementById('btn-iniciar').onclick = () => {
        gameState.running = true;
        document.getElementById('modal-inicio-juego').classList.add('oculto');
        document.getElementById('btn-circulo').classList.remove('oculto');
        document.querySelectorAll('#ui-container div').forEach(el => el.classList.remove('oculto'));
        
        spawnTarget();

        const timerInterval = setInterval(() => {
            gameState.timeLeft--;
            document.getElementById('temporizador').innerText = `0:${gameState.timeLeft.toString().padStart(2, '0')}`;
            
            if (gameState.timeLeft <= 0) {
                clearInterval(timerInterval);
                endGame();
            }
        }, 1000);
    };

    document.getElementById('btn-circulo').onclick = (e) => {
        e.stopPropagation();
        gameState.reactionSum += (performance.now() - gameState.lastSpawn);
        gameState.score++;
        document.getElementById('conteo-aciertos').innerText = `Aciertos: ${gameState.score}`;
        spawnTarget();
    };

    document.body.onclick = () => {
        if (!gameState.running) return;
        gameState.misses++;
        document.getElementById('conteo-fallos-exterior').innerText = `Fallos: ${gameState.misses}`;
        document.body.style.backgroundColor = "#300";
        setTimeout(() => document.body.style.backgroundColor = var(--fondo), 80);
    };
};

function endGame() {
    gameState.running = false;
    document.getElementById('btn-circulo').classList.add('oculto');
    document.getElementById('modal-fin-juego').classList.remove('oculto');
    document.getElementById('final-aciertos').innerText = gameState.score;
    const avg = gameState.score > 0 ? (gameState.reactionSum / gameState.score).toFixed(0) : 0;
    document.getElementById('tiempo-reaccion-estimado').innerText = avg;
}
