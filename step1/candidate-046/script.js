const SYMBOLS = [
  { emoji: "🧠", name: "AGI",         weight: 1,  payout: 50 },
  { emoji: "🤖", name: "Bot",         weight: 2,  payout: 20 },
  { emoji: "💡", name: "Eureka",      weight: 3,  payout: 15 },
  { emoji: "📎", name: "Clippy",      weight: 4,  payout: 10 },
  { emoji: "🔮", name: "Forecast",    weight: 5,  payout: 8  },
  { emoji: "🍄", name: "Hallucinate", weight: 7,  payout: 5  },
];

const WIN_QUIPS = {
  "🧠": ["AGI achieved! Please alert the ethics board.", "You birthed a superintelligence. It wants snacks."],
  "🤖": ["Shipped to prod on a Friday. Bold.", "The bots salute you."],
  "💡": ["A confident answer! (Citation needed.)", "Eureka! Possibly plagiarized."],
  "📎": ["It looks like you're winning. Want help?", "Clippy has returned. And he brought friends."],
  "🔮": ["The vibes predicted this.", "Forecast: 100% chance of gambling."],
  "🍄": ["Full hallucination. Glorious.", "The model is dreaming of tokens."],
};

const LOSS_QUIPS = [
  "Model confidently wrong. Try again?",
  "Out of distribution. Also out of luck.",
  "Rate limited by the gods of chance.",
  "The GPU sighed audibly.",
  "Prompt rejected. Token burned.",
  "That wasn't in the training data.",
  "Token spent on a regrettable inference.",
  "Refusing to gamble. Just kidding — pull again.",
];

const BROKE_QUIPS = [
  "You've run out of tokens. Typical of a hobbyist tier.",
  "Compute budget: exceeded. Please see billing.",
  "Error 402: Payment Required. Also Karma Required.",
];

const weighted = [];
for (const s of SYMBOLS) for (let i = 0; i < s.weight; i++) weighted.push(s);

const state = {
  tokens: 100,
  bet: 5,
  lastWin: 0,
  spinning: false,
};

const $ = (id) => document.getElementById(id);
const reels = Array.from(document.querySelectorAll(".strip"));

function randomSymbol() {
  return weighted[Math.floor(Math.random() * weighted.length)];
}

function render() {
  $("tokens").textContent = state.tokens;
  $("bet").textContent = state.bet;
  $("lastWin").textContent = state.lastWin;
  $("spin").disabled = state.spinning || state.tokens < state.bet;
  $("betUp").disabled = state.spinning;
  $("betDown").disabled = state.spinning;
}

function setReelSymbols(reelEl, symbols) {
  reelEl.innerHTML = "";
  for (const s of symbols) {
    const div = document.createElement("div");
    div.className = "symbol";
    div.textContent = s.emoji;
    reelEl.appendChild(div);
  }
}

function initReels() {
  for (const r of reels) {
    const syms = [];
    for (let i = 0; i < 3; i++) syms.push(randomSymbol());
    setReelSymbols(r, syms);
  }
}

function message(text) {
  $("message").textContent = text;
}

function popup(text) {
  const el = document.createElement("div");
  el.className = "pop";
  el.textContent = text;
  el.style.left = (window.innerWidth / 2 - 60) + "px";
  el.style.top = (window.innerHeight / 2) + "px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function beep(freq = 440, duration = 80, type = "square") {
  try {
    const ctx = beep.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) {}
}

function winJingle() {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => beep(f, 120, "triangle"), i * 100)
  );
}

function loseBuzz() { beep(110, 250, "sawtooth"); }

async function spin() {
  if (state.spinning || state.tokens < state.bet) return;
  state.spinning = true;
  state.tokens -= state.bet;
  state.lastWin = 0;
  message("Generating tokens... please wait while the model thinks™");
  render();

  const results = [randomSymbol(), randomSymbol(), randomSymbol()];
  const stopDelays = [600, 900, 1200];

  for (let i = 0; i < reels.length; i++) {
    const reel = reels[i];
    reel.parentElement.classList.add("spinning");
    // Fill strip with many random symbols ending in result
    const fillers = [];
    for (let j = 0; j < 20; j++) fillers.push(randomSymbol());
    fillers.push(results[i]);
    setReelSymbols(reel, fillers);
    animateReel(reel, stopDelays[i], results[i]);
    beep(200 + i * 50, 30);
  }

  await new Promise((r) => setTimeout(r, stopDelays[stopDelays.length - 1] + 200));

  // Stop state
  for (let i = 0; i < reels.length; i++) {
    reels[i].parentElement.classList.remove("spinning");
    setReelSymbols(reels[i], [results[i], results[i], results[i]]);
  }

  evaluate(results);
  state.spinning = false;
  render();
}

function animateReel(reelEl, duration, finalSymbol) {
  const start = performance.now();
  const parent = reelEl.parentElement;
  function frame(now) {
    const t = now - start;
    if (t >= duration) {
      parent.classList.remove("spinning");
      return;
    }
    // Cycle symbols by replacing contents randomly
    const syms = [randomSymbol(), randomSymbol(), randomSymbol()];
    setReelSymbols(reelEl, syms);
    setTimeout(() => requestAnimationFrame(frame), 60);
  }
  requestAnimationFrame(frame);
}

function evaluate(results) {
  const [a, b, c] = results;
  const emojis = results.map((s) => s.emoji);

  if (a.emoji === b.emoji && b.emoji === c.emoji) {
    const win = state.bet * a.payout;
    state.tokens += win;
    state.lastWin = win;
    const quips = WIN_QUIPS[a.emoji] || ["Jackpot!"];
    message(`${emojis.join(" ")}  ${quips[Math.floor(Math.random() * quips.length)]}  +${win} tokens!`);
    popup(`+${win}`);
    winJingle();
    flashReels(true);
    return;
  }

  if (a.emoji === b.emoji || b.emoji === c.emoji || a.emoji === c.emoji) {
    const win = state.bet * 2;
    state.tokens += win;
    state.lastWin = win;
    message(`${emojis.join(" ")}  Partial credit — the model got two out of three. +${win} tokens.`);
    beep(660, 150, "triangle");
    return;
  }

  if (state.tokens < state.bet) {
    message(`${emojis.join(" ")}  ${BROKE_QUIPS[Math.floor(Math.random() * BROKE_QUIPS.length)]}`);
  } else {
    message(`${emojis.join(" ")}  ${LOSS_QUIPS[Math.floor(Math.random() * LOSS_QUIPS.length)]}`);
  }
  loseBuzz();
}

function flashReels(on) {
  document.querySelectorAll(".reel").forEach((r) => {
    r.classList.toggle("winning", on);
    if (on) setTimeout(() => r.classList.remove("winning"), 2000);
  });
}

// Persistence via localStorage
function save() {
  try { localStorage.setItem("hallucinator3000", JSON.stringify({ tokens: state.tokens, bet: state.bet })); } catch (e) {}
}
function load() {
  try {
    const raw = localStorage.getItem("hallucinator3000");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.tokens === "number") state.tokens = data.tokens;
    if (typeof data.bet === "number") state.bet = data.bet;
  } catch (e) {}
}

// Controls
$("spin").addEventListener("click", async () => {
  await spin();
  save();
});

$("betUp").addEventListener("click", () => {
  state.bet = Math.min(state.bet + 5, Math.max(5, state.tokens));
  render();
  save();
});

$("betDown").addEventListener("click", () => {
  state.bet = Math.max(5, state.bet - 5);
  render();
  save();
});

$("refill").addEventListener("click", () => {
  state.tokens += 100;
  message("API credits refilled. Your credit card weeps softly.");
  beep(880, 100, "sine");
  render();
  save();
});

// Keyboard: spacebar to spin
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !state.spinning) {
    e.preventDefault();
    $("spin").click();
  }
});

load();
initReels();
render();
