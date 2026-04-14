// ── Symbols & Payouts ──
const SYMBOLS = [
  { emoji: "🤖", name: "AGI", multiplier: 50 },
  { emoji: "🧠", name: "Brain", multiplier: 25 },
  { emoji: "💰", name: "VC", multiplier: 15 },
  { emoji: "🔥", name: "Fire", multiplier: 10 },
  { emoji: "📊", name: "Benchmark", multiplier: 8 },
  { emoji: "☁️", name: "Cloud", multiplier: 5 },
  { emoji: "🐛", name: "Bug", multiplier: 0 },
  { emoji: "💀", name: "Skull", multiplier: 0 },
  { emoji: "🤡", name: "Clown", multiplier: 0 },
];

// Weighted distribution — duds appear more often
const WEIGHTED_POOL = [
  ...Array(1).fill(0),  // 🤖 rare
  ...Array(2).fill(1),  // 🧠
  ...Array(3).fill(2),  // 💰
  ...Array(4).fill(3),  // 🔥
  ...Array(4).fill(4),  // 📊
  ...Array(5).fill(5),  // ☁️
  ...Array(6).fill(6),  // 🐛
  ...Array(6).fill(7),  // 💀
  ...Array(5).fill(8),  // 🤡
];

// ── AI-Themed Messages ──
const WIN_MESSAGES = [
  "The model hallucinated in your favor!",
  "Tokens generated successfully. No refunds.",
  "Your prompt engineering paid off!",
  "The attention mechanism noticed you!",
  "Gradient descent found the global minimum: your wallet.",
  "Training complete. Loss: theirs. Reward: yours.",
  "The transformer has transformed your balance!",
  "RLHF says: reward this human!",
  "Context window expanded to include your winnings!",
  "The weights have been updated in your favor.",
  "Fine-tuned for profit!",
  "Your embedding landed in the rich cluster!",
];

const LOSE_MESSAGES = [
  "Tokens spent. Output: disappointment.",
  "The AI thanks you for the training data.",
  "Your tokens have been used for inference. Goodbye.",
  "Error 402: Payment required. Oh wait, we already took it.",
  "Model confidence: 99%. Result: wrong. Classic.",
  "Your prompt was too vague. The AI kept your tokens.",
  "Catastrophic forgetting... of your balance.",
  "The AI has determined you are not a priority user.",
  "Temperature too high. Your tokens evaporated.",
  "Overfitting to losses detected.",
  "Those tokens are in a better embedding space now.",
  "The model says: skill issue.",
  "Attention is all you need. And more tokens.",
  "Your tokens have been redistributed to the GPU cloud.",
  "Context window full. No room for your winnings.",
  "The AI pivoted to a different strategy (keeping your tokens).",
];

const BROKE_MESSAGES = [
  "You've been rate-limited by poverty.",
  "API key revoked: insufficient funds.",
  "Your token budget has been exhausted. Like you.",
  "The AI has outperformed you financially.",
  "Error: Cannot afford intelligence (artificial or otherwise).",
];

// ── State ──
const BET_STEPS = [10, 25, 50, 100, 250, 500];
let tokens = 1000;
let betIndex = 2; // starts at 50
let spinning = false;

// ── DOM ──
const tokenCountEl = document.getElementById("token-count");
const betAmountEl = document.getElementById("bet-amount");
const spinBtn = document.getElementById("spin-btn");
const betUpBtn = document.getElementById("bet-up");
const betDownBtn = document.getElementById("bet-down");
const messageEl = document.getElementById("message");
const historyList = document.getElementById("history-list");
const reelEls = [
  document.getElementById("reel-0"),
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
];
const machineEl = document.querySelector(".machine");

// ── Audio via Web Audio API ──
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, duration, type = "square", gain = 0.08) {
  const osc = audioCtx.createOscillator();
  const vol = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  vol.gain.setValueAtTime(gain, audioCtx.currentTime);
  vol.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(vol);
  vol.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playSpinSound() {
  for (let i = 0; i < 6; i++) {
    setTimeout(() => playTone(200 + i * 80, 0.08, "square", 0.04), i * 60);
  }
}

function playStopSound(index) {
  setTimeout(() => playTone(440 + index * 110, 0.12, "triangle", 0.06), 0);
}

function playWinSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.2, "square", 0.06), i * 120);
  });
}

function playJackpotSound() {
  const notes = [523, 659, 784, 1047, 1319, 1568];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.3, "sine", 0.08), i * 100);
  });
}

function playLoseSound() {
  playTone(180, 0.3, "sawtooth", 0.04);
  setTimeout(() => playTone(120, 0.4, "sawtooth", 0.03), 150);
}

// ── Initialize reels ──
function buildReelStrip(reelEl, count = 30) {
  const strip = reelEl.querySelector(".reel-strip");
  strip.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const idx = WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];
    const div = document.createElement("div");
    div.className = "reel-symbol";
    div.textContent = SYMBOLS[idx].emoji;
    div.dataset.symbolIndex = idx;
    strip.appendChild(div);
  }
  return strip;
}

function initReels() {
  reelEls.forEach((reel) => {
    buildReelStrip(reel);
    reel.style.transform = "translateY(0px)";
  });
}

// ── Spin logic ──
function pickResult() {
  return WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];
}

function evaluateSpin(results) {
  const [a, b, c] = results;
  if (a === b && b === c) {
    return { type: "triple", multiplier: SYMBOLS[a].multiplier };
  }
  if (a === b || b === c || a === c) {
    return { type: "double", multiplier: 2 };
  }
  return { type: "none", multiplier: 0 };
}

function randomMessage(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function spin() {
  if (spinning) return;

  const bet = BET_STEPS[betIndex];
  if (tokens < bet) {
    messageEl.textContent = randomMessage(BROKE_MESSAGES);
    messageEl.className = "message broke";
    machineEl.classList.add("shake");
    setTimeout(() => machineEl.classList.remove("shake"), 300);
    return;
  }

  // Resume audio context on user gesture
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  spinning = true;
  spinBtn.disabled = true;
  messageEl.textContent = "Inferencing...";
  messageEl.className = "message";

  // Remove winner highlights
  document.querySelectorAll(".reel-window").forEach((w) => w.classList.remove("winner"));

  // Deduct bet
  tokens -= bet;
  updateTokenDisplay();

  // Pick final symbols
  const results = [pickResult(), pickResult(), pickResult()];

  playSpinSound();

  // Animate each reel
  const SYMBOLS_IN_STRIP = 40;
  const reelPromises = reelEls.map((reelEl, i) => {
    return new Promise((resolve) => {
      const strip = buildReelStrip(reelEl, SYMBOLS_IN_STRIP);

      // Set the final symbol at the target position
      const targetPos = SYMBOLS_IN_STRIP - 3;
      const targetDiv = strip.children[targetPos];
      targetDiv.textContent = SYMBOLS[results[i]].emoji;
      targetDiv.dataset.symbolIndex = results[i];

      const symbolHeight = 120;
      const totalScroll = targetPos * symbolHeight;

      reelEl.style.transition = "none";
      reelEl.style.transform = "translateY(0px)";

      // Force reflow
      reelEl.offsetHeight;

      const duration = 1.2 + i * 0.5;
      reelEl.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.85, 0.35, 1)`;
      reelEl.style.transform = `translateY(-${totalScroll}px)`;

      setTimeout(() => {
        playStopSound(i);
        resolve();
      }, duration * 1000);
    });
  });

  await Promise.all(reelPromises);

  // Evaluate
  const outcome = evaluateSpin(results);
  const winnings = outcome.multiplier * bet;

  if (winnings > 0) {
    tokens += winnings;
    updateTokenDisplay();

    // Flash token counter
    tokenCountEl.classList.remove("flash-win");
    tokenCountEl.offsetHeight;
    tokenCountEl.classList.add("flash-win");

    // Highlight winning reels
    if (outcome.type === "triple") {
      document.querySelectorAll(".reel-window").forEach((w) => w.classList.add("winner"));
      playJackpotSound();
    } else {
      playWinSound();
      // Highlight matching reels
      const [a, b, c] = results;
      if (a === b) {
        document.querySelectorAll(".reel-window")[0].classList.add("winner");
        document.querySelectorAll(".reel-window")[1].classList.add("winner");
      }
      if (b === c) {
        document.querySelectorAll(".reel-window")[1].classList.add("winner");
        document.querySelectorAll(".reel-window")[2].classList.add("winner");
      }
      if (a === c) {
        document.querySelectorAll(".reel-window")[0].classList.add("winner");
        document.querySelectorAll(".reel-window")[2].classList.add("winner");
      }
    }

    const netGain = winnings - bet;
    messageEl.textContent = `+${winnings} tokens! ${randomMessage(WIN_MESSAGES)}`;
    messageEl.className = "message win";
    addHistory(results, `+${winnings}`, true);
  } else {
    playLoseSound();
    tokenCountEl.classList.remove("flash-lose");
    tokenCountEl.offsetHeight;
    tokenCountEl.classList.add("flash-lose");

    messageEl.textContent = randomMessage(LOSE_MESSAGES);
    messageEl.className = "message lose";
    addHistory(results, `-${bet}`, false);
  }

  spinning = false;
  spinBtn.disabled = false;

  // Check if broke
  if (tokens <= 0) {
    messageEl.textContent = randomMessage(BROKE_MESSAGES);
    messageEl.className = "message broke";
    setTimeout(() => {
      if (tokens <= 0) {
        tokens = 500;
        updateTokenDisplay();
        messageEl.textContent = "The AI took pity. Here's 500 tokens. (Bail-out package v2.0)";
        messageEl.className = "message";
      }
    }, 2500);
  }
}

// ── UI Updates ──
function updateTokenDisplay() {
  tokenCountEl.textContent = tokens.toLocaleString();
}

function updateBetDisplay() {
  betAmountEl.textContent = BET_STEPS[betIndex];
}

function addHistory(results, delta, isWin) {
  const li = document.createElement("li");
  li.className = isWin ? "win" : "lose";
  const symbols = results.map((r) => SYMBOLS[r].emoji).join(" ");
  li.innerHTML = `<span>${symbols}</span><span>${delta} tokens</span>`;
  historyList.prepend(li);

  // Keep max 50 entries
  while (historyList.children.length > 50) {
    historyList.removeChild(historyList.lastChild);
  }
}

// ── Event Listeners ──
spinBtn.addEventListener("click", spin);

betUpBtn.addEventListener("click", () => {
  if (betIndex < BET_STEPS.length - 1) {
    betIndex++;
    updateBetDisplay();
  }
});

betDownBtn.addEventListener("click", () => {
  if (betIndex > 0) {
    betIndex--;
    updateBetDisplay();
  }
});

// Keyboard support
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    spin();
  }
});

// ── Initialize ──
initReels();
updateTokenDisplay();
updateBetDisplay();
messageEl.textContent = "Insert prompt to begin. (Press SPIN or Spacebar)";
