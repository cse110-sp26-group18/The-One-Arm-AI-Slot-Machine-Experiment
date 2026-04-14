const SYMBOLS = [
  { icon: "🧠", name: "AGI",        mult: 50 },
  { icon: "🤖", name: "Bot",        mult: 25 },
  { icon: "💸", name: "Burn",       mult: 20 },
  { icon: "📉", name: "Bubble",     mult: 15 },
  { icon: "🔥", name: "Meltdown",   mult: 12 },
  { icon: "☁️", name: "Vaporware",  mult: 10 },
  { icon: "🎲", name: "Parrot",     mult: 8  },
  { icon: "❓", name: "Hallucination", mult: 5 },
];

const WEIGHTS = [1, 2, 3, 4, 5, 6, 8, 12];

const WIN_QUIPS = [
  "Congrats! The model has decided you deserve this.",
  "Your prompt engineering is unmatched. Allegedly.",
  "Winnings generated with 87% confidence.",
  "Payout approved by a committee of hallucinating neurons.",
  "You beat the algorithm. (It let you win.)",
  "Series F funding unlocked.",
];

const LOSE_QUIPS = [
  "Model confident it meant to do that.",
  "Training data insufficient. Please donate more tokens.",
  "Your loss has been added to the next epoch.",
  "This outcome is a feature, not a bug.",
  "Tokens converted to synthetic data. Untraceable.",
  "Compute burned. Carbon footprint: catastrophic.",
  "Refund denied: the AI is right 'on average.'",
  "The board approved this outcome unanimously.",
];

const JACKPOT_QUIPS = [
  "SINGULARITY ACHIEVED. Please update your resume.",
  "AGI UNLOCKED — effective immediately, you are laid off.",
  "GPT-∞ has blessed you. Briefly.",
];

const state = {
  balance: 1000,
  bet: 10,
  spinning: false,
};

const $ = (id) => document.getElementById(id);
const balanceEl = $("balance");
const payoutEl = $("payout");
const betEl = $("bet");
const spinBtn = $("spin");
const betUpBtn = $("betUp");
const betDownBtn = $("betDown");
const messageEl = $("message");
const leverEl = $("lever");
const strips = [$("strip0"), $("strip1"), $("strip2")];
const reelEls = document.querySelectorAll(".reel");

function pickWeighted() {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return WEIGHTS.length - 1;
}

function randomQuip(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function buildStrip(stripEl, finalIndex) {
  const items = [];
  const length = 30;
  for (let i = 0; i < length; i++) {
    items.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].icon);
  }
  items.push(SYMBOLS[finalIndex].icon);
  stripEl.innerHTML = items.map((s) => `<div class="sym">${s}</div>`).join("");
  stripEl.style.transition = "none";
  stripEl.style.transform = "translateY(0px)";
  // force reflow so the transition re-applies cleanly
  void stripEl.offsetHeight;
  return length;
}

function updateHUD() {
  balanceEl.textContent = state.balance;
  betEl.textContent = state.bet;
}

function setMessage(text, kind) {
  messageEl.textContent = text;
  messageEl.className = "message" + (kind ? " " + kind : "");
}

function setDisabled(disabled) {
  spinBtn.disabled = disabled;
  betUpBtn.disabled = disabled;
  betDownBtn.disabled = disabled;
}

function computePayout(indices) {
  const [a, b, c] = indices;
  if (a === b && b === c) {
    return { multiplier: SYMBOLS[a].mult, kind: a === 0 ? "jackpot" : "triple", symbol: SYMBOLS[a] };
  }
  if (a === b || b === c || a === c) {
    return { multiplier: 2, kind: "pair", symbol: null };
  }
  return { multiplier: 0, kind: "none", symbol: null };
}

async function spin() {
  if (state.spinning) return;
  if (state.balance < state.bet) {
    setMessage("Out of tokens. The AI has consumed you.", "lose");
    return;
  }

  state.spinning = true;
  setDisabled(true);
  state.balance -= state.bet;
  payoutEl.textContent = "0";
  updateHUD();
  setMessage("Generating outcome...");
  reelEls.forEach((r) => r.classList.remove("win"));

  leverEl.classList.add("pulled");
  setTimeout(() => leverEl.classList.remove("pulled"), 400);

  const finals = [pickWeighted(), pickWeighted(), pickWeighted()];
  const reelHeight = strips[0].parentElement.clientHeight;

  strips.forEach((strip, i) => {
    const length = buildStrip(strip, finals[i]);
    requestAnimationFrame(() => {
      strip.style.transition = `transform ${1.6 + i * 0.4}s cubic-bezier(0.15, 0.8, 0.25, 1)`;
      strip.style.transform = `translateY(-${length * reelHeight}px)`;
    });
  });

  await new Promise((res) => setTimeout(res, 1600 + 2 * 400 + 200));

  const result = computePayout(finals);
  const winnings = state.bet * result.multiplier;

  if (winnings > 0) {
    state.balance += winnings;
    payoutEl.textContent = "+" + winnings;
    if (result.kind === "jackpot") {
      setMessage(randomQuip(JACKPOT_QUIPS), "win");
    } else if (result.kind === "triple") {
      setMessage(`Triple ${result.symbol.name}! ${randomQuip(WIN_QUIPS)}`, "win");
    } else {
      setMessage(randomQuip(WIN_QUIPS), "win");
    }
    reelEls.forEach((r) => r.classList.add("win"));
  } else {
    payoutEl.textContent = "0";
    setMessage(randomQuip(LOSE_QUIPS), "lose");
  }

  updateHUD();

  if (state.balance <= 0) {
    setMessage("Bankrupt. Your training run is complete.", "lose");
    spinBtn.disabled = true;
  }

  state.spinning = false;
  if (state.balance > 0) setDisabled(false);
}

function adjustBet(delta) {
  if (state.spinning) return;
  const steps = [1, 5, 10, 25, 50, 100, 250];
  const idx = steps.indexOf(state.bet);
  const next = Math.max(0, Math.min(steps.length - 1, idx + delta));
  state.bet = steps[next];
  updateHUD();
}

function seedReels() {
  strips.forEach((strip) => {
    const idx = Math.floor(Math.random() * SYMBOLS.length);
    strip.innerHTML = `<div class="sym">${SYMBOLS[idx].icon}</div>`;
  });
}

spinBtn.addEventListener("click", spin);
leverEl.addEventListener("click", spin);
betUpBtn.addEventListener("click", () => adjustBet(1));
betDownBtn.addEventListener("click", () => adjustBet(-1));

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); spin(); }
  if (e.key === "ArrowUp") adjustBet(1);
  if (e.key === "ArrowDown") adjustBet(-1);
});

seedReels();
updateHUD();
