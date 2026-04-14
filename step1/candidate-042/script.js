const SYMBOLS = [
  { e: "🤖", name: "AGI",       triple: 500 },
  { e: "🧠", name: "SENTIENCE", triple: 200 },
  { e: "💾", name: "DATA",      triple: 150 },
  { e: "⚡", name: "COMPUTE",   triple: 100 },
  { e: "📉", name: "LOSS",      triple: 75  },
  { e: "🪄", name: "PROMPT",    triple: 60  },
  { e: "💀", name: "HALLU",     triple: 0   },
];

const SPIN_COST = 5;
const STORAGE_KEY = "ai-slot-tokens";

const WIN_LINES = [
  tokens => `JACKPOT. The model has achieved general intelligence. +${tokens} tokens. Please notify OpenAI lawyers.`,
  tokens => `Three of a kind. Scaling laws confirmed. +${tokens} tokens.`,
  tokens => `A synergistic alignment of latent features. +${tokens} tokens.`,
  tokens => `The transformer is very proud of itself. +${tokens} tokens.`,
];

const PAIR_LINES = [
  "Two out of three. Ship it anyway. +10 tokens.",
  "Close enough for a demo video. +10 tokens.",
  "Claims 99% accuracy. Tested on 3 samples. +10 tokens.",
  "Partial credit, like most benchmarks. +10 tokens.",
];

const LOSS_LINES = [
  "The model confidently generated garbage. No tokens.",
  "Output filtered by the Trust & Safety team. No tokens.",
  "Training run diverged. Try again with more GPUs.",
  "It insists it did well. It did not. No tokens.",
  "Results were in the system prompt all along. No tokens.",
];

const HALLU_LINES = [
  "HALLUCINATION DETECTED. The model cited a paper that doesn't exist. -10 tokens.",
  "It made up a fact and defended it. -10 tokens.",
  "The AI recommended eating rocks for your health. -10 tokens.",
  "Confidently wrong. Charged extra for it. -10 tokens.",
];

const BROKE_LINES = [
  "Out of tokens. Time to beg Sam for compute.",
  "You have depleted your context window. And your wallet.",
  "Insufficient funds. The GPU farm is laughing at you.",
];

const STRIP_LENGTH = 30;
const CELL_HEIGHT = () => {
  const cell = document.querySelector(".cell");
  return cell ? cell.getBoundingClientRect().height : 120;
};

let tokens = loadTokens();
let spinning = false;

const tokensEl  = document.getElementById("tokens");
const messageEl = document.getElementById("message");
const spinBtn   = document.getElementById("spin-btn");
const resetBtn  = document.getElementById("reset-btn");
const freeBtn   = document.getElementById("free-btn");
const strips    = [0, 1, 2].map(i => document.getElementById("strip" + i));
const reels     = document.querySelectorAll(".reel");

function loadTokens() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 100;
}

function saveTokens() {
  localStorage.setItem(STORAGE_KEY, String(tokens));
}

function setTokens(n) {
  tokens = Math.max(0, n);
  tokensEl.textContent = tokens;
  saveTokens();
  spinBtn.disabled = spinning || tokens < SPIN_COST;
}

function setMessage(text, kind = "") {
  messageEl.textContent = text;
  messageEl.className = kind ? `msg-${kind}` : "";
}

function randomSymbol() {
  const roll = Math.random();
  if (roll < 0.15) return SYMBOLS[6];
  if (roll < 0.25) return SYMBOLS[0];
  if (roll < 0.38) return SYMBOLS[1];
  if (roll < 0.52) return SYMBOLS[2];
  if (roll < 0.68) return SYMBOLS[3];
  if (roll < 0.84) return SYMBOLS[4];
  return SYMBOLS[5];
}

function buildStrip(strip, finalSymbol) {
  strip.innerHTML = "";
  const cells = [];
  for (let i = 0; i < STRIP_LENGTH - 1; i++) {
    cells.push(randomSymbol());
  }
  cells.push(finalSymbol);
  for (const sym of cells) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = sym.e;
    strip.appendChild(cell);
  }
  return cells;
}

function animateReel(strip, duration) {
  const h = CELL_HEIGHT();
  const target = -(STRIP_LENGTH - 1) * h;
  strip.style.transition = "none";
  strip.style.top = "0px";
  void strip.offsetHeight;
  strip.style.transition = `top ${duration}ms cubic-bezier(0.15, 0.85, 0.25, 1)`;
  strip.style.top = `${target}px`;
  return new Promise(resolve => {
    setTimeout(resolve, duration + 40);
  });
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function evaluate(result) {
  const [a, b, c] = result;
  const hasHallu = result.some(s => s.name === "HALLU");

  if (hasHallu && !(a.name === b.name && b.name === c.name)) {
    return { delta: -10, message: pickRandom(HALLU_LINES), kind: "lose" };
  }

  if (a.name === b.name && b.name === c.name) {
    if (a.name === "HALLU") {
      return {
        delta: -50,
        message: "TRIPLE HALLUCINATION. The model is now a conspiracy theorist. -50 tokens.",
        kind: "lose",
      };
    }
    const tpl = pickRandom(WIN_LINES);
    const isJackpot = a.name === "AGI";
    return {
      delta: a.triple,
      message: tpl(a.triple),
      kind: isJackpot ? "jackpot" : "win",
    };
  }

  if (a.name === b.name || b.name === c.name || a.name === c.name) {
    return { delta: 10, message: pickRandom(PAIR_LINES), kind: "win" };
  }

  return { delta: 0, message: pickRandom(LOSS_LINES), kind: "lose" };
}

async function spin() {
  if (spinning) return;
  if (tokens < SPIN_COST) {
    setMessage(pickRandom(BROKE_LINES), "lose");
    return;
  }

  spinning = true;
  setTokens(tokens - SPIN_COST);
  setMessage("The model is thinking... (it is not)", "");

  const result = [randomSymbol(), randomSymbol(), randomSymbol()];
  strips.forEach((s, i) => buildStrip(s, result[i]));

  reels.forEach(r => r.classList.remove("flash"));

  const durations = [1100, 1500, 1900];
  await Promise.all(strips.map((s, i) => animateReel(s, durations[i])));

  const outcome = evaluate(result);
  setTokens(tokens + outcome.delta);
  setMessage(outcome.message, outcome.kind);

  if (outcome.kind === "win" || outcome.kind === "jackpot") {
    reels.forEach(r => r.classList.add("flash"));
  }

  spinning = false;
  spinBtn.disabled = tokens < SPIN_COST;
}

function initStrips() {
  strips.forEach(strip => {
    const sym = randomSymbol();
    strip.innerHTML = "";
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = sym.e;
    strip.appendChild(cell);
    strip.style.top = "0px";
  });
}

spinBtn.addEventListener("click", spin);

resetBtn.addEventListener("click", () => {
  if (spinning) return;
  setTokens(100);
  setMessage("Weights randomized. Hopes recalibrated. Back to 100 tokens.", "");
  initStrips();
});

freeBtn.addEventListener("click", () => {
  if (spinning) return;
  const gift = 10 + Math.floor(Math.random() * 15);
  setTokens(tokens + gift);
  setMessage(`A sympathetic VC threw ${gift} tokens your way. Round closes Friday.`, "win");
});

document.addEventListener("keydown", e => {
  if (e.code === "Space" && !spinning) {
    e.preventDefault();
    spin();
  }
});

initStrips();
setTokens(tokens);
setMessage("Insert tokens. The machine will pretend to think.", "");
