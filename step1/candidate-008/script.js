const SYMBOLS = [
  { icon: "🤖", name: "AGI",          weight: 1,  payout: 50 },
  { icon: "🧠", name: "BigBrain",     weight: 2,  payout: 25 },
  { icon: "⚡", name: "GPU",          weight: 3,  payout: 15 },
  { icon: "💾", name: "Dataset",      weight: 4,  payout: 10 },
  { icon: "🪙", name: "Token",        weight: 5,  payout: 8  },
  { icon: "🎲", name: "Hallucinate",  weight: 6,  payout: 5  },
  { icon: "📉", name: "LossSpike",    weight: 3,  payout: 0  },
];

const WIN_QUIPS = {
  AGI:         ["AGI ACHIEVED! (for 0.3 seconds)", "The singularity is near-ish!", "You birthed Skynet. Congrats."],
  BigBrain:    ["Big brain model unlocked!", "Parameters go brrr!", "You just out-scaled OpenAI."],
  GPU:         ["GPU goes brrr!", "Jensen sheds a single tear of joy.", "H100s purring like kittens."],
  Dataset:     ["Scraped the entire internet!", "Copyright lawyers hate this trick.", "Reddit did not consent."],
  Token:       ["Token farm printing!", "You are the next tokenomics grift.", "Stonks of stochastic parrots."],
  Hallucinate: ["Pure hallucination! Ship it anyway.", "The model made it up. You won anyway.", "Confidently incorrect = jackpot."],
  pair:        ["Mid output, minor win.", "Barely coherent, barely paid.", "Good enough for a demo."],
};

const LOSE_QUIPS = [
  "Context window exceeded.",
  "Model collapsed. RIP.",
  "Training on your wallet...",
  "As an AI language model, I lost your money.",
  "Overfit to losing.",
  "Prompt injected: you lose.",
  "Temperature too high. Vibes only.",
  "Burning through VC funding...",
  "Stochastic poverty achieved.",
  "The model apologizes for nothing.",
];

const LOSS_SPIKE_QUIPS = [
  "📉 Loss spiked — bet refunded, dignity not.",
  "📉 Training instability! Bet clawed back.",
  "📉 Gradient exploded in your favor (kinda).",
];

const state = {
  tokens: 100,
  bet: 5,
  spinning: false,
  burn: 0,
};

const els = {
  tokens: document.getElementById("tokens"),
  bet: document.getElementById("bet"),
  burn: document.getElementById("burn"),
  reels: document.querySelectorAll(".reel"),
  strips: document.querySelectorAll(".reel .strip"),
  message: document.getElementById("message"),
  spin: document.getElementById("spin"),
  betUp: document.getElementById("betUp"),
  betDown: document.getElementById("betDown"),
  beg: document.getElementById("beg"),
  reset: document.getElementById("reset"),
};

const WEIGHTED = SYMBOLS.flatMap(s => Array(s.weight).fill(s));
const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const pickSymbol = () => rand(WEIGHTED);

function buildStrip(strip, finalSymbol) {
  strip.innerHTML = "";
  const filler = 12;
  for (let i = 0; i < filler; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = pickSymbol().icon;
    strip.appendChild(cell);
  }
  const finalCell = document.createElement("div");
  finalCell.className = "cell";
  finalCell.textContent = finalSymbol.icon;
  strip.appendChild(finalCell);
}

function render() {
  els.tokens.textContent = state.tokens;
  els.bet.textContent = state.bet;
  els.burn.textContent = "$" + state.burn.toLocaleString();
  els.spin.disabled = state.spinning || state.tokens < state.bet;
  els.betUp.disabled = state.spinning;
  els.betDown.disabled = state.spinning;
}

function setMessage(text, kind = "") {
  els.message.textContent = text;
  els.message.className = "message" + (kind ? " " + kind : "");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function spin() {
  if (state.spinning) return;
  if (state.tokens < state.bet) {
    setMessage("Not enough tokens. Beg investors.", "lose");
    return;
  }

  state.spinning = true;
  state.tokens -= state.bet;
  state.burn += state.bet * 37;
  setMessage("Sampling from the latent space...");
  render();

  const results = [pickSymbol(), pickSymbol(), pickSymbol()];

  els.strips.forEach((strip, i) => {
    buildStrip(strip, results[i]);
    strip.style.transform = "translateY(0)";
    els.reels[i].classList.add("spinning");
  });

  const stopDelays = [600, 900, 1200];
  for (let i = 0; i < 3; i++) {
    await sleep(stopDelays[i] - (i > 0 ? stopDelays[i-1] : 0));
    els.reels[i].classList.remove("spinning");
    const strip = els.strips[i];
    const cellCount = strip.children.length;
    const targetY = -(cellCount - 1) * 120;
    strip.style.transition = "transform 0.4s cubic-bezier(0.15, 0.9, 0.3, 1.1)";
    strip.style.transform = `translateY(${targetY}px)`;
  }

  await sleep(500);
  evaluate(results);
  state.spinning = false;
  render();
}

function evaluate(results) {
  const [a, b, c] = results;
  const lossSpike = results.some(s => s.name === "LossSpike");

  if (a.name === b.name && b.name === c.name && a.payout > 0) {
    const win = state.bet * a.payout;
    state.tokens += win;
    setMessage(`${rand(WIN_QUIPS[a.name])} +${win} tokens!`, "win");
    els.reels.forEach(r => r.classList.add("flash"));
    setTimeout(() => els.reels.forEach(r => r.classList.remove("flash")), 1200);
    return;
  }

  if (lossSpike) {
    state.tokens += state.bet;
    setMessage(rand(LOSS_SPIKE_QUIPS), "");
    return;
  }

  const names = [a.name, b.name, c.name];
  const hasPair = names.some((n, i) => names.indexOf(n) !== i && SYMBOLS.find(s => s.name === n).payout > 0);
  if (hasPair) {
    const win = state.bet * 2;
    state.tokens += win;
    setMessage(`${rand(WIN_QUIPS.pair)} +${win} tokens!`, "win");
    return;
  }

  setMessage(rand(LOSE_QUIPS), "lose");
  document.querySelector(".machine").classList.add("shake");
  setTimeout(() => document.querySelector(".machine").classList.remove("shake"), 300);
}

els.spin.addEventListener("click", spin);

els.betUp.addEventListener("click", () => {
  if (state.bet < 50 && state.bet < state.tokens) {
    state.bet = Math.min(50, state.bet + 5);
    render();
  }
});

els.betDown.addEventListener("click", () => {
  if (state.bet > 5) {
    state.bet -= 5;
    render();
  }
});

els.beg.addEventListener("click", () => {
  state.tokens += 50;
  setMessage("VCs threw money at your pitch deck. +50 tokens.", "win");
  render();
});

els.reset.addEventListener("click", () => {
  state.tokens = 100;
  state.bet = 5;
  state.burn = 0;
  setMessage("Series A closed. Tokens refilled. Hype restored.", "");
  render();
});

document.addEventListener("keydown", e => {
  if (e.code === "Space") { e.preventDefault(); spin(); }
});

els.strips.forEach((strip, i) => {
  buildStrip(strip, SYMBOLS[i % SYMBOLS.length]);
  const targetY = -(strip.children.length - 1) * 120;
  strip.style.transform = `translateY(${targetY}px)`;
});

render();
