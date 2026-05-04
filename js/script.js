const CONFIG = { TIME: 60, PC: 85, MOB: 70, BREAK: 768 };
let state = { active: false, t: CONFIG.TIME, hit: 0, miss: 0, rSum: 0, last: 0, sz: CONFIG.PC };

function sync() {
    state.sz = window.innerWidth <= CONFIG.BREAK ? CONFIG.MOB : CONFIG.PC;
}

function spawn() {
    if (!state.active) return;
    const tg = document.getElementById('target-circle');
    const pad = 40;
    const mx = window.innerWidth - state.sz - pad;
    const my = window.innerHeight - state.sz - (pad + 100);
    const x = Math.floor(Math.random() * (mx - pad + 1)) + pad;
    const y = Math.floor(Math.random() * (my - (pad + 100) + 1)) + (pad + 100);
    tg.style.width = state.sz + "px";
    tg.style.height = state.sz + "px";
    tg.style.left = x + "px";
    tg.style.top = y + "px";
    tg.classList.remove('oculto');
    state.last = performance.now();
}

document.addEventListener('DOMContentLoaded', () => {
    sync();
    window.onresize = sync;
    const sBtn = document.getElementById('boton-iniciar');
    const tg = document.getElementById('target-circle');

    sBtn.onclick = () => {
        state.active = true;
        document.getElementById('pantalla-inicio').classList.add('oculto');
        document.getElementById('ui-overlay').classList.remove('oculto');
        spawn();
        const clock = setInterval(() => {
            if (!state.active) return clearInterval(clock);
            state.t--;
            document.getElementById('reloj').innerText = `00:${state.t.toString().padStart(2, '0')}`;
            if (state.t <= 0) finish();
        }, 1000);
    };

    tg.onclick = (e) => {
        e.stopPropagation();
        if (!state.active) return;
        state.rSum += (performance.now() - state.last);
        state.hit++;
        document.getElementById('puntos').innerText = state.hit;
        spawn();
    };

    document.body.onclick = () => {
        if (!state.active) return;
        state.miss++;
        document.getElementById('fallos').innerText = state.miss;
        document.body.style.backgroundColor = "#300";
        setTimeout(() => { document.body.style.backgroundColor = "#0a0a0a"; }, 100);
    };
});

function finish() {
    state.active = false;
    document.getElementById('target-circle').classList.add('oculto');
    document.getElementById('pantalla-final').classList.remove('oculto');
    const total = state.hit + state.miss;
    const acc = total > 0 ? Math.round((state.hit / total) * 100) : 0;
    const ms = state.hit > 0 ? Math.round(state.rSum / state.hit) : 0;
    document.getElementById('res-aciertos').innerText = state.hit;
    document.getElementById('res-tiempo').innerText = ms + " ms";
    document.getElementById('res-precision').innerText = acc + "%";
}
