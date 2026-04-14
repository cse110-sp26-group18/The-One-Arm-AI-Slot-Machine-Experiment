// The One-Arm A.I. Slot Machine
// Tokens in. Tokens out. Mostly out.

const SYMBOLS = [
  { icon: "🤖", name: "GPT",         weight: 8,  payout: 5  },
  { icon: "💭", name: "Hallucination", weight: 14, payout: 2  },
  { icon: "🧠", name: "Neuron",       weight: 10, payout: 3  },
  { icon: "📎", name: "Clippy",       weight: 6,  payout: 8  },
  { icon: "🔥", name: "GPU Fire",     weight: 3,  payout: 20 },
  { icon: "💾", name: "Stale Data",   weight: 12, payout: 2  },
  { icon: "⚠️", name: "Bias",         weight: 9,  payout: 4  },
  { icon: "🎲", name: "RNG",          weight: 11, payout: 3  },
  { icon: "💸", name: "VC Money",     weight: 2,  payout: 50 },
];

const WIN_QUIPS = {
  "GPT":           ["Your prompt engineering is finally paying off.",
                    "The model did not refuse this time."],
  "Hallucination": ["Three lies in a row. That's the pattern!",
                    "Citations fabricated. Tokens awarded."],
  "Neuron":        ["A neuron fired. Congratulations, you trained something."],
  "Clippy":        ["It looks like you're winning. Would you like help?",
                    "Clippy escaped the training set. You benefit."],
  "GPU Fire":      ["🔥 Three H100s burnt for this. Worth it.",
                    "The data center melted, but you're rich."],
  "Stale Data":    ["Knowledge cutoff: last Tuesday. Still pays."],
  "Bias":          ["The model confidently told you the wrong answer. You won anyway."],
  "RNG":           ["temperature=2.0 paid off for once."],
  "VC Money":      ["💸 SERIES G UNLOCKED. Profitability optional.",
                    "💸 Sam Altman personally airdropped you tokens."],
};

const LOSS_QUIPS = [
  "Model refused your request. Bet lost.",
  "Rate limited. Try again in 30 years.",
  "The AI hallucinated your winnings into non-existence.",
  "Your prompt was too long. Context window exceeded.",
  "Server overloaded. Please try again. (Tokens kept anyway.)",
  "Alignment committee rejected your payout.",
  "Bug in production. Retrained on your losses.",
  "The model chose violence.",
  "404: Jackpot not found.",
  "As a large language slot machine, I cannot comply.",
  "Token consumed. Output: disappointment.",
  "Fine-tuned on your wallet.",
];

const NEAR_MISS_QUIPS = [
  "Two out of three. The model was SO close to being right.",
  "Almost coherent. Almost.",
];

const STARTING_TOKENS = 1000;
const MIN_BET = 1;
const MAX_BET = 500;
const CONTEXT_WINDOW = 32;
const STRIP_SYMBOLS = 25;

const state = {
  tokens: STARTING_TOKENS,
  bet: 10,
  spinning: false,
  spinsUsed: 0,
};

const el = {
  tokens:       document.getElementById("tokens"),
  bet:          document.getElementById("bet"),
  betUp:        document.getElementById("bet-up"),
  betDown:      document.getElementById("bet-down"),
  spin:         document.getElementById("spin"),
  recharge:     document.getElementById("recharge"),
  reels:        document.querySelectorAll(".reel"),
  log:          document.getElementById("log-list"),
  toast:        document.getElementById("toast"),
  contextFill:  document.getElementById("context-fill"),
};

function weightedPick() {
  const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const sym of SYMBOLS) {
    if ((r -= sym.weight) < 0) return sym;
  }
  return SYMBOLS[0];
}

function buildStrip(finalSymbol) {
  const strip = document.createElement("div");
  strip.className = "strip";
  for (let i = 0; i < STRIP_SYMBOLS - 1; i++) {
    strip.appendChild(symbolNode(weightedPick()));
  }
  strip.appendChild(symbolNode(finalSymbol));
  return strip;
}

function symbolNode(sym) {
  const d = document.createElement("div");
  d.className = "symbol";
  d.textContent = sym.icon;
  d.dataset.name = sym.name;
  return d;
}

function renderStatic() {
  // show an initial symbol per reel so the machine is not empty at rest
  el.reels.forEach((reel) => {
    const strip = reel.querySelector(".strip");
    strip.innerHTML = "";
    strip.appendChild(symbolNode(SYMBOLS[0]));
  });
  updateStats();
}

function updateStats() {
  el.tokens.textContent = state.tokens.toLocaleString();
  el.bet.textContent = state.bet;
  const ratio = Math.max(0, 1 - state.spinsUsed / CONTEXT_WINDOW);
  el.contextFill.style.width = `${ratio * 100}%`;
  el.spin.disabled = state.spinning || state.tokens < state.bet;
  el.betUp.disabled = state.spinning;
  el.betDown.disabled = state.spinning;
}

function toast(msg, kind = "") {
  el.toast.textContent = msg;
  el.toast.classList.remove("hidden");
  el.toast.classList.add("show");
  if (kind) el.toast.dataset.kind = kind;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.toast.classList.remove("show");
  }, 2600);
}

function logResult(result, delta) {
  const li = document.createElement("li");
  const left = document.createElement("span");
  left.textContent = result;
  const right = document.createElement("span");
  right.className = "amount " + (delta > 0 ? "win" : "loss");
  right.textContent = (delta > 0 ? "+" : "") + delta;
  li.appendChild(left);
  li.appendChild(right);
  el.log.prepend(li);
  while (el.log.children.length > 20) el.log.removeChild(el.log.lastChild);
}

function spin() {
  if (state.spinning) return;
  if (state.tokens < state.bet) {
    toast("Insufficient tokens. Contact your local VC.");
    return;
  }

  state.spinning = true;
  state.tokens -= state.bet;
  state.spinsUsed++;
  updateStats();

  // clear winner highlights
  el.reels.forEach((r) => r.classList.remove("winner"));

  const outcomes = [weightedPick(), weightedPick(), weightedPick()];

  // build strips and animate
  const durations = [1800, 2300, 2900];
  el.reels.forEach((reel, i) => {
    const newStrip = buildStrip(outcomes[i]);
    reel.innerHTML = "";
    reel.appendChild(newStrip);

    // trigger reflow, then translate up to the final symbol
    requestAnimationFrame(() => {
      newStrip.style.transition = `transform ${durations[i]}ms cubic-bezier(0.15, 0.7, 0.2, 1)`;
      // each symbol is 40px tall; we want the LAST symbol centered in the 120px reel.
      // container padding is 40px top/bottom, symbols stack; translate so final shows.
      const symbolHeight = parseFloat(getComputedStyle(newStrip.querySelector(".symbol")).height) || 40;
      const offset = (STRIP_SYMBOLS - 1) * symbolHeight;
      newStrip.style.transform = `translateY(-${offset}px)`;
    });
  });

  setTimeout(() => resolveSpin(outcomes), Math.max(...durations) + 120);
}

function resolveSpin(outcomes) {
  const [a, b, c] = outcomes;
  let payout = 0;
  let message = "";

  if (a.name === b.name && b.name === c.name) {
    payout = state.bet * a.payout;
    const quips = WIN_QUIPS[a.name] || ["Jackpot!"];
    message = `${a.icon}${b.icon}${c.icon} ${pick(quips)}`;
    el.reels.forEach((r) => r.classList.add("winner"));
  } else if (a.name === b.name || b.name === c.name || a.name === c.name) {
    // near miss: small consolation
    payout = Math.floor(state.bet * 0.5);
    message = `${a.icon}${b.icon}${c.icon} ${pick(NEAR_MISS_QUIPS)} +${payout}`;
  } else {
    payout = 0;
    message = `${a.icon}${b.icon}${c.icon} ${pick(LOSS_QUIPS)}`;
  }

  state.tokens += payout;
  const delta = payout - state.bet;
  logResult(message, delta);

  if (payout > 0) toast(message.slice(message.indexOf(" ") + 1), "win");
  else toast(message.slice(message.indexOf(" ") + 1), "loss");

  state.spinning = false;

  if (state.spinsUsed >= CONTEXT_WINDOW) {
    state.spinsUsed = 0;
    toast("Context window exceeded. Conversation reset. You are now talking to a fresh model.");
  }

  updateStats();

  if (state.tokens < MIN_BET) {
    toast("You are out of tokens. The AI revolution continues without you.");
  }
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function changeBet(delta) {
  if (state.spinning) return;
  const next = Math.max(MIN_BET, Math.min(MAX_BET, state.bet + delta));
  state.bet = next;
  updateStats();
}

function recharge() {
  state.tokens += 500;
  toast("+500 tokens. Your Series A has been approved.");
  updateStats();
}

// Event wiring
el.spin.addEventListener("click", spin);
el.betUp.addEventListener("click", () => changeBet(+5));
el.betDown.addEventListener("click", () => changeBet(-5));
el.recharge.addEventListener("click", recharge);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); spin(); }
  if (e.key === "ArrowUp") changeBet(+5);
  if (e.key === "ArrowDown") changeBet(-5);
});

renderStatic();
