// ── Symbol Definitions ──────────────────────────────────────
// Each symbol: emoji, name, weight (higher = more common), payout multiplier
const SYMBOLS = [
  { emoji: "\u{1F916}", name: "Robot",          weight: 8,  payout: 3   },
  { emoji: "\u{1F9E0}", name: "Brain",          weight: 7,  payout: 4   },
  { emoji: "\u{1F4A1}", name: "Hallucination",  weight: 6,  payout: 5   },
  { emoji: "\u{26A1}",  name: "GPU",            weight: 5,  payout: 8   },
  { emoji: "\u{1F525}", name: "Dumpster Fire",  weight: 4,  payout: 12  },
  { emoji: "\u{1F4B0}", name: "VC Money",       weight: 3,  payout: 20  },
  { emoji: "\u{1F680}", name: "AGI (lol)",      weight: 1,  payout: 50  },
];

// Two-of-a-kind pays 1/4 of the three-of-a-kind payout
const TWO_OF_A_KIND_DIVISOR = 4;

// ── Game State ──────────────────────────────────────────────
const STARTING_TOKENS = 1000;
const SPIN_COST = 50;

let tokens = STARTING_TOKENS;
let spinning = false;

// ── DOM References ──────────────────────────────────────────
const tokenCountEl  = document.getElementById("token-count");
const spinCostEl    = document.getElementById("spin-cost");
const messageBox    = document.getElementById("message-box");
const messageText   = document.getElementById("message-text");
const leverBtn      = document.getElementById("lever");
const slotWindow    = document.querySelector(".slot-window");
const reels         = [
  document.getElementById("reel-0"),
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
];

// ── Snark Messages ──────────────────────────────────────────
const WIN_MESSAGES = [
  "The model predicted you'd win. Broken clock, twice a day.",
  "Congratulations! Your tokens are still worthless!",
  "You've been rewarded for your prompt engineering skills.",
  "The AI giveth... and mostly taketh.",
  "This result was hallucinated. But the tokens are real!",
  "Training data suggests you should keep playing.",
  "Winner! (Results may not be reproducible.)",
  "The neural net smiles upon you. It has no mouth, but it smiles.",
  "Token generation successful. Context window: still empty.",
  "You beat the transformer. It will remember this. It won't, actually.",
];

const LOSE_MESSAGES = [
  "Tokens burned. Much like a GPU cluster in July.",
  "The AI has determined your luck is not statistically significant.",
  "Your tokens were used to fine-tune disappointment.",
  "Loss function: working as intended.",
  "That's what happens when you don't add enough RLHF.",
  "The model confidently predicted you'd win. It was wrong. Again.",
  "Your tokens vanished, like ethics in a startup pitch deck.",
  "Have you tried prompt-engineering your luck?",
  "Error 402: Payment required. Also, you lost.",
  "The attention mechanism paid zero attention to your bet.",
  "Inference complete: you lost.",
  "Your tokens were sacrificed to the scaling laws.",
];

const BROKE_MESSAGES = [
  "Out of tokens. Just like GPT at max context length.",
  "Bankrupt! Time to raise a Series A and try again.",
  "Your token budget has been exhausted. Much like the engineers at OpenAI.",
  "0 tokens remaining. The singularity of your wallet.",
];

// ── Weighted Random Pick ────────────────────────────────────
function weightedPick() {
  const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let r = Math.random() * totalWeight;
  for (const symbol of SYMBOLS) {
    r -= symbol.weight;
    if (r <= 0) return symbol;
  }
  return SYMBOLS[0];
}

function randomMessage(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Build Paytable ──────────────────────────────────────────
function buildPaytable() {
  const grid = document.getElementById("paytable-grid");
  for (const s of SYMBOLS) {
    // Three of a kind
    const row3 = document.createElement("div");
    row3.className = "pay-row";
    row3.innerHTML = `
      <span class="symbols">${s.emoji}${s.emoji}${s.emoji}</span>
      <span class="payout">${s.payout * SPIN_COST}</span>
    `;
    grid.appendChild(row3);
  }
}

// ── Populate Reel Strip ─────────────────────────────────────
// Each reel gets a shuffled pool of symbols (for the blur animation)
// plus the final result cell at position 0
function buildReelStrip(reelEl, finalSymbol) {
  const strip = reelEl.querySelector(".reel-strip");
  strip.innerHTML = "";

  // Build a pool: several copies for visual variety during spin
  const pool = [];
  for (let i = 0; i < 3; i++) {
    for (const s of SYMBOLS) {
      pool.push(s.emoji);
    }
  }
  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Final symbol at top (will be shown when animation stops)
  const finalCell = document.createElement("div");
  finalCell.className = "reel-cell";
  finalCell.textContent = finalSymbol.emoji;
  strip.appendChild(finalCell);

  // Filler cells for animation
  for (const emoji of pool) {
    const cell = document.createElement("div");
    cell.className = "reel-cell";
    cell.textContent = emoji;
    strip.appendChild(cell);
  }
}

// ── Update Display ──────────────────────────────────────────
function updateTokens() {
  tokenCountEl.textContent = tokens;
}

function showMessage(text, type) {
  messageBox.className = "message-box";
  if (type) messageBox.classList.add(type);
  messageText.textContent = text;
}

// ── Evaluate Outcome ────────────────────────────────────────
function evaluate(results) {
  const names = results.map(r => r.name);

  // Three of a kind
  if (names[0] === names[1] && names[1] === names[2]) {
    const multiplier = results[0].payout;
    return { win: true, amount: multiplier * SPIN_COST, match: 3 };
  }

  // Two of a kind
  if (names[0] === names[1] || names[1] === names[2] || names[0] === names[2]) {
    let matchSymbol;
    if (names[0] === names[1]) matchSymbol = results[0];
    else if (names[1] === names[2]) matchSymbol = results[1];
    else matchSymbol = results[0];

    const amount = Math.floor((matchSymbol.payout * SPIN_COST) / TWO_OF_A_KIND_DIVISOR);
    return { win: amount > 0, amount, match: 2 };
  }

  return { win: false, amount: 0, match: 0 };
}

// ── Spin Logic ──────────────────────────────────────────────
async function spin() {
  if (spinning) return;

  // Check funds
  if (tokens < SPIN_COST) {
    showMessage(randomMessage(BROKE_MESSAGES), "lose");
    return;
  }

  spinning = true;
  leverBtn.disabled = true;
  slotWindow.classList.remove("win-glow");

  // Deduct cost
  tokens -= SPIN_COST;
  updateTokens();

  // Pick results
  const results = [weightedPick(), weightedPick(), weightedPick()];

  // Start spin animation on all reels
  reels.forEach((reel, i) => {
    buildReelStrip(reel, results[i]);
    reel.classList.add("spinning");
  });

  showMessage("Generating tokens...", "");

  // Stop reels one by one with delays
  for (let i = 0; i < 3; i++) {
    await delay(600 + i * 400);
    reels[i].classList.remove("spinning");
    // Reset transform so cell 0 (the result) is visible
    reels[i].querySelector(".reel-strip").style.transform = "translateY(0)";
  }

  // Small pause for dramatic effect
  await delay(300);

  // Evaluate
  const outcome = evaluate(results);

  if (outcome.win) {
    tokens += outcome.amount;
    updateTokens();
    slotWindow.classList.add("win-glow");

    const label = outcome.match === 3 ? "THREE OF A KIND!" : "Two of a kind!";
    showMessage(
      `${label} +${outcome.amount} tokens! ${randomMessage(WIN_MESSAGES)}`,
      "win"
    );
  } else {
    showMessage(randomMessage(LOSE_MESSAGES), "lose");
  }

  spinning = false;
  leverBtn.disabled = false;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Event Listeners ─────────────────────────────────────────
leverBtn.addEventListener("click", spin);

// Spacebar / Enter also triggers
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Enter") {
    if (document.activeElement === leverBtn || document.activeElement === document.body) {
      e.preventDefault();
      spin();
    }
  }
});

// ── Init ────────────────────────────────────────────────────
spinCostEl.textContent = SPIN_COST;
updateTokens();
buildPaytable();

// Set initial reel faces
reels.forEach((reel) => {
  buildReelStrip(reel, SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
  reel.querySelector(".reel-strip").style.transform = "translateY(0)";
});
