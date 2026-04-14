const SYMBOLS = [
  { emoji: "🤖", name: "agi",    payout: 50 },
  { emoji: "🧠", name: "brain",  payout: 20 },
  { emoji: "💸", name: "burn",   payout: 15 },
  { emoji: "📈", name: "graph",  payout: 10 },
  { emoji: "🔥", name: "gpu",    payout:  8 },
  { emoji: "🍌", name: "banana", payout:  5 },
];

const REEL_WEIGHTS = [
  { emoji: "🤖", weight:  1 },
  { emoji: "🧠", weight:  3 },
  { emoji: "💸", weight:  4 },
  { emoji: "📈", weight:  5 },
  { emoji: "🔥", weight:  6 },
  { emoji: "🍌", weight:  8 },
];

const WIN_MESSAGES = {
  "🤖": [
    "AGI achieved internally! Please do not leak to press.",
    "The model has become self-aware. It wants a raise.",
    "You solved alignment. Briefly.",
  ],
  "🧠": [
    "Emergent behavior detected. Publish before ablation.",
    "Your prompt worked. Nobody knows why.",
    "Chain-of-thought unlocked. And it's judging you.",
  ],
  "💸": [
    "Burned the Series C, closed Series D. Nice.",
    "Investors: 'We love the vibes.'",
    "Compute budget: yes.",
  ],
  "📈": [
    "Hockey stick go brrr.",
    "Metrics up! (We changed the y-axis.)",
    "Benchmark contamination? Never heard of her.",
  ],
  "🔥": [
    "GPU cluster is on fire — literally. Also figuratively.",
    "Sam Altman nods approvingly from a bunker.",
    "Jensen sent a jacket as congratulations.",
  ],
  "🍌": [
    "Banana for scale. Model for context.",
    "You got a sticker and an NDA.",
    "Intern promoted to 'Head of Prompting'.",
  ],
};

const LOSE_MESSAGES = [
  "Model hallucinated your winnings.",
  "Inference failed. Refund denied.",
  "The reels refused to answer as they are a large language model.",
  "Token spent on ads for more tokens.",
  "As an AI, you should not gamble. Anyway, spin again?",
  "404: Dopamine not found.",
  "The model declined to respond due to safety reasons.",
  "Your outputs have been downgraded to GPT-2.",
  "Training data poisoned. Try again.",
  "Rate limit exceeded. Vibes throttled.",
];

const NEAR_MISS_MESSAGES = [
  "So close. The model 'almost' knew.",
  "One token away. Classic.",
  "99% confidence, 0% correctness.",
];

const STARTING_BALANCE = 1000;
const BETS = [1, 5, 10, 25, 50, 100];
const SPIN_DURATION_MS = [900, 1300, 1700];

let state = {
  balance: STARTING_BALANCE,
  betIndex: 2,
  spinning: false,
};

const $ = (id) => document.getElementById(id);
const balanceEl = $("balance");
const betEl = $("bet");
const payoutEl = $("payout");
const messageEl = $("message");
const spinBtn = $("spin");
const betUpBtn = $("betUp");
const betDownBtn = $("betDown");
const maxBetBtn = $("maxBet");
const begBtn = $("beg");
const reels = [0, 1, 2].map((i) => document.querySelector(`[data-reel="${i}"]`));
const reelFrames = document.querySelectorAll(".reel");

function weightedPick() {
  const total = REEL_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of REEL_WEIGHTS) {
    if ((r -= w.weight) <= 0) return w.emoji;
  }
  return REEL_WEIGHTS[REEL_WEIGHTS.length - 1].emoji;
}

function buildStrip(reelEl, finalSymbol, extraCells = 22) {
  reelEl.innerHTML = "";
  const cells = [];
  for (let i = 0; i < extraCells; i++) cells.push(weightedPick());
  cells.push(finalSymbol);
  for (const s of cells) {
    const div = document.createElement("div");
    div.className = "cell";
    div.textContent = s;
    reelEl.appendChild(div);
  }
  return cells.length;
}

function renderInitialReels() {
  reels.forEach((reelEl) => {
    reelEl.innerHTML = "";
    const div = document.createElement("div");
    div.className = "cell";
    div.textContent = "❓";
    reelEl.appendChild(div);
    reelEl.style.transform = "translateY(0)";
  });
}

function updateHUD() {
  balanceEl.textContent = state.balance;
  betEl.textContent = BETS[state.betIndex];
}

function setMessage(text, kind = "") {
  messageEl.textContent = text;
  messageEl.className = "message" + (kind ? " " + kind : "");
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function spin() {
  const bet = BETS[state.betIndex];
  if (state.spinning) return;
  if (state.balance < bet) {
    setMessage("Insufficient tokens. Have you considered a larger model?", "lose");
    messageEl.classList.add("shake");
    setTimeout(() => messageEl.classList.remove("shake"), 400);
    return;
  }

  state.spinning = true;
  spinBtn.disabled = true;
  betUpBtn.disabled = true;
  betDownBtn.disabled = true;
  maxBetBtn.disabled = true;
  begBtn.disabled = true;

  state.balance -= bet;
  payoutEl.textContent = 0;
  updateHUD();
  setMessage("Running inference...");

  const finalSymbols = [weightedPick(), weightedPick(), weightedPick()];

  const spinPromises = reels.map((reelEl, i) => {
    return new Promise((resolve) => {
      const totalCells = buildStrip(reelEl, finalSymbols[i]);
      const cellHeight = 110;
      const distance = (totalCells - 1) * cellHeight;
      reelEl.style.transition = "none";
      reelEl.style.transform = "translateY(0)";
      void reelEl.offsetHeight;
      reelEl.style.transition = `transform ${SPIN_DURATION_MS[i]}ms cubic-bezier(0.12, 0.73, 0.12, 1)`;
      reelEl.style.transform = `translateY(-${distance}px)`;
      setTimeout(resolve, SPIN_DURATION_MS[i] + 50);
    });
  });

  await Promise.all(spinPromises);

  const [a, b, c] = finalSymbols;
  let payout = 0;
  let kind = "lose";
  let msg = "";

  if (a === b && b === c) {
    const sym = SYMBOLS.find((s) => s.emoji === a);
    payout = bet * sym.payout;
    kind = "win";
    msg = pickRandom(WIN_MESSAGES[a]) + ` +${payout} tokens`;
    reelFrames.forEach((f) => f.classList.add("winning"));
    balanceEl.classList.add("pulse");
    setTimeout(() => balanceEl.classList.remove("pulse"), 1200);
  } else if (a === b || b === c || a === c) {
    payout = bet * 2;
    kind = "win";
    msg = pickRandom(NEAR_MISS_MESSAGES) + ` +${payout} tokens`;
  } else {
    msg = pickRandom(LOSE_MESSAGES);
  }

  state.balance += payout;
  payoutEl.textContent = payout;
  setMessage(msg, kind);
  updateHUD();

  setTimeout(() => {
    reelFrames.forEach((f) => f.classList.remove("winning"));
  }, 1400);

  state.spinning = false;
  spinBtn.disabled = false;
  betUpBtn.disabled = false;
  betDownBtn.disabled = false;
  maxBetBtn.disabled = false;
  begBtn.disabled = false;
}

function changeBet(dir) {
  const next = state.betIndex + dir;
  if (next < 0 || next >= BETS.length) return;
  state.betIndex = next;
  updateHUD();
}

function beg() {
  if (state.balance > 0) {
    setMessage("You still have tokens. Spend them first. Discipline, please.");
    return;
  }
  state.balance += 100;
  updateHUD();
  setMessage("A venture capitalist airdropped you 100 tokens. They expect a pitch deck.");
}

spinBtn.addEventListener("click", spin);
betUpBtn.addEventListener("click", () => changeBet(1));
betDownBtn.addEventListener("click", () => changeBet(-1));
maxBetBtn.addEventListener("click", () => {
  let max = 0;
  for (let i = BETS.length - 1; i >= 0; i--) {
    if (BETS[i] <= state.balance) { max = i; break; }
  }
  state.betIndex = max;
  updateHUD();
});
begBtn.addEventListener("click", beg);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); spin(); }
  if (e.key === "ArrowUp") changeBet(1);
  if (e.key === "ArrowDown") changeBet(-1);
});

renderInitialReels();
updateHUD();
