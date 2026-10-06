const board = document.getElementById("board");
const stepEl = document.getElementById("step");
const statusEl = document.getElementById("status");
const autoBtn = document.getElementById("autoSolve");
const resetBtn = document.getElementById("reset");
const removeAllBtn = document.getElementById("removeAll");



// 初始状态：全上（1 表示在架上）
let state = Array(N).fill(1);
let steps = 0;
let animating = false;


/* ---------- 渲染 ---------- */
function buildBoard() {
    board.innerHTML = '<div class="rail"></div>';
    for (let i = 0; i < N; i++) {
        const ring = document.createElement("div");
        ring.className = "ring";
        ring.dataset.index = i;
        // 均匀分布
        ring.style.left = (60 + i * 52) + "px";
        ring.addEventListener("click", () => tryMove(i));
        board.appendChild(ring);
    }
}

function render() {
    document.querySelectorAll(".ring").forEach((el, i) => {
        el.classList.toggle("on",  state[i] === 1);
        el.classList.toggle("off", state[i] === 0);
        el.classList.toggle("clickable", !animating && isValid(state, i));
    });
    stepEl.textContent = steps;
    statusEl.textContent = state.every(x => x === 0)
        ? "🎉 全部解下，完成！" : "目标：全部解下";
}

/* ---------- 规则判断（与后端保持一致）---------- */
function isValid(s, i) {
    if (i === 0) return true;
    if (s[i - 1] !== 1) return false;
    for (let j = 0; j < i - 1; j++) {
        if (s[j] === 1) return false;
    }
    return true;
}

/* ---------- 玩家点击 ---------- */
function tryMove(i) {
    if (animating) return;
    if (!isValid(state, i)) {
        statusEl.textContent = `❌ 第 ${i + 1} 环现在不能动`;
        setTimeout(render, 800);
        return;
    }
    state[i] ^= 1;
    steps++;
    render();
}

/* ---------- 自动求解 ---------- */
async function autoSolve() {
    if (animating) return;
    const password = prompt("请输入密码以启用自动求解：");
    if (password !== "159730") {
        statusEl.textContent = "❌ 不要偷懒呦";
        return;
    }
    const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, password })
    });
    const { moves } = await res.json();

    if (moves.length === 0) {
        statusEl.textContent = "已经是全部解下状态啦";
        return;
    }

    animating = true;
    autoBtn.disabled = resetBtn.disabled = removeAllBtn.disabled = true;

    for (const i of moves) {
        state[i] ^= 1;
        steps++;
        render();
        await new Promise(r => setTimeout(r, 220));
    }

    animating = false;
    autoBtn.disabled = resetBtn.disabled = removeAllBtn.disabled = false;
    render();
}

/* ---------- 重置 ---------- */
function reset() {
    if (animating) return;
    state = Array(N).fill(1);
    steps = 0;
    render();
}
// ---------- 弹出彩蛋 ---------- */
function showSecretOnce() {
    // 显示自定义的过关文字
    const toast = document.createElement('div');
    toast.textContent = '🎉 你过关！🎉';
    toast.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        font-size: 3rem; font-weight: bold; color: #ffcc00; 
        text-shadow: 2px 2px 10px rgba(0,0,0,0.5); z-index: 9999;
        animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    document.body.appendChild(toast);

    // 生成彩带
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(confetti);
        
        // 动画结束后清理DOM
        setTimeout(() => confetti.remove(), 4000);
    }

    // 3秒后移除文字
    setTimeout(() => toast.remove(), 3000);
}
/* ---------- 全部解下（一键放完，不演示过程）---------- */
async function removeAll() {
    if (animating) return;
    const password = prompt("请输入密码以启用一键解下：");
    if (password !== "159730") {
        statusEl.textContent = "❌ 不要偷懒呦";
        return;
    }
    const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, password })
    });
    const { moves } = await res.json();
    for (const i of moves) state[i] ^= 1;
    steps += moves.length;
    render();

    if(state.every(x => x === 0)) {
        showSecretOnce();
    }
}

/* ---------- 启动 ---------- */
buildBoard();
render();

autoBtn.addEventListener("click", autoSolve);
resetBtn.addEventListener("click", reset);
removeAllBtn.addEventListener("click", removeAll);


