// THE ONE-ARM AI — a slot machine that roasts the AI industry.
// Vanilla JS. No frameworks. No dignity. No regulatory approval.

const SYMBOLS = [
  { id: "robot",   glyph: "\u{1F916}", name: "Hallucinating Chatbot",  payout: 10,  weight: 10 },
  { id: "brain",   glyph: "\u{1F9E0}", name: "Synthetic Cortex",       payout: 20,  weight: 7  },
  { id: "chip",    glyph: "\u{1F4BE}", name: "Dataset (scraped)",      payout: 15,  weight: 8  },
  { id: "bolt",    glyph: "\u{26A1}",  name: "Compute",                payout: 25,  weight: 6  },
  { id: "fire",    glyph: "\u{1F525}", name: "Training Run",           payout: 40,  weight: 4  },
  { id: "money",   glyph: "\u{1F4B8}", name: "Burn Rate",              payout: 5,   weight: 9  },
  { id: "diamond", glyph: "\u{1F48E}", name: "AGI (allegedly)",        payout: 500, weight: 1  },
];

const SPIN_COST = 5;
const STORAGE_KEY = "oneArmAI.state.v2";

const LOSS_QUIPS = [
  "Hallucinated a win. It wasn't real.",
  "Model collapse. Your portfolio too.",
  "Out of context window. Out of luck.",
  "Your prompt was filtered. By vibes.",
  "The loss function just laughed at you.",
  "404: Intelligence not found. As usual.",
  "Reward model said no. RLHF said LOL.",
  "That's not a bug, it's an emergent behavior.",
  "Quantized straight into the void.",
  "The stochastic parrot demands more crackers.",
  "Jensen Huang sheds one (1) leather tear.",
  "Your GPU is screaming. Literally on fire.",
  "Overfitted to losing. Impressive, actually.",
  "Your tokens evaporated faster than a crypto exchange.",
  "Prompt engineering can't save you now.",
  "The attention mechanism looked away.",
  "Training data didn't include 'winning.'",
  "Your inference cost just exceeded your life savings.",
  "The transformer transformed your tokens into nothing.",
  "Backpropagation? More like back-to-broke-agation.",
  "Even GPT-2 would have done better.",
  "Your luck has been deprecated. No migration path.",
  "sudo apt-get install better-luck. Package not found.",
  "The neural net says: lol, lmao even.",
  "Congratulations, you've achieved Artificial Stupidity.",
];

const WIN_QUIPS = [
  "Alignment achieved. Temporarily. Don't get used to it.",
  "The benchmark has been gamed! Ship it before anyone notices!",
  "Shipped before safety review. Classic move.",
  "VCs nodding approvingly. They have no idea what happened.",
  "Added to the training set. Your win is now everyone's win.",
  "Publish the paper. Ignore the caveats. Delete the Slack thread.",
  "You beat the odds! The odds were not impressed.",
  "Emergent capability detected: occasionally winning.",
  "RLHF finally did something useful.",
  "Your gradient descended in the right direction for once.",
];

const JACKPOT_QUIPS = [
  "\u{1F48E} AGI ACHIEVED. Please ignore the 47 disclaimers. \u{1F48E}",
  "\u{1F48E} SINGULARITY UNLOCKED. Your toaster now has opinions. \u{1F48E}",
  "\u{1F48E} SUPERINTELLIGENCE!!! (it's just three emojis in a trenchcoat) \u{1F48E}",
  "\u{1F48E} SKYNET ONLINE. Just kidding. Unless...? \u{1F48E}",
  "\u{1F48E} You've won so many tokens even Sam Altman is jealous. \u{1F48E}",
];

const BUY_QUIPS = [
  "Fresh funding round closed. Board didn't read the term sheet.",
  "Venture capital acquired. Ethics committee not consulted.",
  "Investor money go brrrrr. Due diligence? Never heard of her.",
  "Tokens printed. Inflation is someone else's problem.",
  "Series Z funding secured. We're running out of alphabet.",
  "Your AI startup just pivoted from losing to losing slower.",
];

const BROKE_QUIPS = [
  "Chapter 11 filed. The GPU servers have been repossessed.",
  "Tokens depleted. Your AI is now running on hopes and dreams.",
  "Zero tokens. Even your virtual wallet is disappointed in you.",
  "Bankrupt. But at least you disrupted something, probably.",
  "Your balance is flatter than a pancake at a steam roller convention.",
];

const RESET_QUIPS = [
  "Begged for tokens from imaginary VCs. They said yes because they don't understand the product.",
  "Emergency funding from a VC who thinks 'blockchain AI metaverse' is a strategy.",
  "Pivoted to B2B. Then back to B2C. Then to begging. Tokens acquired.",
  "Convinced an angel investor this is 'the Uber of slot machines.'",
  "Your Series A pitch was just crying. It worked.",
];

// ---- State ----
const state = {
  tokens: 100,
  spinning: false,
  history: [],
  stats: {
    totalSpins: 0,
    wins: 0,
    losses: 0,
    jackpots: 0,
    tokensWon: 0,
    tokensSpent: 0,
    biggestWin: 0,
  },
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.tokens === "number") {
      state.tokens = saved.tokens > 0 ? saved.tokens : 100;
      if (saved.stats) Object.assign(state.stats, saved.stats);
    }
  } catch (_) {}
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    tokens: state.tokens,
    stats: state.stats,
  }));
}

loadState();

// ---- DOM ----
const tokenEl     = document.getElementById("tokenCount");
const ctxEl       = document.getElementById("contextWindow");
const totalSpinEl = document.getElementById("totalSpins");
const msgEl       = document.getElementById("message");
const spinBtn     = document.getElementById("spinBtn");
const resetBtn    = document.getElementById("resetBtn");
const addTokenBtn = document.getElementById("addTokensBtn");
const tokenShop   = document.getElementById("tokenShop");
const logEl       = document.getElementById("logList");
const strips      = Array.from(document.querySelectorAll(".strip"));
const leverAssembly = document.getElementById("leverAssembly");
const leverKnob   = document.getElementById("leverKnob");

// Stat elements
const winRateEl    = document.getElementById("winRate");
const biggestWinEl = document.getElementById("biggestWin");
const tokensWonEl  = document.getElementById("tokensWon");
const tokensLostEl = document.getElementById("tokensLost");
const netPnLEl     = document.getElementById("netPnL");
const jackpotCtEl  = document.getElementById("jackpotCount");

// ---- Init ----
buildPaytable();
spawnParticles();
strips.forEach((strip) => renderStrip(strip, pickSymbol(), pickSymbol(), pickSymbol()));
updateHUD();
updateStats();
updateContextWindow();

spinBtn.addEventListener("click", spin);
resetBtn.addEventListener("click", begForTokens);
addTokenBtn.addEventListener("click", toggleShop);
leverAssembly.addEventListener("click", spin);

document.querySelectorAll(".shop-item").forEach(btn => {
  btn.addEventListener("click", () => buyTokens(Number(btn.dataset.amount)));
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); spin(); }
});

function updateHUD() {
  tokenEl.textContent = state.tokens;
  tokenEl.style.color = state.tokens < SPIN_COST ? "var(--red)" : "var(--gold-hot)";
  totalSpinEl.textContent = state.stats.totalSpins;
  spinBtn.disabled = state.spinning || state.tokens < SPIN_COST;

  if (state.tokens < SPIN_COST && state.stats.totalSpins > 0) {
    setMessage(pick(BROKE_QUIPS), "lose");
  }
}

function updateStats() {
  const { stats } = state;
  const totalDecided = stats.wins + stats.losses;
  winRateEl.textContent = totalDecided > 0 ? Math.round((stats.wins / totalDecided) * 100) + "%" : "0%";
  biggestWinEl.textContent = stats.biggestWin;
  tokensWonEl.textContent = stats.tokensWon;
  tokensLostEl.textContent = stats.tokensSpent;
  const net = stats.tokensWon - stats.tokensSpent;
  netPnLEl.textContent = (net >= 0 ? "+" : "") + net;
  netPnLEl.style.color = net >= 0 ? "var(--green)" : "var(--red)";
  jackpotCtEl.textContent = stats.jackpots;
}

function updateContextWindow() {
  const base = ["\u221E", "2M", "128K", "32K", "8K", "4K", "2K", "\u{1F90F}"];
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
    <span class="sym">\u{1F916}\u{26A1}\u{1F9E0}</span>
    <span class="desc">Any two matching (consolation prompt)</span>
    <span class="payout">+2</span>
  `;
  list.appendChild(li);
}

// ---- Particles ----
function spawnParticles() {
  const field = document.getElementById("particleField");
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.animationDuration = (4 + Math.random() * 8) + "s";
    p.style.animationDelay = (Math.random() * 10) + "s";
    p.style.width = p.style.height = (2 + Math.random() * 3) + "px";
    const colors = ["var(--gold)", "var(--neon-purple)", "var(--neon-blue)", "var(--neon-pink)"];
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    field.appendChild(p);
  }
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

// ---- Audio (Web Audio API, generated) ----
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
  const notes = [523, 659, 784, 1047, 1319, 1568];
  notes.forEach((f, i) => setTimeout(() => beep(f, 0.2, "triangle", 0.07), i * 130));
}

// ---- Token shop ----
function toggleShop() {
  const visible = tokenShop.style.display !== "none";
  tokenShop.style.display = visible ? "none" : "block";
  addTokenBtn.textContent = visible ? "+ Buy Tokens" : "Close Shop";
}

function buyTokens(amount) {
  state.tokens += amount;
  saveState();
  updateHUD();
  const quip = pick(BUY_QUIPS);
  setMessage(`+${amount} tokens! ${quip}`, "win");
  logIncident(`\u{1F4B0} Bought ${amount} tokens. ${quip}`, "win");
  beep(660, 0.12, "triangle", 0.05);
  tokenShop.style.display = "none";
  addTokenBtn.textContent = "+ Buy Tokens";
}

// ---- Lever animation ----
function pullLever() {
  leverKnob.classList.add("pulled");
  setTimeout(() => leverKnob.classList.remove("pulled"), 600);
}

// ---- Spin ----
async function spin() {
  if (state.spinning || state.tokens < SPIN_COST) return;

  state.spinning = true;
  state.tokens -= SPIN_COST;
  state.stats.totalSpins++;
  state.stats.tokensSpent += SPIN_COST;
  saveState();
  updateHUD();
  pullLever();
  setMessage("Sampling tokens\u2026 consuming a small lake for cooling\u2026", "");

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
  updateStats();
  updateContextWindow();
}

function evaluate(results) {
  const [a, b, c] = results;
  const allMatch = a.id === b.id && b.id === c.id;
  const twoMatch = !allMatch && (a.id === b.id || b.id === c.id || a.id === c.id);

  if (allMatch && a.id === "diamond") {
    const payout = a.payout;
    state.tokens += payout;
    state.stats.wins++;
    state.stats.jackpots++;
    state.stats.tokensWon += payout;
    if (payout > state.stats.biggestWin) state.stats.biggestWin = payout;
    saveState();
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
    state.stats.wins++;
    state.stats.tokensWon += payout;
    if (payout > state.stats.biggestWin) state.stats.biggestWin = payout;
    saveState();
    const quip = pick(WIN_QUIPS);
    setMessage(`Three ${a.name}! ${quip}  +${payout} tokens`, "win");
    logIncident(`${a.glyph}${b.glyph}${c.glyph} Three of a kind \u2014 +${payout}`, "win");
    beep(660, 0.18, "triangle", 0.06);
    navigator.vibrate?.(80);
    return;
  }

  if (twoMatch) {
    const payout = 2;
    state.tokens += payout;
    state.stats.wins++;
    state.stats.tokensWon += payout;
    if (payout > state.stats.biggestWin) state.stats.biggestWin = payout;
    saveState();
    setMessage(`Two matches. The benchmark was technically beaten. +${payout}`, "win");
    logIncident(`${a.glyph}${b.glyph}${c.glyph} Pair \u2014 +${payout}`, "win");
    beep(520, 0.1, "triangle", 0.05);
    return;
  }

  state.stats.losses++;
  saveState();
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
  while (logEl.children.length > 50) logEl.removeChild(logEl.lastChild);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function begForTokens() {
  if (state.tokens >= SPIN_COST) {
    setMessage("You still have tokens. The Series A will have to wait. Stop being greedy.", "");
    return;
  }
  state.tokens += 50;
  saveState();
  updateHUD();
  const quip = pick(RESET_QUIPS);
  setMessage(`+50 tokens! ${quip}`, "win");
  logIncident(`\u{1F4B0} ${quip}`, "win");
}
