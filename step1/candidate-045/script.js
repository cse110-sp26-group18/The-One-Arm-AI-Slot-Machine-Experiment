const SYMBOLS = [
  { icon: "🤖", name: "Bot",        payout: 5  },
  { icon: "🧠", name: "Brain",      payout: 10 },
  { icon: "💾", name: "Dataset",    payout: 3  },
  { icon: "🔥", name: "GPU",        payout: 8  },
  { icon: "📉", name: "Loss Curve", payout: 2  },
  { icon: "🌀", name: "Hallucination", payout: 20 },
  { icon: "💸", name: "Series C",   payout: 15 },
  { icon: "🗑️", name: "Garbage Output", payout: 0 },
];

const SNARK_WIN = [
  "The model is 'aligned' with your wallet.",
  "Emergent behavior detected: profit.",
  "Your prompt engineering pays off.",
  "Scaling laws confirmed.",
  "Congratulations, you are now an AI influencer.",
];

const SNARK_LOSS = [
  "The model respectfully declines to pay out.",
  "Your request violates our content policy.",
  "As a large slot machine, I cannot provide tokens.",
  "Output filtered for safety. (And for profit.)",
  "The AI is confident, but wrong. You lose.",
  "Hallucinated a win. It wasn't real.",
];

const SNARK_NEAR = [
  "So close. Have you tried rephrasing your bet?",
  "Fine-tune your strategy.",
  "Try again with chain-of-thought.",
];

const state = {
  tokens: 1000,
  bet: 10,
  spins: 0,
  spinning: false,
};

const els = {
  tokens: document.getElementById("tokens"),
  bet: document.getElementById("bet"),
  spins: document.getElementById("spins"),
  message: document.getElementById("message"),
  spin: document.getElementById("spin"),
  betUp: document.getElementById("betUp"),
  betDown: document.getElementById("betDown"),
  buy: document.getElementById("buyTokens"),
  reset: document.getElementById("reset"),
  screen: document.querySelector(".screen"),
  strips: document.querySelectorAll(".strip"),
};

function render() {
  els.tokens.textContent = state.tokens;
  els.bet.textContent = state.bet;
  els.spins.textContent = state.spins;
  els.spin.disabled = state.spinning || state.tokens < state.bet;
}

function setMessage(text, jackpot = false) {
  els.message.textContent = text;
  els.message.classList.toggle("jackpot", jackpot);
}

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildStrip(stripEl, finalSymbol) {
  stripEl.innerHTML = "";
  for (let i = 0; i < 20; i++) {
    const div = document.createElement("div");
    div.textContent = randomSymbol().icon;
    stripEl.appendChild(div);
  }
  const final = document.createElement("div");
  final.textContent = finalSymbol.icon;
  stripEl.appendChild(final);
}

function spin() {
  if (state.spinning) return;
  if (state.tokens < state.bet) {
    setMessage("Out of tokens. The AI is hungry. Feed it.");
    return;
  }

  state.spinning = true;
  state.tokens -= state.bet;
  state.spins++;
  setMessage("Inferencing…");
  render();

  const results = [randomSymbol(), randomSymbol(), randomSymbol()];

  els.strips.forEach((strip, i) => {
    buildStrip(strip, results[i]);
    strip.classList.add("spinning");
    strip.style.transform = "translateY(0)";
  });

  els.strips.forEach((strip, i) => {
    setTimeout(() => {
      strip.classList.remove("spinning");
      strip.style.transition = "transform 0.6s cubic-bezier(0.2, 0.8, 0.3, 1)";
      const totalChildren = strip.children.length;
      const offset = (totalChildren - 1) * 110 - 0;
      strip.style.transform = `translateY(-${offset}px)`;
    }, 600 + i * 400);
  });

  setTimeout(() => evaluate(results), 600 + 3 * 400 + 200);
}

function evaluate(results) {
  const [a, b, c] = results;
  let winnings = 0;
  let msg = "";
  let jackpot = false;

  if (a.name === b.name && b.name === c.name) {
    winnings = state.bet * a.payout;
    if (a.name === "Garbage Output") {
      winnings = 0;
      msg = `Triple 🗑️! Congrats, you trained on slop. Payout: 0 tokens.`;
    } else if (a.name === "Hallucination") {
      jackpot = true;
      msg = `🌀 JACKPOT HALLUCINATION! +${winnings} tokens of pure fiction!`;
    } else {
      msg = `Triple ${a.icon} ${a.name}! +${winnings} tokens. ${pick(SNARK_WIN)}`;
    }
  } else if (a.name === b.name || b.name === c.name || a.name === c.name) {
    const matchSym = a.name === b.name ? a : (b.name === c.name ? b : a);
    winnings = Math.floor(state.bet * matchSym.payout * 0.3);
    msg = `Pair of ${matchSym.icon}. +${winnings} tokens. ${pick(SNARK_NEAR)}`;
  } else {
    msg = pick(SNARK_LOSS);
  }

  state.tokens += winnings;
  state.spinning = false;

  if (winnings > 0) {
    els.screen.classList.add("flash");
    setTimeout(() => els.screen.classList.remove("flash"), 1400);
  }

  setMessage(msg, jackpot);
  render();

  if (state.tokens <= 0) {
    setTimeout(() => {
      setMessage("Context window exhausted. Please purchase more tokens to continue existing.");
    }, 1500);
  }
}

els.spin.addEventListener("click", spin);

els.betUp.addEventListener("click", () => {
  if (state.spinning) return;
  state.bet = Math.min(state.bet + 10, Math.max(10, state.tokens));
  render();
});

els.betDown.addEventListener("click", () => {
  if (state.spinning) return;
  state.bet = Math.max(10, state.bet - 10);
  render();
});

els.buy.addEventListener("click", () => {
  if (state.spinning) return;
  state.tokens += 500;
  setMessage("Transaction approved. Your VC is proud. +500 tokens.");
  render();
});

els.reset.addEventListener("click", () => {
  if (state.spinning) return;
  state.tokens = 1000;
  state.bet = 10;
  state.spins = 0;
  setMessage("Weights re-initialized. Good luck, human.");
  render();
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    spin();
  }
});

render();
setMessage("Insert tokens. Pray to the transformer.");
