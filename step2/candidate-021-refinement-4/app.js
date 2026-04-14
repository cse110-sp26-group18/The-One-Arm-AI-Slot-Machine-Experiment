// THE ONE-ARM AI — a slot machine that roasts the AI industry.
// Vanilla JS. No frameworks. No dignity.

const SYMBOLS = [
  { id: "robot",   glyph: "🤖", name: "Hallucinating Chatbot", payout: 10, weight: 10 },
  { id: "brain",   glyph: "🧠", name: "Synthetic Cortex",      payout: 20, weight: 7  },
  { id: "chip",    glyph: "💾", name: "Dataset (scraped)",     payout: 15, weight: 8  },
  { id: "bolt",    glyph: "⚡", name: "Compute",               payout: 25, weight: 6  },
  { id: "fire",    glyph: "🔥", name: "Training Run",          payout: 40, weight: 4  },
  { id: "money",   glyph: "💸", name: "Burn Rate",             payout: 5,  weight: 9  },
  { id: "diamond", glyph: "💎", name: "AGI (allegedly)",       payout: 500, weight: 1 },
];

const SPIN_COST = 5;
const STORAGE_KEY = "oneArmAI.tokens.v1";

const LOSS_QUIPS = [
  "Hallucinated. No refunds.",
  "Model collapse. Try retraining.",
  "Out of context window.",
  "Your prompt was filtered. By vibes.",
  "The loss function just laughed at you.",
  "404: Intelligence not found.",
  "Reward model said no.",
  "That's not a bug, it's an emergent behavior.",
  "Quantized straight into the void.",
  "The stochastic parrot demands tribute.",
  "Jensen Huang sheds one (1) leather tear.",
  "Your GPU is screaming. Literally.",
];

const WIN_QUIPS = [
  "Alignment achieved. Temporarily.",
  "The benchmark has been gamed!",
  "Shipped before safety review.",
  "VCs nodding approvingly.",
  "Added to the training set. You're welcome.",
  "Publish the paper, ignore the caveats.",
];

const JACKPOT_QUIPS = [
  "💎 AGI ACHIEVED. Please ignore the 47 disclaimers. 💎",
  "💎 SINGULARITY UNLOCKED. Tech-bros rejoice. 💎",
  "💎 SUPERINTELLIGENCE!!! (it's just three emojis) 💎",
];

// ---- State ----
const state = {
  tokens: loadTokens(),
  spinning: false,
  history: [],
};

function loadTokens() {
  const saved = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(saved) && saved > 0 ? saved : 100;
}
function saveTokens() {
  localStorage.setItem(STORAGE_KEY, String(state.tokens));
}

// ---- DOM ----
const tokenEl  = document.getElementById("tokenCount");
const ctxEl    = document.getElementById("contextWindow");
const msgEl    = document.getElementById("message");
const spinBtn  = document.getElementById("spinBtn");
const resetBtn = document.getElementById("resetBtn");
const logEl    = document.getElementById("logList");
const strips   = Array.from(document.querySelectorAll(".strip"));

// ---- Init ----
buildPaytable();
strips.forEach((strip, i) => renderStrip(strip, pickSymbol(), pickSymbol(), pickSymbol()));
updateHUD();
updateContextWindow();

spinBtn.addEventListener("click", spin);
resetBtn.addEventListener("click", begForTokens);
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); spin(); }
});

function updateHUD() {
  tokenEl.textContent = state.tokens;
  tokenEl.style.color = state.tokens < SPIN_COST ? "var(--red)" : "var(--gold-hot)";
  spinBtn.disabled = state.spinning || state.tokens < SPIN_COST;
}

function updateContextWindow() {
  // Pure comedy HUD: shrinks as you play, because context windows always do.
  const base = ["∞", "2M", "128K", "32K", "8K", "4K", "2K", "🤏"];
  const step = Math.min(base.length - 1, Math.floor(state.history.length / 3));
  ctxEl.textContent = base[step];
}

function buildPaytable() {
  const list = document.getElementById("paytableList");
  SYMBOLS.slice().sort((a, b) => b.payout - a.payout).forEach(sym => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="sym">${sym.glyph}${sym.glyph}${sym.glyph}</span>
      <span class="desc">${sym.name}</span>
      <span class="payout">+${sym.payout}</span>
    `;
    list.appendChild(li);
  });
  const li = document.createElement("li");
  li.innerHTML = `
    <span class="sym">🤖⚡🧠</span>
    <span class="desc">Any two matching (consolation prompt)</span>
    <span class="payout">+2</span>
  `;
  list.appendChild(li);
}

// ---- Reel helpers ----
function pickSymbol() {
  const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of SYMBOLS) {
    if ((r -= s.weight) <= 0) return s;
  }
  return SYMBOLS[0];
}

function renderStrip(strip, top, mid, bot) {
  strip.innerHTML = "";
  for (const sym of [top, mid, bot]) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = sym.glyph;
    strip.appendChild(cell);
  }
  strip.dataset.symbol = mid.id;
}

// ---- Audio (Web Audio API, generated — no asset files) ----
let audioCtx = null;
function beep(freq, duration = 0.08, type = "square", gain = 0.04) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (_) { /* silent on autoplay block */ }
}
function jackpotFanfare() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => setTimeout(() => beep(f, 0.18, "triangle", 0.07), i * 140));
}

// ---- Spin ----
async function spin() {
  if (state.spinning || state.tokens < SPIN_COST) return;

  state.spinning = true;
  state.tokens -= SPIN_COST;
  saveTokens();
  updateHUD();
  setMessage("Sampling tokens… consuming a small lake for cooling…", "");

  strips.forEach(s => s.classList.add("spinning"));
  beep(220, 0.06);

  const results = [pickSymbol(), pickSymbol(), pickSymbol()];
  const stopDelays = [600, 900, 1250];

  await Promise.all(strips.map((strip, i) => new Promise(resolve => {
    setTimeout(() => {
      strip.classList.remove("spinning");
      renderStrip(strip, pickSymbol(), results[i], pickSymbol());
      beep(440 + i * 120, 0.08, "square");
      resolve();
    }, stopDelays[i]);
  })));

  evaluate(results);
  state.spinning = false;
  updateHUD();
  updateContextWindow();
}

function evaluate(results) {
  const [a, b, c] = results;
  const allMatch = a.id === b.id && b.id === c.id;
  const twoMatch = !allMatch && (a.id === b.id || b.id === c.id || a.id === c.id);

  if (allMatch && a.id === "diamond") {
    const payout = a.payout;
    state.tokens += payout;
    saveTokens();
    const quip = pick(JACKPOT_QUIPS);
    setMessage(`${quip}  +${payout} tokens`, "jackpot");
    logIncident(`${a.glyph}${b.glyph}${c.glyph} JACKPOT! +${payout}`, "jackpot");
    jackpotFanfare();
    navigator.vibrate?.([50, 30, 50, 30, 200]);
    return;
  }

  if (allMatch) {
    const payout = a.payout;
    state.tokens += payout;
    saveTokens();
    const quip = pick(WIN_QUIPS);
    setMessage(`Three ${a.name}! ${quip}  +${payout} tokens`, "win");
    logIncident(`${a.glyph}${b.glyph}${c.glyph} Three of a kind — +${payout}`, "win");
    beep(660, 0.18, "triangle", 0.06);
    navigator.vibrate?.(80);
    return;
  }

  if (twoMatch) {
    const payout = 2;
    state.tokens += payout;
    saveTokens();
    setMessage(`Two matches. The benchmark was technically beaten. +${payout}`, "win");
    logIncident(`${a.glyph}${b.glyph}${c.glyph} Pair — +${payout}`, "win");
    beep(520, 0.1, "triangle", 0.05);
    return;
  }

  const quip = pick(LOSS_QUIPS);
  setMessage(`${a.glyph}${b.glyph}${c.glyph}  ${quip}`, "lose");
  logIncident(`${a.glyph}${b.glyph}${c.glyph} ${quip}`, "lose");
  beep(120, 0.14, "sawtooth", 0.04);
}

function setMessage(text, cls) {
  msgEl.textContent = text;
  msgEl.className = "message" + (cls ? " " + cls : "");
}

function logIncident(text, cls) {
  state.history.push({ text, cls });
  const li = document.createElement("li");
  li.textContent = text;
  if (cls) li.className = cls;
  logEl.prepend(li);
  while (logEl.children.length > 40) logEl.removeChild(logEl.lastChild);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function begForTokens() {
  if (state.tokens >= SPIN_COST) {
    setMessage("You still have tokens. The Series A will have to wait.", "");
    return;
  }
  state.tokens += 50;
  saveTokens();
  updateHUD();
  setMessage("Fresh funding round closed. Diluted, but liquid. +50 tokens", "win");
  logIncident("💰 Begged for 50 tokens from imaginary VCs", "win");
}
