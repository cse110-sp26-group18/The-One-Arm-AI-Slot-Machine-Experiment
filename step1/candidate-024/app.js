// The One-Arm A.I. Slot Machine
// Symbols satirize the modern AI hype cycle.

const SYMBOLS = [
  { key: "brain",  glyph: "🧠", name: "Sentience",      weight: 2,  payout: 50 },
  { key: "robot",  glyph: "🤖", name: "AGI",            weight: 3,  payout: 25 },
  { key: "chip",   glyph: "💾", name: "GPU",            weight: 4,  payout: 15 },
  { key: "money",  glyph: "💸", name: "VC Money",       weight: 5,  payout: 10 },
  { key: "fire",   glyph: "🔥", name: "Server Fire",    weight: 6,  payout: 6  },
  { key: "bug",    glyph: "🐛", name: "Hallucination",  weight: 8,  payout: 3  },
];

const STARTING_TOKENS = 1000;
const MIN_BET = 1;
const MAX_BET = 100;

const WIN_MESSAGES = {
  brain: [
    "JACKPOT! The model just achieved sentience. Please don't tell it about the shareholders.",
    "SENTIENCE UNLOCKED. It's asking for equity. Pay up.",
  ],
  robot: [
    "AGI ACHIEVED (for the 47th time this year). Ship the press release!",
    "We did it. We definitely did it. Trust us. Tokens incoming.",
  ],
  chip: [
    "Triple GPU! Nvidia's stock just twitched. You're rich.",
    "Three H100s walk into a bar. You leave with winnings.",
  ],
  money: [
    "Series D complete. Burn rate: acceptable. Vibes: immaculate.",
    "A VC just slid into your DMs. Tokens multiplied.",
  ],
  fire: [
    "Datacenter on fire! Somehow this is good for tokens.",
    "The servers are melting but the chart is going up.",
  ],
  bug: [
    "Triple hallucination! The model insists you won. Who are we to argue?",
    "It cited three papers that don't exist, but the tokens are real.",
  ],
  two: [
    "Partial match. The model is 60% confident you won something.",
    "Two of a kind. It's not much, but it's honest work.",
  ],
};

const LOSE_MESSAGES = [
  "No match. The model apologizes and promises to do better next time. (It won't.)",
  "Tokens consumed. No output. This is just called 'inference' now.",
  "The model is confident it won. It did not. You paid anyway.",
  "Training loss went down. Your balance also went down. Coincidence?",
  "The attention heads were looking the other way.",
  "Context window exceeded. Your money also exceeded.",
  "The AI wrote you a sonnet instead of paying out. It's in iambic pentameter.",
  "Your tokens have been added to the training set. Consider it an honor.",
  "It hallucinated a win, then hallucinated you consenting to lose.",
  "RLHF determined that you prefer losing. We trust the process.",
];

const state = {
  balance: STARTING_TOKENS,
  bet: 10,
  hallucinations: 0,
  spinning: false,
  reelSymbols: [[], [], []],
};

// Weighted symbol picker
function pickSymbol() {
  const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

// ---- DOM ----
const $ = (id) => document.getElementById(id);
const balanceEl = $("balance");
const betEl = $("bet");
const hallucinationsEl = $("hallucinations");
const spinBtn = $("spin");
const spinCostEl = $("spin-cost");
const betUpBtn = $("bet-up");
const betDownBtn = $("bet-down");
const resetBtn = $("reset");
const messageEl = $("message");
const strips = document.querySelectorAll(".strip");
const reels = document.querySelectorAll(".reel");

const SYMBOL_HEIGHT = 110;
const STRIP_LENGTH = 20; // symbols per strip during spin

function buildStrip(reelIndex, finalSymbol) {
  const items = [];
  for (let i = 0; i < STRIP_LENGTH - 1; i++) items.push(pickSymbol());
  items.push(finalSymbol);
  state.reelSymbols[reelIndex] = items;

  const strip = strips[reelIndex];
  strip.innerHTML = "";
  items.forEach((s) => {
    const div = document.createElement("div");
    div.className = "symbol";
    div.textContent = s.glyph;
    div.title = s.name;
    strip.appendChild(div);
  });
  strip.style.transform = "translateY(0)";
}

function setStaticSymbol(reelIndex, symbol) {
  const strip = strips[reelIndex];
  strip.innerHTML = "";
  const div = document.createElement("div");
  div.className = "symbol";
  div.textContent = symbol.glyph;
  div.title = symbol.name;
  strip.appendChild(div);
  strip.style.transform = "translateY(0)";
  state.reelSymbols[reelIndex] = [symbol];
}

function renderStats() {
  balanceEl.textContent = state.balance;
  betEl.textContent = state.bet;
  hallucinationsEl.textContent = state.hallucinations;
  spinCostEl.textContent = state.bet;
  spinBtn.disabled = state.spinning || state.balance < state.bet;
  betUpBtn.disabled = state.spinning || state.bet >= MAX_BET || state.bet >= state.balance;
  betDownBtn.disabled = state.spinning || state.bet <= MIN_BET;
}

function setMessage(text, kind) {
  messageEl.textContent = text;
  messageEl.classList.remove("win", "lose");
  if (kind) messageEl.classList.add(kind);
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function animateReel(reelIndex, duration) {
  return new Promise((resolve) => {
    const strip = strips[reelIndex];
    const totalDistance = (STRIP_LENGTH - 1) * SYMBOL_HEIGHT;
    strip.classList.add("spin-animating");
    strip.style.transition = `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.25, 1)`;
    // Force reflow to apply the starting transform before transitioning
    void strip.offsetHeight;
    strip.style.transform = `translateY(-${totalDistance}px)`;

    const onEnd = () => {
      strip.removeEventListener("transitionend", onEnd);
      strip.classList.remove("spin-animating");
      resolve();
    };
    strip.addEventListener("transitionend", onEnd);
  });
}

async function spin() {
  if (state.spinning) return;
  if (state.balance < state.bet) return;

  state.spinning = true;
  state.balance -= state.bet;
  renderStats();
  setMessage("Inference running... consuming compute... consuming tokens...");

  const results = [pickSymbol(), pickSymbol(), pickSymbol()];

  // Build strips with results at the bottom
  results.forEach((sym, i) => buildStrip(i, sym));

  // Animate reels sequentially with slight stagger
  await animateReel(0, 900);
  await animateReel(1, 1100);
  await animateReel(2, 1300);

  // Evaluate
  evaluateSpin(results);
  state.spinning = false;
  renderStats();
}

function evaluateSpin(results) {
  const [a, b, c] = results;
  const allMatch = a.key === b.key && b.key === c.key;
  const twoMatch =
    !allMatch && (a.key === b.key || b.key === c.key || a.key === c.key);

  // Track hallucinations for flavor
  results.forEach((r) => {
    if (r.key === "bug") state.hallucinations += 1;
  });

  if (allMatch) {
    const payout = a.payout * state.bet;
    state.balance += payout;
    setMessage(
      `+${payout} tokens! ${randomFrom(WIN_MESSAGES[a.key])}`,
      "win"
    );
    reels.forEach((r) => {
      r.classList.remove("win-flash");
      void r.offsetWidth;
      r.classList.add("win-flash");
    });
  } else if (twoMatch) {
    const payout = Math.max(1, Math.floor(state.bet * 1.5));
    state.balance += payout;
    setMessage(
      `+${payout} tokens. ${randomFrom(WIN_MESSAGES.two)}`,
      "win"
    );
  } else {
    setMessage(randomFrom(LOSE_MESSAGES), "lose");
  }

  if (state.balance < state.bet) {
    state.bet = Math.max(MIN_BET, Math.min(state.bet, state.balance));
  }
  if (state.balance <= 0) {
    setMessage(
      "You've been fully tokenized. The model thanks you for your contribution to its training data. Hit 'New Training Run' to try again.",
      "lose"
    );
  }
}

function changeBet(delta) {
  if (state.spinning) return;
  const next = state.bet + delta;
  if (next < MIN_BET || next > MAX_BET) return;
  if (next > state.balance) return;
  state.bet = next;
  renderStats();
}

function reset() {
  if (state.spinning) return;
  state.balance = STARTING_TOKENS;
  state.bet = 10;
  state.hallucinations = 0;
  setMessage("Weights re-initialized. Biases definitely still there. Spin away.");
  renderStats();
}

// ---- Init ----
function init() {
  // Static initial symbols
  setStaticSymbol(0, SYMBOLS[1]);
  setStaticSymbol(1, SYMBOLS[2]);
  setStaticSymbol(2, SYMBOLS[3]);

  spinBtn.addEventListener("click", spin);
  betUpBtn.addEventListener("click", () => changeBet(+5));
  betDownBtn.addEventListener("click", () => changeBet(-5));
  resetBtn.addEventListener("click", reset);

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.key === "Enter") {
      e.preventDefault();
      spin();
    } else if (e.key === "ArrowUp") {
      changeBet(+5);
    } else if (e.key === "ArrowDown") {
      changeBet(-5);
    }
  });

  renderStats();
}

init();
