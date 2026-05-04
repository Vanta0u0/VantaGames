// CONFIGURACIÓN INTERNA
const SETTINGS = {
    PC_W: 80,
    MOB_W: 65,
    BREAKPOINT: 768,
    TIME: 60
};

let game = {
    running: false,
    score: 0,
    misses: 0,
    timer: SETTINGS.TIME,
    totalMs: 0,
    lastSpawn: 0,
    size: SETTINGS.PC_W
};

// Sincronizar UI
function updateUI() {
    const info = document.getElementById('device-info');
    const isMobile = window.innerWidth <= SETTINGS.BREAKPOINT;
    if(info) info.style.flexDirection = isMobile ? "column" : "row";
    game.size = isMobile ? SETTINGS.MOB_W : SETTINGS.PC_W;
}

// Generador de objetivos
function spawn() {
    if (!game.running) return;
    const t = document.getElementById('target');
    
    // Margen de seguridad para no chocar con el HUD
    const x = Math.random() * (window.innerWidth - game.size - 40) + 20;
    const y = Math.random() * (window.innerHeight - game.size - 120) + 80;

    t.style.width = game.size + "px";
    t.style.height = game.size + "px";
    t.style.left = x + "px";
    t.style.top = y + "px";
    t.classList.remove('hidden');
    game.lastSpawn = performance.now();
}

// Ciclo de Vida del Navegador
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    window.addEventListener('resize', updateUI);

    const btnStart = document.getElementById('start-trigger');
    const target = document.getElementById('target');

    btnStart.addEventListener('click', () => {
        game.running = true;
        document.getElementById('menu-inicio').classList.add('hidden');
        document.getElementById('ui-layer').classList.remove('hidden');
        spawn();

        const clock = setInterval(() => {
            if(!game.running) {
                clearInterval(clock);
                return;
            }
            game.timer--;
            document.getElementById('temporizador').innerText = `0:${game.timer.toString().padStart(2, '0')}`;
            if(game.timer <= 0) stopGame();
        }, 1000);
    });

    target.addEventListener('click', (e) => {
        e.stopPropagation();
        if(!game.running) return;
        game.totalMs += (performance.now() - game.lastSpawn);
        game.score++;
        document.getElementById('conteo-aciertos').innerText = `Aciertos: ${game.score}`;
        spawn();
    });

    document.body.addEventListener('click', () => {
        if(!game.running) return;
        game.misses++;
        document.getElementById('conteo-fallos').innerText = `Fallos: ${game.misses}`;
        document.body.style.backgroundColor = "#300";
        setTimeout(() => { document.body.style.backgroundColor = "#0a0a0a"; }, 80);
    });
});

function stopGame() {
    game.running = false;
    document.getElementById('target').classList.add('hidden');
    document.getElementById('menu-fin').classList.remove('hidden');
    document.getElementById('res-aciertos').innerText = game.score;
    document.getElementById('res-fallos').innerText = game.misses;
    const avg = game.score > 0 ? (game.totalMs / game.score).toFixed(0) : 0;
    document.getElementById('res-ms').innerText = avg;
}
