const SYMBOLS = [
  { icon: "🧠", name: "brain",    multiplier: 50 },
  { icon: "🤖", name: "robot",    multiplier: 25 },
  { icon: "💸", name: "money",    multiplier: 20 },
  { icon: "🌀", name: "halluc",   multiplier: 15 },
  { icon: "📈", name: "hockey",   multiplier: 10 },
  { icon: "🍒", name: "cherry",   multiplier: 5  },
];

const WEIGHTS = [1, 2, 3, 4, 6, 10];

const WIN_QUIPS = {
  brain:  ["EMERGENT BEHAVIOR DETECTED. Please cite us in your next paper.",
           "The model has achieved sentience. Briefly."],
  robot:  ["AGI confirmed. Release notes pending.",
           "The robot overlords approve of this transaction."],
  money:  ["Burn rate: exceeded. Runway: vibes.",
           "Investors are crying. Tears of joy? Unclear."],
  halluc: ["Certified hallucination! The facts are whatever you want them to be.",
           "The model insists this win is 100% real. Trust it."],
  hockey: ["Number go up! The graph approves.",
           "Line goes up and to the right. That's the whole pitch deck."],
  cherry: ["Training data leak detected. Don't tell the lawyers.",
           "Minor win! Disclosed in our 10-K."]
};

const LOSS_QUIPS = [
  "The model is very confident this was almost a win.",
  "Loss function: you.",
  "According to our alignment team, this is technically fine.",
  "Let's call this a 'learning opportunity.'",
  "The AI didn't lose, it just rate-limited your luck.",
  "That spin has been added to the context window. Sorry.",
  "Insufficient compute. Try bribing NVIDIA.",
  "The reasoning model thought about losing for 40 seconds first.",
  "Your tokens have been sacrificed to the GPU gods.",
  "Error 402: Payment Required (for vibes)."
];

const TWO_MATCH_QUIPS = [
  "Partial credit! Like a model that almost gets the math right.",
  "Close enough — ship it.",
  "Two out of three. That's a B+ on the eval.",
];

const state = {
  tokens: 100,
  bet: 5,
  spinning: false,
};

const $tokens = document.getElementById("tokens");
const $bet = document.getElementById("bet");
const $lastWin = document.getElementById("lastWin");
const $message = document.getElementById("message");
const $spin = document.getElementById("spin");
const $betUp = document.getElementById("betUp");
const $betDown = document.getElementById("betDown");
const $reset = document.getElementById("reset");
const reelStrips = [0, 1, 2].map(i => document.getElementById(`reel${i}`));
const reelContainers = document.querySelectorAll(".reel");

const totalWeight = WEIGHTS.reduce((a, b) => a + b, 0);

function pickWeighted() {
  let r = Math.random() * totalWeight;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return SYMBOLS.length - 1;
}

function buildStrip(stripEl, finalIndex, spinsAhead) {
  stripEl.innerHTML = "";
  const sequence = [];
  for (let i = 0; i < spinsAhead; i++) sequence.push(pickWeighted());
  sequence.push(finalIndex);
  sequence.push(pickWeighted());

  sequence.forEach(idx => {
    const div = document.createElement("div");
    div.className = "symbol";
    div.textContent = SYMBOLS[idx].icon;
    stripEl.appendChild(div);
  });
  return sequence.length;
}

function setInitialReels() {
  reelStrips.forEach((strip) => {
    strip.innerHTML = "";
    const div = document.createElement("div");
    div.className = "symbol";
    div.textContent = "❓";
    strip.appendChild(div);
  });
}

function updateStats() {
  $tokens.textContent = state.tokens;
  $bet.textContent = state.bet;
  $spin.disabled = state.spinning || state.tokens < state.bet;
  $betUp.disabled = state.spinning || state.bet >= Math.min(50, state.tokens);
  $betDown.disabled = state.spinning || state.bet <= 1;
}

function setMessage(text, cls = "") {
  $message.className = "message " + cls;
  $message.textContent = text;
}

function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

async function spin() {
  if (state.spinning || state.tokens < state.bet) return;
  state.spinning = true;
  state.tokens -= state.bet;
  updateStats();
  setMessage("🎲 The model is 'thinking'...");

  const results = [pickWeighted(), pickWeighted(), pickWeighted()];
  const spinLengths = [20, 24, 28];

  reelContainers.forEach((c, i) => {
    c.classList.remove("spinning");
    const strip = reelStrips[i];
    strip.style.transition = "none";
    strip.style.transform = "translateY(0)";
    void strip.offsetWidth;

    const totalItems = buildStrip(strip, results[i], spinLengths[i]);
    const finalItemIndex = spinLengths[i];
    const targetY = -finalItemIndex * 110;

    requestAnimationFrame(() => {
      c.classList.add("spinning");
      strip.style.transform = `translateY(${targetY}px)`;
    });
  });

  await new Promise(r => setTimeout(r, 1900));

  evaluate(results);
  state.spinning = false;
  updateStats();
}

function evaluate(results) {
  const [a, b, c] = results;
  let winnings = 0;
  let msg = "";
  let cls = "loss";

  if (a === b && b === c) {
    const sym = SYMBOLS[a];
    winnings = state.bet * sym.multiplier;
    msg = `${sym.icon}${sym.icon}${sym.icon}  +${winnings} tokens! ${pick(WIN_QUIPS[sym.name])}`;
    cls = "win";
    document.querySelector(".machine").classList.add("jackpot");
    setTimeout(() => document.querySelector(".machine").classList.remove("jackpot"), 2500);
  } else if (a === b || b === c || a === c) {
    winnings = state.bet * 2;
    msg = `+${winnings} tokens. ${pick(TWO_MATCH_QUIPS)}`;
    cls = "win";
  } else {
    msg = `−${state.bet} tokens. ${pick(LOSS_QUIPS)}`;
  }

  state.tokens += winnings;
  $lastWin.textContent = winnings;

  if (state.tokens <= 0) {
    msg += " 💀 You have been deprecated. Tap the VC button.";
  }

  setMessage(msg, cls);
}

$spin.addEventListener("click", spin);
$betUp.addEventListener("click", () => {
  state.bet = Math.min(state.bet + 1, 50, state.tokens);
  updateStats();
});
$betDown.addEventListener("click", () => {
  state.bet = Math.max(1, state.bet - 1);
  updateStats();
});
$reset.addEventListener("click", () => {
  state.tokens = 100;
  state.bet = 5;
  setMessage("Fresh Series A secured. Please spend responsibly.", "win");
  updateStats();
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !state.spinning) { e.preventDefault(); spin(); }
  if (e.code === "ArrowUp") $betUp.click();
  if (e.code === "ArrowDown") $betDown.click();
});

setInitialReels();
updateStats();
