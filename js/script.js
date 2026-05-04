const CONFIG = {
    MOBILE_BREAKPOINT: 768,
    PC_SIZE: 80,
    MOBILE_SIZE: 65,
    GAME_DURATION: 60,
    BOT_THRESHOLD: 95 // ms para detectar posible bot
};

let game = {
    active: false,
    score: 0,
    misses: 0,
    time: CONFIG.GAME_DURATION,
    totalReaction: 0,
    lastSpawn: 0,
    currentSize: CONFIG.PC_SIZE
};

// Sincronización de hardware
function syncHardware() {
    const grid = document.getElementById('grid-inicio');
    const isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
    
    if (grid) {
        grid.className = isMobile ? 'mobile-layout' : 'pc-layout';
    }
    game.currentSize = isMobile ? CONFIG.MOBILE_SIZE : CONFIG.PC_SIZE;
}

// Generación de objetivo evitando la UI
function spawnTarget() {
    if (!game.active) return;
    const btn = document.getElementById('btn-circulo');
    
    const hudElements = Array.from(document.querySelectorAll('#ui-container div:not(.oculto)'))
                             .map(el => el.getBoundingClientRect());

    let x, y, safe = false;
    let attempts = 0;

    while (!safe && attempts < 50) {
        x = Math.random() * (window.innerWidth - game.currentSize);
        y = Math.random() * (window.innerHeight - game.currentSize);
        
        const rect = { left: x - 20, right: x + game.currentSize + 20, top: y - 20, bottom: y + game.currentSize + 20 };
        
        safe = !hudElements.some(hud => 
            rect.left < hud.right && rect.right > hud.left &&
            rect.top < hud.bottom && rect.bottom > hud.top
        );
        attempts++;
    }

    btn.style.width = game.currentSize + "px";
    btn.style.height = game.currentSize + "px";
    btn.style.left = x + "px";
    btn.style.top = y + "px";
    game.lastSpawn = performance.now();
}

window.onload = () => {
    syncHardware();
    window.addEventListener('resize', syncHardware);

    document.getElementById('btn-iniciar').onclick = () => {
        game.active = true;
        document.getElementById('modal-inicio-juego').classList.add('oculto');
        document.getElementById('btn-circulo').classList.remove('oculto');
        document.querySelectorAll('#ui-container div').forEach(el => el.classList.remove('oculto'));
        
        spawnTarget();

        const timer = setInterval(() => {
            if (!game.active) {
                clearInterval(timer);
                return;
            }
            game.time--;
            document.getElementById('temporizador').innerText = `0:${game.time.toString().padStart(2, '0')}`;
            if (game.time <= 0) endGame();
        }, 1000);
    };

    document.getElementById('btn-circulo').onclick = (e) => {
        e.stopPropagation();
        const reactionTime = performance.now() - game.lastSpawn;
        
        // Anti-Bot / Seguridad de juego
        if (reactionTime < CONFIG.BOT_THRESHOLD) {
            console.warn("Detección de bot: Reacción demasiado rápida.");
        }

        game.totalReaction += reactionTime;
        game.score++;
        document.getElementById('conteo-aciertos').innerText = `Aciertos: ${game.score}`;
        spawnTarget();
    };

    // Penalización por fallar el clic
    document.body.onclick = () => {
        if (!game.active) return;
        game.misses++;
        document.getElementById('conteo-fallos-exterior').innerText = `Fallos: ${game.misses}`;
        document.body.style.backgroundColor = "#400";
        setTimeout(() => document.body.style.backgroundColor = "#0a0a0a", 80);
    };
};

function endGame() {
    game.active = false;
    document.getElementById('btn-circulo').classList.add('oculto');
    document.getElementById('modal-fin-juego').classList.remove('oculto');
    document.getElementById('final-aciertos').innerText = game.score;
    document.getElementById('final-fallos').innerText = game.misses;
    
    const avg = game.score > 0 ? (game.totalReaction / game.score).toFixed(0) : 0;
    document.getElementById('tiempo-reaccion-estimado').innerText = avg;
}
