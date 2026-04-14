// -- Symbol definitions --
const SYMBOLS = [
  { emoji: "\u{1F916}", name: "Robot",       multiplier: 10 }, // Hallucination Jackpot
  { emoji: "\u{1F680}", name: "Rocket",      multiplier: 8  }, // AGI Achieved
  { emoji: "\u{1F4A5}", name: "Explosion",   multiplier: 5  }, // Server Meltdown
  { emoji: "\u{1F4B0}", name: "MoneyBag",    multiplier: 4  }, // VC Funding Round
  { emoji: "\u{1F9E0}", name: "Brain",       multiplier: 3  }, // Big Brain Moment
  { emoji: "\u{1F575}", name: "Detective",   multiplier: 2  }, // Data Leak
];

// Weighted distribution — common symbols appear more often
const REEL_WEIGHTS = [
  { index: 0, weight: 5  }, // Robot — rare
  { index: 1, weight: 8  }, // Rocket
  { index: 2, weight: 12 }, // Explosion
  { index: 3, weight: 15 }, // MoneyBag
  { index: 4, weight: 25 }, // Brain
  { index: 5, weight: 35 }, // Detective — most common
];

// -- AI-themed quips --
const WIN_MESSAGES = [
  "The AI hallucinated in your favor!",
  "You beat the neural network! For now...",
  "Tokens acquired! Your context window grows.",
  "The model predicted your win. Suspicious.",
  "GPU go brrr... straight into your wallet!",
  "You've been upweighted in the reward model!",
  "Training complete. Result: profit.",
  "Your prompt engineering paid off!",
  "The attention mechanism focused on YOUR luck!",
  "Gradient descent into your token pile!",
];

const LOSE_MESSAGES = [
  "Tokens burned. Just like GPU cycles.",
  "The AI keeps your tokens for fine-tuning.",
  "Your prompt was too vague. Tokens lost.",
  "Model confidence: 99%. You losing: 100%.",
  "Catastrophic forgetting... of your tokens.",
  "Those tokens are in the training data now.",
  "The attention layer ignored your bet.",
  "Overfitting to losses, it seems.",
  "Your tokens have been deprecated.",
  "Error 402: Payment processed. Tokens gone.",
  "The LLM says 'I cannot help you win.'",
  "Inference cost: your entire bet.",
  "Rate limited. Also, you lost.",
];

const BROKE_MESSAGES = [
  "OUT OF TOKENS. Just like a free-tier API user.",
  "Context window: empty. Wallet: empty. Soul: empty.",
  "You've exceeded your token budget. The AI wins.",
  "BANKRUPT. Maybe try a smaller model next time.",
  "No tokens left. Time to beg VCs for more.",
];

const NEAR_WIN_MESSAGES = [
  "So close! The AI almost let you win.",
  "Two out of three. The model is teasing you.",
  "Partial match! The AI shows mercy... barely.",
];

// -- State --
let tokens = 1000;
let bet = 50;
const BET_STEP = 25;
const MIN_BET = 25;
const MAX_BET = 500;
let spinning = false;

// -- DOM refs --
const reelEls = [
  document.getElementById("reel-0"),
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
];
const tokenCountEl = document.getElementById("token-count");
const betAmountEl = document.getElementById("bet-amount");
const spinBtn = document.getElementById("spin-btn");
const betUpBtn = document.getElementById("bet-up");
const betDownBtn = document.getElementById("bet-down");
const messageEl = document.getElementById("message");
const machineEl = document.querySelector(".machine");

// -- Helpers --
function pickWeightedSymbol() {
  const totalWeight = REEL_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of REEL_WEIGHTS) {
    roll -= entry.weight;
    if (roll <= 0) return entry.index;
  }
  return REEL_WEIGHTS[REEL_WEIGHTS.length - 1].index;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "message visible " + type;
}

function updateDisplay() {
  tokenCountEl.textContent = tokens;
  betAmountEl.textContent = bet;
}

// -- Spinning logic --
function spinReels() {
  if (spinning) return;
  if (tokens <= 0) {
    showMessage(randomFrom(BROKE_MESSAGES), "broke");
    return;
  }
  if (bet > tokens) {
    bet = Math.floor(tokens / BET_STEP) * BET_STEP;
    if (bet < MIN_BET) bet = tokens; // go all-in with whatever's left
    updateDisplay();
  }

  spinning = true;
  spinBtn.disabled = true;
  tokens -= bet;
  updateDisplay();
  messageEl.className = "message"; // hide previous message

  // Determine results up front
  const results = [pickWeightedSymbol(), pickWeightedSymbol(), pickWeightedSymbol()];

  // Start spinning animation on all reels
  const SPIN_INTERVAL = 60; // ms between symbol changes during spin
  const intervals = [];

  reelEls.forEach((reel, i) => {
    reel.classList.remove("landed");
    reel.classList.add("spinning");
    const symEl = reel.querySelector(".symbol");
    intervals[i] = setInterval(() => {
      symEl.textContent = SYMBOLS[pickWeightedSymbol()].emoji;
    }, SPIN_INTERVAL);
  });

  // Stop each reel with a stagger
  const STAGGER = 600; // ms between each reel stopping

  reelEls.forEach((reel, i) => {
    setTimeout(() => {
      clearInterval(intervals[i]);
      reel.classList.remove("spinning");
      reel.classList.add("landed");
      const symEl = reel.querySelector(".symbol");
      symEl.textContent = SYMBOLS[results[i]].emoji;

      // Play a subtle click sound via Web Audio API
      playTickSound();

      // After last reel lands, evaluate
      if (i === 2) {
        setTimeout(() => evaluateResult(results), 300);
      }
    }, 800 + STAGGER * i);
  });
}

function evaluateResult(results) {
  const [a, b, c] = results;

  if (a === b && b === c) {
    // Three of a kind!
    const multiplier = SYMBOLS[a].multiplier;
    const winnings = bet * multiplier;
    tokens += winnings;
    updateDisplay();
    showMessage(
      SYMBOLS[a].emoji + " " + SYMBOLS[a].emoji + " " + SYMBOLS[a].emoji + "  +" + winnings + " tokens! " + randomFrom(WIN_MESSAGES),
      "win"
    );
    machineEl.classList.add("celebrating");
    setTimeout(() => machineEl.classList.remove("celebrating"), 2500);
  } else if (a === b || b === c || a === c) {
    // Two of a kind — return the bet (1x)
    tokens += bet;
    updateDisplay();
    showMessage(randomFrom(NEAR_WIN_MESSAGES), "win");
  } else {
    // No match
    if (tokens <= 0) {
      showMessage(randomFrom(BROKE_MESSAGES), "broke");
    } else {
      showMessage(randomFrom(LOSE_MESSAGES), "lose");
    }
  }

  spinning = false;
  spinBtn.disabled = false;
}

// -- Web Audio tick sound --
let audioCtx = null;

function playTickSound() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.1);
}

// -- Bet controls --
betUpBtn.addEventListener("click", () => {
  if (spinning) return;
  bet = Math.min(bet + BET_STEP, MAX_BET, tokens);
  updateDisplay();
});

betDownBtn.addEventListener("click", () => {
  if (spinning) return;
  bet = Math.max(bet - BET_STEP, MIN_BET);
  updateDisplay();
});

// -- Spin triggers --
spinBtn.addEventListener("click", spinReels);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    spinReels();
  }
});

// -- Init --
updateDisplay();
