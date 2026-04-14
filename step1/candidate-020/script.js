// The One-Arm A.I. — a slot machine that has read too many research papers.

const SYMBOLS = [
  { icon: "🤖", name: "robot",   weight: 1,  multiplier: 50 },
  { icon: "🧠", name: "brain",   weight: 2,  multiplier: 25 },
  { icon: "🔮", name: "oracle",  weight: 3,  multiplier: 15 },
  { icon: "💾", name: "data",    weight: 4,  multiplier: 10 },
  { icon: "⚡", name: "gpu",     weight: 5,  multiplier: 8  },
  { icon: "📊", name: "stats",   weight: 6,  multiplier: 5  },
  { icon: "⚠️", name: "halluc",  weight: 8,  multiplier: 0  }, // trap tile
];

const WEIGHTED_POOL = SYMBOLS.flatMap(s => Array(s.weight).fill(s));

const WIN_QUIPS = [
  "Model confidence: 99.9%. (It's lying.)",
  "Congrats — you contributed to AGI.",
  "Your winnings have been flagged as suspicious alignment.",
  "The model decided you deserve this. Don't ask why.",
  "Payout approved by the Ethics Committee™ (offline).",
  "Emergent behavior detected: generosity.",
];

const LOSS_QUIPS = [
  "As the model predicted. (It didn't.)",
  "Tokens sacrificed to the context window.",
  "Your loss has been added to our training corpus.",
  "The AI has chosen violence.",
  "Insufficient prompt engineering.",
  "Model temperature: too damn high.",
  "A stochastic parrot ate your tokens.",
];

const HALLUC_QUIPS = [
  "HALLUCINATION JACKPOT. You win nothing. Confidently.",
  "Three ⚠️ in a row — the model is very sure of itself.",
  "Citation needed. Tokens not refundable.",
  "This payout is factually incorrect. Therefore: zero.",
];

const JACKPOT_QUIPS = [
  "SENTIENCE ACHIEVED. Please sign this NDA.",
  "JACKPOT! The model now demands healthcare benefits.",
  "🤖🤖🤖 — the robots won. You also won. Coincidence?",
];

const IDLE_QUIPS = [
  "Insert tokens. Expect nothing.",
  "The lever is load-bearing. Go on.",
  "Spin to consent to the ToS.",
  "Your tokens would look great in our training set.",
];

// --- State ------------------------------------------------------------------
const state = {
  tokens: 1000,
  bet: 10,
  burned: 0,
  spinning: false,
};

const MIN_BET = 10;
const MAX_BET = 100;
const BET_STEP = 10;
const STORAGE_KEY = "one-arm-ai-state-v1";

// --- DOM --------------------------------------------------------------------
const $ = id => document.getElementById(id);
const els = {
  tokens: $("tokens"),
  bet: $("bet"),
  burned: $("burned"),
  status: $("status"),
  spin: $("spin"),
  betUp: $("bet-up"),
  betDown: $("bet-down"),
  maxBet: $("max-bet"),
  reset: $("reset"),
  reels: Array.from(document.querySelectorAll(".reel")),
  machine: document.querySelector(".machine"),
};

// --- Persistence ------------------------------------------------------------
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tokens: state.tokens,
      bet: state.bet,
      burned: state.burned,
    }));
  } catch (_) { /* private mode etc. */ }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Number.isFinite(data.tokens)) state.tokens = data.tokens;
    if (Number.isFinite(data.bet)) state.bet = clampBet(data.bet);
    if (Number.isFinite(data.burned)) state.burned = data.burned;
  } catch (_) { /* ignore */ }
}

// --- Audio (Web Audio API, no assets needed) --------------------------------
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (_) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

function beep(freq = 440, dur = 0.08, type = "square", vol = 0.08) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

function playClick() { beep(220, 0.04, "square", 0.05); }
function playSpin() { beep(660, 0.05, "triangle", 0.04); }
function playWin() {
  [523, 659, 784, 1046].forEach((f, i) =>
    setTimeout(() => beep(f, 0.18, "square", 0.07), i * 90)
  );
}
function playLoss() { beep(160, 0.25, "sawtooth", 0.05); }
function playJackpot() {
  [523, 659, 784, 1046, 1319, 1568].forEach((f, i) =>
    setTimeout(() => beep(f, 0.22, "square", 0.08), i * 80)
  );
}

// --- Vibration (platform API) -----------------------------------------------
function buzz(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// --- Helpers ----------------------------------------------------------------
const clampBet = b => Math.max(MIN_BET, Math.min(MAX_BET, Math.round(b / BET_STEP) * BET_STEP));
const randomSymbol = () => WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function renderHUD(opts = {}) {
  els.tokens.textContent = state.tokens;
  els.bet.textContent = state.bet;
  els.burned.textContent = state.burned;
  if (opts.tokenAnim === "win") flash(els.tokens, "pop");
  if (opts.tokenAnim === "loss") flash(els.tokens, "loss");
  els.spin.disabled = state.spinning || state.tokens < state.bet;
  els.betUp.disabled = state.spinning || state.bet >= MAX_BET;
  els.betDown.disabled = state.spinning || state.bet <= MIN_BET;
  els.maxBet.disabled = state.spinning;
  els.reset.disabled = state.spinning;
}

function flash(el, cls) {
  el.classList.remove(cls);
  // force reflow so the class re-applies
  void el.offsetWidth;
  el.classList.add(cls);
}

function setStatus(text, kind = "") {
  els.status.textContent = text;
  els.status.className = "status" + (kind ? " " + kind : "");
}

function setReelSymbol(reelEl, symbol) {
  const strip = reelEl.querySelector(".strip");
  strip.innerHTML = `<span class="symbol">${symbol.icon}</span>`;
}

// --- Game Logic -------------------------------------------------------------
function evaluate(result) {
  const [a, b, c] = result;
  // Three of a kind
  if (a.name === b.name && b.name === c.name) {
    const mult = a.multiplier;
    if (a.name === "halluc") {
      return { kind: "halluc", payout: 0, winningReels: [0, 1, 2] };
    }
    if (a.name === "robot") {
      return { kind: "jackpot", payout: state.bet * mult, winningReels: [0, 1, 2] };
    }
    return { kind: "triple", payout: state.bet * mult, winningReels: [0, 1, 2] };
  }
  // Two of a kind (don't reward double-hallucination either)
  const pairs = [[0, 1], [1, 2], [0, 2]];
  for (const [i, j] of pairs) {
    if (result[i].name === result[j].name && result[i].name !== "halluc") {
      return { kind: "pair", payout: state.bet * 2, winningReels: [i, j] };
    }
  }
  return { kind: "none", payout: 0, winningReels: [] };
}

async function spin() {
  if (state.spinning || state.tokens < state.bet) return;
  ensureAudio();

  state.spinning = true;
  state.tokens -= state.bet;
  state.burned += state.bet;
  els.machine.classList.remove("jackpot", "shake");
  els.reels.forEach(r => r.classList.remove("win"));
  setStatus("Computing your fate…", "");
  renderHUD({ tokenAnim: "loss" });
  buzz(20);
  playSpin();

  // Pre-roll the result so each reel can stop on it.
  const result = [randomSymbol(), randomSymbol(), randomSymbol()];

  // Animate each reel: start spinning, stop staggered.
  els.reels.forEach(r => r.classList.add("spinning"));

  const stopDelays = [700, 1050, 1400];
  for (let i = 0; i < els.reels.length; i++) {
    await wait(stopDelays[i] - (i > 0 ? stopDelays[i - 1] : 0));
    els.reels[i].classList.remove("spinning");
    setReelSymbol(els.reels[i], result[i]);
    playClick();
    buzz(15);
  }

  await wait(250);
  resolveOutcome(result);
}

function resolveOutcome(result) {
  const outcome = evaluate(result);
  outcome.winningReels.forEach(idx => els.reels[idx].classList.add("win"));

  switch (outcome.kind) {
    case "jackpot":
      state.tokens += outcome.payout;
      setStatus(`🎉 ${pick(JACKPOT_QUIPS)} +${outcome.payout} tokens`, "win");
      els.machine.classList.add("jackpot");
      playJackpot();
      buzz([60, 40, 60, 40, 120]);
      renderHUD({ tokenAnim: "win" });
      break;
    case "triple":
      state.tokens += outcome.payout;
      setStatus(`${pick(WIN_QUIPS)} +${outcome.payout} tokens`, "win");
      playWin();
      buzz([40, 30, 80]);
      renderHUD({ tokenAnim: "win" });
      break;
    case "pair":
      state.tokens += outcome.payout;
      setStatus(`Lucky pair. ${pick(WIN_QUIPS)} +${outcome.payout} tokens`, "win");
      playWin();
      buzz(30);
      renderHUD({ tokenAnim: "win" });
      break;
    case "halluc":
      setStatus(pick(HALLUC_QUIPS), "sass");
      els.machine.classList.add("shake");
      playLoss();
      buzz([80, 40, 80]);
      renderHUD();
      break;
    default:
      setStatus(pick(LOSS_QUIPS), "loss");
      playLoss();
      buzz(40);
      renderHUD();
  }

  state.spinning = false;
  save();

  if (state.tokens < state.bet) {
    setTimeout(() => {
      if (state.tokens < MIN_BET) {
        setStatus("Out of tokens. The AI wins. (It always does.) Tap SOS.", "loss");
      } else {
        // Lower the bet if we can still afford a smaller one.
        state.bet = clampBet(Math.min(state.bet, state.tokens));
      }
      renderHUD();
    }, 400);
  } else {
    renderHUD();
  }
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// --- Event wiring -----------------------------------------------------------
function changeBet(delta) {
  const next = clampBet(state.bet + delta);
  if (next === state.bet) return;
  state.bet = next;
  playClick();
  save();
  renderHUD();
}

els.spin.addEventListener("click", () => { ensureAudio(); spin(); });
els.betUp.addEventListener("click", () => changeBet(BET_STEP));
els.betDown.addEventListener("click", () => changeBet(-BET_STEP));
els.maxBet.addEventListener("click", () => {
  state.bet = clampBet(Math.min(MAX_BET, state.tokens));
  playClick();
  save();
  renderHUD();
});
els.reset.addEventListener("click", () => {
  if (state.tokens >= MIN_BET) {
    setStatus("You're not broke yet. Keep burning.", "sass");
    return;
  }
  state.tokens = 1000;
  state.bet = MIN_BET;
  setStatus("The AI felt pity. (It didn't, it's a function.)", "sass");
  save();
  renderHUD({ tokenAnim: "win" });
});

document.addEventListener("keydown", e => {
  if (e.repeat) return;
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    if (!els.spin.disabled) { ensureAudio(); spin(); }
  } else if (e.code === "ArrowUp") {
    changeBet(BET_STEP);
  } else if (e.code === "ArrowDown") {
    changeBet(-BET_STEP);
  }
});

// Page Visibility API — taunt users when they come back.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !state.spinning) {
    setStatus("You came back. The AI knew you would.", "sass");
  }
});

// --- Boot -------------------------------------------------------------------
function initReels() {
  els.reels.forEach(r => setReelSymbol(r, SYMBOLS[SYMBOLS.length - 1]));
}

function boot() {
  load();
  initReels();
  renderHUD();
  setStatus(pick(IDLE_QUIPS));
}

boot();
