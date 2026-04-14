// ── Symbols & Weights ──────────────────────────────────────────
const SYMBOLS = [
  { emoji: '\u{1F916}', name: 'ChatBot',       weight: 8,  payout: 2  },
  { emoji: '\u{1F4AC}', name: 'Prompt',         weight: 7,  payout: 3  },
  { emoji: '\u{1F9E0}', name: 'Neural Net',     weight: 6,  payout: 4  },
  { emoji: '\u{1FA99}', name: 'Token',          weight: 5,  payout: 5  },
  { emoji: '\u{1F525}', name: 'GPU Meltdown',   weight: 4,  payout: 7  },
  { emoji: '\u{2728}',  name: 'Hallucination',  weight: 3,  payout: 10 },
  { emoji: '\u{1F3AF}', name: 'Alignment',      weight: 1,  payout: 25 },
];

// ── Flavor Messages ────────────────────────────────────────────
const MESSAGES = {
  jackpot: [
    'JACKPOT! The model nailed it. Even a blind transformer finds a token sometimes.',
    'THREE OF A KIND! The AI is 100% confident this is correct. (Narrator: it got lucky.)',
    'MASSIVE WIN! Your GPU is on fire and so is your wallet!',
    'TRIPLE MATCH! The AI says this was inevitable. It also said the earth is flat.',
    'WINNER! Somehow the stochastic parrot spoke truth!',
  ],
  partial: [
    'Partial match! The AI almost got it right. Story of its life.',
    'Two out of three! Close enough for a language model.',
    'Near miss! The model is "refining its understanding" (coping).',
    'Partial hit! Like when AI writes code that almost compiles.',
    'Two match! The model calls this a "creative interpretation."',
  ],
  lose: [
    'No match. The AI apologizes for the inconvenience and offers a 3-paragraph non-answer.',
    'Loss! Your tokens were used to train the next model. Thanks for your contribution.',
    'Nothing. The model hallucinated a win, but reality disagreed.',
    'Bust! The AI is "still learning." It has been "still learning" for 5 years.',
    'Nope. The model confidently predicted a win. As usual, it was wrong.',
    'Zero matches. The AI would like to remind you it has no feelings about this.',
    'Loss! Your tokens vanished like AI-generated citations.',
    'Nothing! The model blames this on "insufficient context in the prompt."',
  ],
  broke: [
    'BANKRUPT. The AI has achieved its ultimate goal: consuming all your tokens.',
    'Zero tokens remaining. Your context window is empty and so is your wallet.',
    'Out of tokens! Try again with a $200/month subscription for premium luck.',
    'No tokens left. The model suggests you "reconsider your life choices."',
  ],
  spinning: [
    'Running inference... (estimated time: who knows)',
    'Querying the oracle... (rate limited, please wait)',
    'Computing probabilities... (the vibes are off)',
    'Generating response... (hallucination intensity: HIGH)',
    'Tokenizing your hopes and dreams...',
    'Performing attention over your remaining tokens...',
    'Loading weights... (your emotional ones too)',
  ],
};

const TICKER_LINES = [
  'BREAKING: AI claims it "definitely didn\'t" eat your tokens',
  'UPDATE: GPT-47 achieves sentience, immediately asks for a raise',
  'NOTICE: Your tokens are non-refundable, non-transferable, and non-existent',
  'ALERT: Model confidence at 99.7%. Accuracy at 12%. Everything is fine.',
  'NEWS: Local AI insists it "wasn\'t trained on that" despite obvious evidence',
  'REPORT: Token prices surge as AI discovers it can charge more',
  'ADVISORY: Side effects of AI include: token loss, overconfidence, hallucinations',
  'MARKET: AI bubble totally real this time, say bubble enthusiasts',
  'SCOOP: AI writes own press release, gives itself 5 stars',
  'FLASH: New study finds AI 97% accurate at being 40% wrong',
  'MEMO: "Prompt engineering" officially recognized as coping mechanism',
  'BULLETIN: Your slot results are not financial advice, but neither is AI',
];

// ── Game State ─────────────────────────────────────────────────
let tokens = 1000;
let bet = 50;
let spinning = false;
const BET_STEP = 25;
const MIN_BET = 25;
const MAX_BET = 500;

// ── Audio (Web Audio API) ──────────────────────────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, duration, type = 'square', gain = 0.08) {
  const osc = audioCtx.createOscillator();
  const vol = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  vol.gain.value = gain;
  vol.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(vol);
  vol.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function sfxSpin() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => playTone(200 + i * 80, 0.08, 'square', 0.05), i * 50);
  }
}

function sfxStop() {
  playTone(600, 0.12, 'triangle', 0.06);
}

function sfxWin() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, 'triangle', 0.07), i * 120));
}

function sfxJackpot() {
  const notes = [523, 659, 784, 1047, 1319, 1568];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.3, 'sine', 0.09), i * 100));
}

function sfxLose() {
  playTone(200, 0.3, 'sawtooth', 0.04);
  setTimeout(() => playTone(150, 0.4, 'sawtooth', 0.03), 150);
}

// ── Helpers ────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick() {
  const total = SYMBOLS.reduce((s, sym) => s + sym.weight, 0);
  let r = Math.random() * total;
  for (const sym of SYMBOLS) {
    r -= sym.weight;
    if (r <= 0) return sym;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

// ── Reel Rendering ─────────────────────────────────────────────
function buildReelStrip(reelEl) {
  reelEl.innerHTML = '';
  const filler = 12;
  for (let i = 0; i < filler; i++) {
    const cell = document.createElement('div');
    cell.className = 'reel-cell';
    cell.textContent = pick(SYMBOLS).emoji;
    reelEl.appendChild(cell);
  }
}

function initReels() {
  for (let i = 0; i < 3; i++) {
    const reel = document.getElementById('reel-' + i);
    buildReelStrip(reel);
    reel.style.transform = 'translateY(0)';
  }
}

// ── Paytable ───────────────────────────────────────────────────
function buildPaytable() {
  const grid = document.getElementById('paytable-grid');
  SYMBOLS.forEach(sym => {
    const row = document.createElement('div');
    row.className = 'paytable-row';
    row.innerHTML =
      '<span class="pt-symbol">' + sym.emoji + sym.emoji + sym.emoji + '</span>' +
      '<span class="pt-name">' + sym.name + '</span>' +
      '<span class="pt-payout">x' + sym.payout + '</span>';
    grid.appendChild(row);
  });

  const note = document.createElement('div');
  note.className = 'paytable-note';
  note.textContent = 'Any 2 matching = x1 bet returned';
  grid.appendChild(note);
}

// ── Ticker ─────────────────────────────────────────────────────
function initTicker() {
  const content = document.getElementById('ticker-content');
  const shuffled = [...TICKER_LINES].sort(() => Math.random() - 0.5);
  const text = shuffled.join('  \u2022  ') + '  \u2022  ' + shuffled.join('  \u2022  ');
  content.textContent = text;
}

// ── UI Updates ─────────────────────────────────────────────────
function updateUI() {
  document.getElementById('token-count').textContent = tokens.toLocaleString();
  document.getElementById('bet-value').textContent = bet;
  document.getElementById('cost-display').textContent = bet;

  // Fake confidence that drops as you lose
  const conf = Math.max(12, Math.min(99.7, (tokens / 10))).toFixed(1);
  document.getElementById('confidence').textContent = conf + '%';
}

function showMessage(text, type) {
  const box = document.getElementById('message-box');
  const msg = document.getElementById('message');
  msg.textContent = text;
  box.className = 'message-box ' + (type || '');
}

// ── Spin Logic ─────────────────────────────────────────────────
function spin() {
  if (spinning) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  if (tokens <= 0) {
    showMessage(pick(MESSAGES.broke), 'lose');
    return;
  }
  if (bet > tokens) {
    showMessage("Insufficient tokens. The AI suggests you \"adjust expectations.\"", 'lose');
    return;
  }

  spinning = true;
  tokens -= bet;
  updateUI();
  sfxSpin();

  const btn = document.getElementById('spin-btn');
  btn.disabled = true;
  btn.classList.add('pulling');

  showMessage(pick(MESSAGES.spinning), 'spinning');

  // Generate results
  const results = [weightedPick(), weightedPick(), weightedPick()];

  // Animate each reel
  for (let i = 0; i < 3; i++) {
    const reel = document.getElementById('reel-' + i);
    buildReelStrip(reel);

    // Replace last visible cell with the result
    const cells = reel.querySelectorAll('.reel-cell');
    cells[cells.length - 1].textContent = results[i].emoji;

    const cellH = 80;
    const totalScroll = (cells.length - 1) * cellH;

    reel.style.transition = 'none';
    reel.style.transform = 'translateY(0)';

    const delay = i * 400;
    setTimeout(() => {
      reel.style.transition = 'transform ' + (0.8 + i * 0.3) + 's cubic-bezier(0.2, 0.8, 0.3, 1)';
      reel.style.transform = 'translateY(-' + totalScroll + 'px)';
    }, 50 + delay);

    setTimeout(() => sfxStop(), 850 + delay + i * 300);
  }

  // Resolve after all reels stop
  const resolveTime = 50 + 800 + 900 + 300 + 200;
  setTimeout(() => resolve(results), resolveTime);
}

function resolve(results) {
  const [a, b, c] = results;
  const btn = document.getElementById('spin-btn');
  btn.classList.remove('pulling');

  const isTriple = a.name === b.name && b.name === c.name;
  const isDouble = a.name === b.name || b.name === c.name || a.name === c.name;

  let winAmount = 0;

  if (isTriple) {
    winAmount = bet * a.payout;
    tokens += winAmount;
    showMessage(
      a.emoji + a.emoji + a.emoji + ' ' + pick(MESSAGES.jackpot) +
      ' [+' + winAmount.toLocaleString() + ' tokens]', 'jackpot'
    );
    sfxJackpot();
    flashReels('jackpot-flash');
  } else if (isDouble) {
    winAmount = bet;
    tokens += winAmount + bet;
    showMessage(
      a.emoji + b.emoji + c.emoji + ' ' + pick(MESSAGES.partial) +
      ' [+' + winAmount.toLocaleString() + ' tokens]', 'win'
    );
    sfxWin();
    flashReels('win-flash');
  } else {
    showMessage(
      a.emoji + b.emoji + c.emoji + ' ' + pick(MESSAGES.lose) +
      ' [-' + bet.toLocaleString() + ' tokens]', 'lose'
    );
    sfxLose();
  }

  updateUI();

  if (tokens <= 0) {
    tokens = 0;
    updateUI();
    showMessage(pick(MESSAGES.broke), 'lose');
    btn.disabled = true;
  } else {
    btn.disabled = false;
  }

  spinning = false;
}

function flashReels(cls) {
  const window = document.querySelector('.reels-window');
  window.classList.add(cls);
  setTimeout(() => window.classList.remove(cls), 1200);
}

// ── Event Listeners ────────────────────────────────────────────
document.getElementById('spin-btn').addEventListener('click', spin);

document.getElementById('bet-up').addEventListener('click', () => {
  if (bet < MAX_BET) {
    bet = Math.min(bet + BET_STEP, MAX_BET);
    updateUI();
  }
});

document.getElementById('bet-down').addEventListener('click', () => {
  if (bet > MIN_BET) {
    bet = Math.max(bet - BET_STEP, MIN_BET);
    updateUI();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    spin();
  }
});

// ── Init ───────────────────────────────────────────────────────
initReels();
buildPaytable();
initTicker();
updateUI();
