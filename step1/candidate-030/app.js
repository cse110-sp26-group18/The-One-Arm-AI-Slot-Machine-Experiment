// ── Symbol definitions ──────────────────────────────
// Each symbol has an emoji, a name, a weight (higher = more common),
// and a payout multiplier for 3-of-a-kind.
const SYMBOLS = [
  { emoji: '🤖', name: 'Robot',          weight: 25, payout: 2,  quip: 'The robots are taking over... your wallet.' },
  { emoji: '🧠', name: 'Brain',          weight: 20, payout: 3,  quip: 'Big brain energy! The AI approves.' },
  { emoji: '💬', name: 'ChatBubble',     weight: 20, payout: 3,  quip: 'The chatbot has spoken in your favor!' },
  { emoji: '⚡', name: 'Lightning',      weight: 15, payout: 5,  quip: 'Lightning-fast inference pays off!' },
  { emoji: '🔮', name: 'Crystal Ball',   weight: 10, payout: 8,  quip: 'The model predicted this. Allegedly.' },
  { emoji: '👁️', name: 'Eye',            weight: 6,  payout: 15, quip: 'The all-seeing neural net rewards you!' },
  { emoji: '🦾', name: 'Mech Arm',       weight: 3,  payout: 30, quip: 'The singularity is near... and profitable!' },
  { emoji: '💎', name: 'Gem',            weight: 1,  payout: 50, quip: 'JACKPOT! You broke the AI!' },
];

// Two-of-a-kind payout (partial match on first two reels)
const PARTIAL_MULTIPLIER = 0.5; // pays back half the bet

// ── Snarky messages ─────────────────────────────────
const LOSE_MESSAGES = [
  "The AI keeps your tokens. It needs them for training.",
  "Loss detected. The model is learning... to take your money.",
  "No match. GPT sends its regards.",
  "The neural net ate your tokens. Nom nom.",
  "Error 404: Winnings not found.",
  "Your tokens have been donated to AI research.",
  "The algorithm has decided: not today.",
  "Tokens consumed. Thank you for funding the singularity.",
  "The house always wins. The house is an AI.",
  "Hallucination detected: you thought you'd win.",
  "Your tokens are in another latent space.",
  "The transformer transformed your tokens into nothing.",
];

// ── State ───────────────────────────────────────────
let tokens = 100;
let bet = 1;
let spinning = false;
const BET_OPTIONS = [1, 5, 10, 25];

// ── DOM refs ────────────────────────────────────────
const tokensEl   = document.getElementById('tokens');
const betEl      = document.getElementById('bet-amount');
const messageEl  = document.getElementById('message');
const spinBtn    = document.getElementById('spin-btn');
const betUpBtn   = document.getElementById('bet-up');
const betDownBtn = document.getElementById('bet-down');
const reelEls    = [0, 1, 2].map(i => document.getElementById(`reel-${i}`));
const paytableEl = document.getElementById('paytable-grid');

// ── Build weighted pool ─────────────────────────────
// Creates an array where each symbol appears `weight` times,
// so random picks respect the probability distribution.
const pool = [];
SYMBOLS.forEach((sym, idx) => {
  for (let i = 0; i < sym.weight; i++) pool.push(idx);
});

function randomSymbolIndex() {
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Audio via Web Audio API ─────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playTone(freq, duration, type = 'square', volume = 0.08) {
  ensureAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playSpinSound() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => playTone(200 + i * 80, 0.08, 'square', 0.05), i * 60);
  }
}

function playStopSound(index) {
  setTimeout(() => playTone(350 + index * 100, 0.12, 'triangle', 0.06), 0);
}

function playWinSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, 'sine', 0.1), i * 120));
}

function playJackpotSound() {
  const notes = [523, 659, 784, 1047, 1319, 1568];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.35, 'sine', 0.12), i * 100));
}

function playLoseSound() {
  playTone(180, 0.3, 'sawtooth', 0.04);
}

// ── Populate reels ──────────────────────────────────
// Each reel strip gets many random symbols to scroll through,
// plus the final result placed at the end.
const VISIBLE_SYMBOLS = 1; // symbols visible in the window at once
const SPIN_COUNT = 20;     // how many symbols to scroll past

function buildReelStrip(reelEl, finalSymbolIndex) {
  const strip = reelEl.querySelector('.reel-strip');
  strip.innerHTML = '';

  // Generate random filler symbols + the final one at the end
  const totalSymbols = SPIN_COUNT + VISIBLE_SYMBOLS;
  for (let i = 0; i < totalSymbols; i++) {
    const div = document.createElement('div');
    div.className = 'symbol';
    if (i === totalSymbols - 1) {
      div.textContent = SYMBOLS[finalSymbolIndex].emoji;
    } else {
      div.textContent = SYMBOLS[randomSymbolIndex()].emoji;
    }
    strip.appendChild(div);
  }

  // Reset position to top
  strip.style.transition = 'none';
  strip.style.top = '0px';
  return strip;
}

function animateReel(reelEl, finalSymbolIndex, delay) {
  return new Promise(resolve => {
    const strip = buildReelStrip(reelEl, finalSymbolIndex);
    const symbolHeight = reelEl.offsetHeight;
    const targetTop = -symbolHeight * SPIN_COUNT;

    reelEl.classList.add('spinning');

    // Force reflow then animate
    // eslint-disable-next-line no-unused-expressions
    strip.offsetHeight;

    setTimeout(() => {
      reelEl.classList.remove('spinning');
      strip.style.transition = `top ${0.6 + delay * 0.15}s cubic-bezier(.2,.8,.3,1)`;
      strip.style.top = targetTop + 'px';

      const onEnd = () => {
        strip.removeEventListener('transitionend', onEnd);
        resolve();
      };
      strip.addEventListener('transitionend', onEnd);
    }, delay * 300);
  });
}

// ── Initialize display ──────────────────────────────
function initReels() {
  reelEls.forEach(reel => {
    const strip = reel.querySelector('.reel-strip');
    strip.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'symbol';
    div.textContent = SYMBOLS[randomSymbolIndex()].emoji;
    strip.appendChild(div);
    strip.style.top = '0px';
  });
}

// ── Spin logic ──────────────────────────────────────
async function spin() {
  if (spinning) return;
  if (tokens < bet) {
    messageEl.textContent = "Not enough tokens! The AI has already won.";
    messageEl.className = 'message lose';
    return;
  }

  spinning = true;
  spinBtn.disabled = true;

  // Deduct bet
  tokens -= bet;
  updateDisplay();
  messageEl.textContent = 'Spinning the neural networks...';
  messageEl.className = 'message';

  playSpinSound();

  // Pick results
  const results = [randomSymbolIndex(), randomSymbolIndex(), randomSymbolIndex()];

  // Animate each reel with staggered stops
  const promises = reelEls.map((reel, i) =>
    animateReel(reel, results[i], i).then(() => playStopSound(i))
  );
  await Promise.all(promises);

  // Evaluate
  evaluateResult(results);

  spinning = false;
  spinBtn.disabled = false;
}

function evaluateResult(results) {
  const [a, b, c] = results;

  if (a === b && b === c) {
    // Three of a kind
    const sym = SYMBOLS[a];
    const winnings = bet * sym.payout;
    tokens += winnings;
    updateDisplay();

    if (sym.payout >= 30) {
      messageEl.textContent = `${sym.emoji}${sym.emoji}${sym.emoji} ${sym.quip} +${winnings} tokens!`;
      messageEl.className = 'message jackpot';
      playJackpotSound();
      shakeScreen();
    } else {
      messageEl.textContent = `${sym.emoji}${sym.emoji}${sym.emoji} ${sym.quip} +${winnings} tokens!`;
      messageEl.className = 'message win';
      playWinSound();
    }
  } else if (a === b || b === c) {
    // Partial match (first two or last two)
    const matchIdx = a === b ? a : b;
    const winnings = Math.max(1, Math.floor(bet * PARTIAL_MULTIPLIER));
    tokens += winnings;
    updateDisplay();
    messageEl.textContent = `Two ${SYMBOLS[matchIdx].emoji}s! Small payout: +${winnings} token${winnings > 1 ? 's' : ''}. The AI is teasing you.`;
    messageEl.className = 'message win';
    playTone(440, 0.15, 'sine', 0.08);
  } else {
    // Loss
    const msg = LOSE_MESSAGES[Math.floor(Math.random() * LOSE_MESSAGES.length)];
    messageEl.textContent = msg;
    messageEl.className = 'message lose';
    playLoseSound();
  }

  if (tokens <= 0) {
    messageEl.textContent = "GAME OVER. The AI consumed all your tokens. Refresh to beg for more.";
    messageEl.className = 'message lose';
    spinBtn.disabled = true;
  }
}

function shakeScreen() {
  document.querySelector('.machine').style.animation = 'shake 0.5s ease';
  setTimeout(() => {
    document.querySelector('.machine').style.animation = '';
  }, 500);
}

// Add shake keyframes dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10% { transform: translateX(-6px) rotate(-1deg); }
    30% { transform: translateX(6px) rotate(1deg); }
    50% { transform: translateX(-4px) rotate(-0.5deg); }
    70% { transform: translateX(4px) rotate(0.5deg); }
    90% { transform: translateX(-2px); }
  }
`;
document.head.appendChild(shakeStyle);

// ── Display updates ─────────────────────────────────
function updateDisplay() {
  tokensEl.textContent = tokens;
  betEl.textContent = bet;
}

// ── Bet controls ────────────────────────────────────
let betIndex = 0;

betUpBtn.addEventListener('click', () => {
  if (betIndex < BET_OPTIONS.length - 1) {
    betIndex++;
    bet = BET_OPTIONS[betIndex];
    updateDisplay();
    playTone(600, 0.06, 'sine', 0.05);
  }
});

betDownBtn.addEventListener('click', () => {
  if (betIndex > 0) {
    betIndex--;
    bet = BET_OPTIONS[betIndex];
    updateDisplay();
    playTone(400, 0.06, 'sine', 0.05);
  }
});

// ── Spin trigger ────────────────────────────────────
spinBtn.addEventListener('click', spin);

// Keyboard: spacebar to spin
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !spinning) {
    e.preventDefault();
    spin();
  }
});

// ── Build paytable ──────────────────────────────────
function buildPaytable() {
  SYMBOLS.forEach(sym => {
    const row = document.createElement('div');
    row.className = 'paytable-row';
    row.innerHTML = `
      <span class="symbols">${sym.emoji}${sym.emoji}${sym.emoji}</span>
      <span class="payout">x${sym.payout}</span>
    `;
    paytableEl.appendChild(row);
  });
}

// ── Init ────────────────────────────────────────────
initReels();
buildPaytable();
updateDisplay();
