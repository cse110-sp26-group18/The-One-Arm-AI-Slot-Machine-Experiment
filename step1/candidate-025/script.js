const SYMBOLS = [
  { icon: "🤖", name: "Bot",     weight: 10, payout: 5  },
  { icon: "🧠", name: "Brain",   weight: 8,  payout: 8  },
  { icon: "💭", name: "Halluc",  weight: 12, payout: 3  },
  { icon: "⚡", name: "GPU",     weight: 7,  payout: 10 },
  { icon: "🔥", name: "Fire",    weight: 9,  payout: 6  },
  { icon: "💸", name: "Burn",    weight: 11, payout: 4  },
  { icon: "📉", name: "Crash",   weight: 10, payout: 4  },
  { icon: "🎲", name: "RNG",     weight: 6,  payout: 15 },
  { icon: "👁️", name: "AGI",    weight: 2,  payout: 50 },
];

const WIN_LINES = [
  "Three in a row! You hallucinated a win.",
  "Jackpot! Training data successfully memorized.",
  "Lucky! Our RNG leaked the answer.",
  "You beat the model. It's now sulking.",
  "Payout approved by the Ethics Board (they were asleep).",
  "Reward function exploited. Well done.",
];

const PAIR_LINES = [
  "Close! Like a 7B model, almost but not quite.",
  "Two out of three. The third reel refused to answer.",
  "Partial credit. Your prompt needed more 'please'.",
  "So close. The model got distracted by a cat photo.",
];

const LOSE_LINES = [
  "Context window exceeded. Try fewer hopes.",
  "Rate limited by the universe.",
  "The model refused. Safety concerns.",
  "Your tokens have been deprecated.",
  "Prompt injection failed. Boringly.",
  "The GPU melted. It's fine. It's fine.",
  "You were out-of-distribution.",
  "Temperature too high. So were your odds.",
  "Model collapsed into a single emoji.",
  "Loss went up. So did yours.",
  "Our alignment team apologizes for nothing.",
];

const JACKPOT_LINE = "👁️ AGI ACHIEVED 👁️ — you win, the humans lose.";

const state = {
  balance: 100,
  bet: 5,
  burned: 0,
  spinning: false,
};

const $ = (id) => document.getElementById(id);

const weightedPick = () => {
  const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return SYMBOLS[0];
};

const buildStrip = (stripEl, finalSymbol, extraCells) => {
  stripEl.innerHTML = "";
  const cells = [];
  for (let i = 0; i < extraCells; i++) cells.push(weightedPick());
  cells.push(finalSymbol);
  for (const s of cells) {
    const d = document.createElement("div");
    d.className = "cell";
    d.textContent = s.icon;
    stripEl.appendChild(d);
  }
  return cells.length;
};

const animateStrip = (stripEl, totalCells, duration) => {
  const cellH = 100;
  const distance = (totalCells - 1) * cellH;
  stripEl.style.transition = "none";
  stripEl.style.transform = `translateY(0px)`;
  // force reflow
  void stripEl.offsetHeight;
  stripEl.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0.7, 0.1, 1)`;
  stripEl.style.transform = `translateY(-${distance}px)`;
};

const render = () => {
  $("balance").textContent = state.balance;
  $("bet").textContent = state.bet;
  $("burned").textContent = state.burned;
  $("spin").disabled = state.spinning || state.balance < state.bet;
  $("betUp").disabled = state.spinning;
  $("betDown").disabled = state.spinning;
};

const setMessage = (text, cls = "") => {
  const m = $("message");
  m.className = "message " + cls;
  m.textContent = text;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const spin = async () => {
  if (state.spinning) return;
  if (state.balance < state.bet) {
    setMessage("Insufficient tokens. Go generate more value.", "lose");
    return;
  }

  state.spinning = true;
  state.balance -= state.bet;
  state.burned += state.bet;
  document.querySelectorAll(".reel").forEach(r => r.classList.remove("win"));
  setMessage("Summoning the transformer...");
  render();

  const results = [weightedPick(), weightedPick(), weightedPick()];
  const strips = [$("strip0"), $("strip1"), $("strip2")];
  const durations = [900, 1250, 1600];

  strips.forEach((strip, i) => {
    const total = buildStrip(strip, results[i], 18 + i * 4);
    requestAnimationFrame(() => animateStrip(strip, total, durations[i]));
  });

  await new Promise(r => setTimeout(r, durations[2] + 100));

  evaluate(results);
  state.spinning = false;
  render();
};

const evaluate = (results) => {
  const [a, b, c] = results;
  const machine = document.querySelector(".machine");

  if (a.icon === b.icon && b.icon === c.icon) {
    const win = state.bet * a.payout;
    state.balance += win;
    document.querySelectorAll(".reel").forEach(r => r.classList.add("win"));
    if (a.name === "AGI") {
      setMessage(`${JACKPOT_LINE} +${win} tokens`, "win");
    } else {
      setMessage(`${pick(WIN_LINES)} +${win} tokens`, "win");
    }
    machine.classList.add("jackpot");
    setTimeout(() => machine.classList.remove("jackpot"), 1200);
    return;
  }

  if (a.icon === b.icon || b.icon === c.icon || a.icon === c.icon) {
    const consolation = Math.floor(state.bet / 2);
    state.balance += consolation;
    setMessage(`${pick(PAIR_LINES)} +${consolation} tokens (pity refund)`, "");
    return;
  }

  setMessage(pick(LOSE_LINES), "lose");
  machine.classList.add("bust");
  setTimeout(() => machine.classList.remove("bust"), 500);
};

const initReels = () => {
  for (const id of ["strip0", "strip1", "strip2"]) {
    const strip = $(id);
    strip.innerHTML = "";
    const d = document.createElement("div");
    d.className = "cell";
    d.textContent = "🤖";
    strip.appendChild(d);
  }
};

$("spin").addEventListener("click", spin);
$("betUp").addEventListener("click", () => {
  if (state.spinning) return;
  const steps = [1, 5, 10, 25, 50, 100];
  const idx = steps.indexOf(state.bet);
  state.bet = steps[Math.min(idx + 1, steps.length - 1)];
  render();
});
$("betDown").addEventListener("click", () => {
  if (state.spinning) return;
  const steps = [1, 5, 10, 25, 50, 100];
  const idx = steps.indexOf(state.bet);
  state.bet = steps[Math.max(idx - 1, 0)];
  render();
});
$("refill").addEventListener("click", () => {
  if (state.spinning) return;
  state.balance += 100;
  setMessage("Series Z funding secured. +100 tokens.", "win");
  render();
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); spin(); }
});

initReels();
render();
