/* ═══════════════════════════════════════════════════
   The One-Arm AI  —  Slot Machine App
   ═══════════════════════════════════════════════════ */

// ── Symbol definitions ──────────────────────────────
// Each symbol has an emoji, a snarky AI label, a weight
// (higher = more common), and a multiplier for 3-of-a-kind.
const SYMBOLS = [
  { emoji: "🤖", label: "GPT",        weight: 20, multiplier: 2  },
  { emoji: "🧠", label: "LLM",        weight: 18, multiplier: 3  },
  { emoji: "💀", label: "Hallucinate", weight: 16, multiplier: 4  },
  { emoji: "🔥", label: "Overfitting", weight: 14, multiplier: 5  },
  { emoji: "📉", label: "Loss Curve",  weight: 12, multiplier: 7  },
  { emoji: "🦾", label: "Singularity", weight: 6,  multiplier: 15 },
  { emoji: "💎", label: "AGI",         weight: 3,  multiplier: 30 },
];

// Build a weighted pool for random picks
const POOL = [];
SYMBOLS.forEach((sym, idx) => {
  for (let i = 0; i < sym.weight; i++) POOL.push(idx);
});

// Snarky messages for wins and losses
const WIN_MESSAGES = [
  "The model hallucinated in your favor!",
  "Congratulations, you've been over-fitted to winning!",
  "Your prompt engineering paid off!",
  "The attention mechanism attended to your wallet!",
  "Training complete — reward function maximized!",
  "You've discovered the latent space of money!",
  "The gradient descended right into your pocket!",
  "RLHF says: here's your human feedback!",
];

const LOSE_MESSAGES = [
  "Tokens burned. Context window: empty.",
  "That prompt was rejected by the safety filter.",
  "Model confidence: 99%. Model accuracy: 0%.",
  "You've been rate-limited by the house.",
  "The transformer transformed your tokens into nothing.",
  "Loss function is working as intended.",
  "Your fine-tuning data was garbage in, garbage out.",
  "Inference failed. Please deposit more tokens.",
  "That's what you get for zero-shot gambling.",
  "The AI alignment problem just aligned against you.",
];

const JACKPOT_MESSAGES = [
  "AGI ACHIEVED! (at least for your wallet)",
  "You've passed the Turing Test of gambling!",
  "The singularity is here — and it's PAYING OUT!",
];

// ── State ───────────────────────────────────────────
const BET_STEPS = [10, 25, 50, 100, 250, 500];
let betIndex = 2; // start at 50
let tokens = 1000;
let spinning = false;

// ── DOM refs ────────────────────────────────────────
const tokenCountEl = document.getElementById("token-count");
const betAmountEl = document.getElementById("bet-amount");
const spinBtn = document.getElementById("spin-btn");
const betUpBtn = document.getElementById("bet-up");
const betDownBtn = document.getElementById("bet-down");
const messageEl = document.getElementById("message");
const historyList = document.getElementById("history-list");
const reelEls = [
  document.getElementById("reel-0"),
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
];
const reelContainers = document.querySelectorAll(".reel-container");

// ── Init ────────────────────────────────────────────
buildPaytable();
renderReels(pickRandom(), pickRandom(), pickRandom()); // initial idle display
updateDisplay();

// ── Event listeners ─────────────────────────────────
spinBtn.addEventListener("click", spin);
betUpBtn.addEventListener("click", () => changeBet(1));
betDownBtn.addEventListener("click", () => changeBet(-1));

// Keyboard: space / enter to spin
document.addEventListener("keydown", (e) => {
  if ((e.code === "Space" || e.code === "Enter") && !spinning) {
    e.preventDefault();
    spin();
  }
});

// ── Core spin logic ─────────────────────────────────
async function spin() {
  if (spinning) return;
  const bet = BET_STEPS[betIndex];
  if (tokens < bet) {
    showMessage("Insufficient tokens. Try a lower bet or touch grass.", true);
    return;
  }

  spinning = true;
  spinBtn.disabled = true;
  messageEl.innerHTML = "&nbsp;";
  clearWinHighlights();

  // Deduct bet
  tokens -= bet;
  updateDisplay();

  // Pick final results
  const results = [pickRandom(), pickRandom(), pickRandom()];

  // Animate reels with staggered stops
  await Promise.all(reelEls.map((el, i) => animateReel(el, i, results[i])));

  // Evaluate
  const payout = evaluate(results, bet);
  tokens += payout;
  updateDisplay();

  // Flash token counter
  if (payout > 0) {
    tokenCountEl.classList.add("win-flash");
    setTimeout(() => tokenCountEl.classList.remove("win-flash"), 600);
  } else {
    tokenCountEl.classList.add("lose-flash");
    setTimeout(() => tokenCountEl.classList.remove("lose-flash"), 600);
  }

  // Highlight winning reels
  if (payout > 0) {
    reelContainers.forEach((c) => c.classList.add("winner"));
  }

  // Message
  if (payout > 0) {
    const isJackpot = results[0] === results[1] && results[1] === results[2] &&
                      SYMBOLS[results[0]].label === "AGI";
    const pool = isJackpot ? JACKPOT_MESSAGES : WIN_MESSAGES;
    showMessage(`+${payout} tk! ${pick(pool)}`);
  } else {
    showMessage(pick(LOSE_MESSAGES), true);
  }

  // Log
  addHistory(results, bet, payout);

  // Check bankruptcy
  if (tokens <= 0) {
    setTimeout(() => {
      showMessage("Model collapsed. Restarting with 1000 tk (VC funding round).", true);
      tokens = 1000;
      updateDisplay();
    }, 1500);
  }

  spinning = false;
  spinBtn.disabled = false;
}

// ── Reel animation ──────────────────────────────────
function animateReel(reelEl, index, finalSymbol) {
  return new Promise((resolve) => {
    const totalSpins = 12 + index * 5; // stagger: later reels spin longer
    let tick = 0;
    const reelHeight = reelEl.parentElement.clientHeight;

    // Pre-build strip: random symbols + final
    const strip = [];
    for (let i = 0; i < totalSpins; i++) strip.push(pickRandom());
    strip.push(finalSymbol);

    // Render all symbols into reel
    reelEl.innerHTML = "";
    strip.forEach((symIdx) => {
      const div = document.createElement("div");
      div.className = "reel-symbol";
      div.innerHTML = `${SYMBOLS[symIdx].emoji}<span class="sym-label">${SYMBOLS[symIdx].label}</span>`;
      reelEl.appendChild(div);
    });

    // Animate by stepping through symbols
    let current = 0;
    const baseInterval = 50;

    function step() {
      if (current >= strip.length - 1) {
        reelEl.style.transform = `translateY(-${current * reelHeight}px)`;
        resolve();
        return;
      }
      reelEl.style.transform = `translateY(-${current * reelHeight}px)`;
      current++;

      // Ease out: slow down near the end
      const remaining = strip.length - 1 - current;
      let delay = baseInterval;
      if (remaining < 5) delay = baseInterval + (5 - remaining) * 40;

      setTimeout(step, delay);
    }

    step();
  });
}

// ── Render static reels (for initial display) ───────
function renderReels(a, b, c) {
  [a, b, c].forEach((symIdx, i) => {
    reelEls[i].innerHTML = "";
    const div = document.createElement("div");
    div.className = "reel-symbol";
    div.innerHTML = `${SYMBOLS[symIdx].emoji}<span class="sym-label">${SYMBOLS[symIdx].label}</span>`;
    reelEls[i].appendChild(div);
    reelEls[i].style.transform = "translateY(0)";
  });
}

// ── Evaluate payout ─────────────────────────────────
function evaluate(results, bet) {
  const [a, b, c] = results;

  // Three of a kind
  if (a === b && b === c) {
    return bet * SYMBOLS[a].multiplier;
  }

  // Two of a kind
  if (a === b || b === c || a === c) {
    const matched = a === b ? a : (b === c ? b : a);
    // Small payout: return the bet (break even) for common, 1.5x for rarer
    const sym = SYMBOLS[matched];
    if (sym.multiplier >= 7) return Math.floor(bet * 2);
    if (sym.multiplier >= 4) return Math.floor(bet * 1.5);
    return Math.floor(bet * 1);
  }

  // No match
  return 0;
}

// ── Helpers ─────────────────────────────────────────
function pickRandom() {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function changeBet(dir) {
  if (spinning) return;
  betIndex = Math.max(0, Math.min(BET_STEPS.length - 1, betIndex + dir));
  updateDisplay();
}

function updateDisplay() {
  tokenCountEl.textContent = tokens.toLocaleString();
  betAmountEl.textContent = BET_STEPS[betIndex];
}

function showMessage(text, isLoss = false) {
  messageEl.textContent = text;
  messageEl.style.color = isLoss ? "var(--danger)" : "var(--neon-green)";
}

function clearWinHighlights() {
  reelContainers.forEach((c) => c.classList.remove("winner"));
}

// ── History log ─────────────────────────────────────
function addHistory(results, bet, payout) {
  const icons = results.map((r) => SYMBOLS[r].emoji).join(" ");
  const li = document.createElement("li");
  const net = payout - bet;
  const sign = net >= 0 ? "+" : "";
  li.innerHTML = `
    <span>${icons} &mdash; bet ${bet} tk</span>
    <span class="log-result ${net >= 0 ? "win" : "lose"}">${sign}${net} tk</span>
  `;
  historyList.prepend(li);

  // Keep last 50 entries
  while (historyList.children.length > 50) {
    historyList.removeChild(historyList.lastChild);
  }
}

// ── Paytable ────────────────────────────────────────
function buildPaytable() {
  const grid = document.getElementById("paytable");
  SYMBOLS.forEach((sym) => {
    const row = document.createElement("div");
    row.className = "pay-row";
    row.innerHTML = `
      <span class="pay-icons">${sym.emoji}${sym.emoji}${sym.emoji}</span>
      <span class="pay-mult">${sym.multiplier}x</span>
      <span>${sym.label}</span>
    `;
    grid.appendChild(row);
  });
}
