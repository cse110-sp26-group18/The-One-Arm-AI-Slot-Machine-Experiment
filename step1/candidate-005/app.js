// ── Symbols & payouts ────────────────────────────────
const SYMBOLS = ["🤖", "🧠", "💬", "🔥", "💀", "🐛"];

const TRIPLE_PAYOUTS = {
  "🤖": { mult: 5,  msg: "AI will take your job… badly." },
  "🧠": { mult: 8,  msg: "Neural net achieved sentience… of a goldfish." },
  "💬": { mult: 4,  msg: "ChatGPT wrote this paytable. You can tell." },
  "🔥": { mult: 10, msg: "GPU on fire, but so are your winnings!" },
  "💀": { mult: 15, msg: "SKYNET JACKPOT! (Don't worry, it's a hoax… probably.)" },
  "🐛": { mult: 6,  msg: "It's a feature, not a bug — said every AI ever." },
};

const PAIR_MULT = 2;

const ROAST_MESSAGES = [
  "The AI confidently gave you the wrong answer. Classic.",
  "Model hallucinated your winnings. They don't exist.",
  "Training data didn't include 'how to win.'",
  "AI spent your tokens on more training data. Sorry.",
  "The machine learning model learned… to take your money.",
  "Prompt: 'Give me a jackpot.' Response: 'No.'",
  "Your luck has been deprecated in the latest update.",
  "Error 404: Winnings not found.",
  "AI alignment problem: it aligned against you.",
  "Large Language Loss. Better luck next token.",
  "Transformer model transformed your tokens into nothing.",
  "That spin was about as useful as AI-generated art hands.",
  "Artificial Intelligence? More like Artificial Incompetence.",
  "The model is 97% confident you just lost. (It's right.)",
  "Congrats, you've been fine-tuned for disappointment.",
];

const WIN_PAIR_MESSAGES = [
  "Almost intelligent! Two out of three ain't bad for AI.",
  "A partial match — like AI-generated code that almost compiles.",
  "Two in a row! The AI got lucky. Don't expect it again.",
  "Pair matched! Even a broken chatbot is right twice a day.",
];

// ── State ────────────────────────────────────────────
let tokens = 100;
let bet = 10;
let spinning = false;

// ── DOM refs ─────────────────────────────────────────
const reelEls = [0, 1, 2].map((i) => document.getElementById(`reel-${i}`));
const tokenCountEl = document.getElementById("token-count");
const betAmountEl = document.getElementById("bet-amount");
const messageBox = document.getElementById("message-box");
const spinBtn = document.getElementById("spin-btn");
const betUpBtn = document.getElementById("bet-up");
const betDownBtn = document.getElementById("bet-down");

// ── Helpers ──────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function updateUI() {
  tokenCountEl.textContent = tokens;
  betAmountEl.textContent = bet;
  spinBtn.disabled = spinning || tokens <= 0;
}

function flashTokens() {
  tokenCountEl.classList.add("bump");
  setTimeout(() => tokenCountEl.classList.remove("bump"), 250);
}

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = "message-box" + (type ? ` ${type}` : "");
}

// ── Spin logic ───────────────────────────────────────
function spin() {
  if (spinning || tokens <= 0) return;
  if (bet > tokens) bet = tokens;

  spinning = true;
  tokens -= bet;
  updateUI();

  // Pick results up front
  const results = [pick(SYMBOLS), pick(SYMBOLS), pick(SYMBOLS)];

  // Start spinning animation on all reels
  reelEls.forEach((reel) => {
    const sym = reel.querySelector(".symbol");
    reel.classList.remove("landing");
    reel.classList.add("spinning");
    // Rapidly swap symbols for visual effect
    sym._interval = setInterval(() => {
      sym.textContent = pick(SYMBOLS);
    }, 80);
  });

  showMessage("Spinning… the AI is thinking… 🤔", "");

  // Stop reels one by one
  reelEls.forEach((reel, i) => {
    setTimeout(() => {
      const sym = reel.querySelector(".symbol");
      clearInterval(sym._interval);
      reel.classList.remove("spinning");
      reel.classList.add("landing");
      sym.textContent = results[i];

      // Play a click sound via Web Audio API
      playClick();

      // After last reel lands, evaluate
      if (i === 2) {
        setTimeout(() => resolve(results), 400);
      }
    }, 600 + i * 500);
  });
}

function resolve(results) {
  const [a, b, c] = results;
  let winnings = 0;
  let msg = "";
  let type = "";

  if (a === b && b === c) {
    // Triple
    const payout = TRIPLE_PAYOUTS[a];
    winnings = bet * payout.mult;
    msg = `🎉 TRIPLE ${a}! You win ${winnings} tokens! ${payout.msg}`;
    type = "win";
  } else if (a === b || b === c || a === c) {
    // Pair
    winnings = bet * PAIR_MULT;
    msg = `${pick(WIN_PAIR_MESSAGES)} +${winnings} tokens!`;
    type = "win";
  } else {
    // Loss
    msg = pick(ROAST_MESSAGES);
    type = "lose";
  }

  tokens += winnings;
  flashTokens();
  updateUI();
  showMessage(msg, type);

  if (tokens <= 0) {
    showMessage(
      "You're out of tokens. The AI wins again. Refresh to feed the machine more tokens.",
      "lose"
    );
  }

  spinning = false;
  updateUI();
}

// ── Sound (Web Audio API) ────────────────────────────
let audioCtx;

function playClick() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "square";
  osc.frequency.value = 600 + Math.random() * 400;
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

// ── Event listeners ──────────────────────────────────
spinBtn.addEventListener("click", spin);

betUpBtn.addEventListener("click", () => {
  if (!spinning) {
    bet = Math.min(bet + 5, tokens, 50);
    updateUI();
  }
});

betDownBtn.addEventListener("click", () => {
  if (!spinning) {
    bet = Math.max(bet - 5, 5);
    updateUI();
  }
});

// Keyboard shortcut: space to spin
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !spinning) {
    e.preventDefault();
    spin();
  }
});

// ── Init ─────────────────────────────────────────────
updateUI();
