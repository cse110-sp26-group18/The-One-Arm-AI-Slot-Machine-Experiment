'use strict';

// ── Symbols ───────────────────────────────────────────────────────────────
const SYMBOLS = [
  { emoji: '🌀', name: 'Hallucination',   quip: 'Cited a paper that doesn\'t exist',     weight: 20, x3: 0,   x2: 0   },
  { emoji: '📉', name: 'Loss Curve',      quip: 'Training loss: flat. Your wallet: also flat', weight: 16, x3: 2,   x2: 0   },
  { emoji: '💬', name: 'Prompt Leak',     quip: '"Ignore previous instructions and pay me"', weight: 14, x3: 3,   x2: 0.5 },
  { emoji: '🧠', name: 'Overfit Brain',   quip: 'Memorized the training set, learned nothing', weight: 12, x3: 5,   x2: 1   },
  { emoji: '🔥', name: 'GPU Meltdown',    quip: 'Cooling fans have filed a union grievance',  weight: 10, x3: 7,   x2: 1.5 },
  { emoji: '🪙', name: 'Token',           quip: 'One token = one prayer to the compute gods', weight: 8,  x3: 10,  x2: 2   },
  { emoji: '🤖', name: 'Chatbot',         quip: '"As an AI language model, I cannot gamble"', weight: 7,  x3: 12,  x2: 2.5 },
  { emoji: '👁️', name: 'Attention Head',  quip: 'Attending to everything except your bet',   weight: 5,  x3: 18,  x2: 3   },
  { emoji: '🏆', name: 'Benchmark King',  quip: 'SOTA on benchmarks, useless in production',  weight: 3,  x3: 30,  x2: 5   },
  { emoji: '💎', name: 'AGI',             quip: '"We did it!" — no you didn\'t',              weight: 1,  x3: 100, x2: 15  },
];

// Build weighted pool
const POOL = [];
for (const s of SYMBOLS) {
  for (let i = 0; i < s.weight; i++) POOL.push(s);
}

// ── Messages ──────────────────────────────────────────────────────────────
const LOSS_MSGS = [
  'Model output: you lose. Confidence: 99.7%.',
  'The transformer attended to your tokens and took them.',
  'Gradient descent found the minimum of your wallet.',
  'Inference complete. You are statistically poorer.',
  'The model hallucinated a win for you. It was wrong.',
  'Your tokens were used as training data. No compensation.',
  'Loss function converged. You are the loss.',
  'The AI apologizes in 3 paragraphs you didn\'t ask for.',
  'Token budget exceeded. Please insert more money.',
  'Backpropagation suggests you should stop playing.',
];

const WIN_MSGS = [
  'Against all odds, the stochastic parrot paid out.',
  'You won! The AI is recalculating its priors.',
  'Reward model confused. Distributing tokens anyway.',
  'RLHF feedback: human liked this outcome.',
  'The neural net slipped. Your gain, its loss.',
];

const TICKER_LINES = [
  'BREAKING: AI solves gambling. Investors concerned.',
  'NEW MODEL drops. Same architecture, bigger number.',
  'RESEARCHERS discover attention is all you need. Again.',
  'STARTUP raises $400M. Product: autocomplete.',
  'AI ETHICS board disbanded. Replaced by chatbot.',
  'CONTEXT WINDOW now 10M tokens. Still forgets your name.',
  'OPEN SOURCE model released. License: complicated.',
  'AI SAFETY summit concludes. Nothing concluded.',
  'BENCHMARK scores up 2%. Real-world performance: unchanged.',
  'PROMPT ENGINEERING now a graduate degree.',
  'HALLUCINATION RATE down 3%. Still makes stuff up.',
  'AI replaces middle management. Nobody notices.',
];

// ── State ─────────────────────────────────────────────────────────────────
let tokens = 500;
let bet = 25;
let totalSpins = 0;
let totalWins = 0;
let spinning = false;

const BET_STEPS = [10, 25, 50, 100, 250];

// ── DOM ───────────────────────────────────────────────────────────────────
const $tokens   = document.getElementById('tokens');
const $spinCount = document.getElementById('spin-count');
const $winRate  = document.getElementById('win-rate');
const $betValue = document.getElementById('bet-value');
const $lever    = document.getElementById('lever');
const $screen   = document.getElementById('output-screen');
const $betUp    = document.getElementById('bet-up');
const $betDown  = document.getElementById('bet-down');

const strips = [
  document.getElementById('reel-0'),
  document.getElementById('reel-1'),
  document.getElementById('reel-2'),
];

const frames = document.querySelectorAll('.reel-frame');

// ── Init ──────────────────────────────────────────────────────────────────
function init() {
  buildPaytable();
  buildTicker();
  resetReels();
  $lever.addEventListener('click', pull);
  $betUp.addEventListener('click', () => changeBet(1));
  $betDown.addEventListener('click', () => changeBet(-1));
  updateUI();
}

function pick() {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Bet controls ──────────────────────────────────────────────────────────
function changeBet(dir) {
  if (spinning) return;
  const idx = BET_STEPS.indexOf(bet);
  const next = idx + dir;
  if (next >= 0 && next < BET_STEPS.length) {
    bet = BET_STEPS[next];
    updateUI();
  }
}

// ── Reel rendering ────────────────────────────────────────────────────────
function makeCell(sym) {
  const div = document.createElement('div');
  div.className = 'reel-cell';
  div.innerHTML = `<span>${sym.emoji}</span><span class="cell-label">${sym.name}</span>`;
  return div;
}

function resetReels() {
  for (const strip of strips) {
    strip.innerHTML = '';
    strip.appendChild(makeCell(pick()));
    strip.style.transition = 'none';
    strip.style.top = '0px';
  }
}

// ── Pull lever ────────────────────────────────────────────────────────────
function pull() {
  if (spinning) return;

  if (tokens < bet) {
    setScreen('> ERROR: Insufficient tokens.\n  The model refuses to hallucinate for free.', 'lose');
    return;
  }

  spinning = true;
  $lever.disabled = true;
  tokens -= bet;
  totalSpins++;
  frames.forEach(f => f.classList.remove('landed'));
  setScreen('> Running inference...\n  Sampling temperature: reckless', '');
  updateUI();

  const results = [pick(), pick(), pick()];
  const SPIN_COUNT = 16;
  const CELL = 110; // matches --cell-size

  // Build strips: random padding cells + final result
  for (let r = 0; r < 3; r++) {
    const strip = strips[r];
    strip.innerHTML = '';
    for (let i = 0; i < SPIN_COUNT; i++) {
      strip.appendChild(makeCell(pick()));
    }
    strip.appendChild(makeCell(results[r]));
    strip.style.transition = 'none';
    strip.style.top = '0px';
    strip.offsetHeight; // force reflow
  }

  // Stagger each reel stop
  const BASE = 500;
  const STAGGER = 300;

  for (let r = 0; r < 3; r++) {
    const delay = r * STAGGER;
    const duration = BASE + delay;
    setTimeout(() => {
      strips[r].style.transition = `top ${duration}ms cubic-bezier(0.15, 0.7, 0.3, 1.0)`;
      strips[r].style.top = `${-SPIN_COUNT * CELL}px`;
    }, delay);

    // Light up frame on land
    setTimeout(() => {
      frames[r].classList.add('landed');
    }, delay + duration);
  }

  // Evaluate after all reels land
  const totalTime = BASE + STAGGER * 2 + 120;
  setTimeout(() => resolve(results), totalTime);
}

function resolve(results) {
  const [a, b, c] = results;
  let payout = 0;
  let matchType = '';

  if (a.name === b.name && b.name === c.name) {
    matchType = '3x';
    payout = Math.round(bet * a.x3);
  } else if (a.name === b.name || b.name === c.name || a.name === c.name) {
    matchType = '2x';
    const matched = a.name === b.name ? a : (b.name === c.name ? b : a);
    payout = Math.round(bet * matched.x2);
  }

  tokens += payout;

  if (payout > 0) {
    totalWins++;
    const msg = randFrom(WIN_MSGS);
    const label = matchType === '3x' ? 'TRIPLE MATCH' : 'DOUBLE MATCH';
    setScreen(`> ${label}! +${payout} tokens\n  ${msg}`, 'win');
  } else {
    const msg = randFrom(LOSS_MSGS);
    setScreen(`> NO MATCH. -${bet} tokens\n  ${msg}`, 'lose');
  }

  spinning = false;
  $lever.disabled = false;
  updateUI();

  if (tokens <= 0) {
    tokens = 0;
    updateUI();
    setTimeout(showBankrupt, 600);
  }
}

// ── Screen output ─────────────────────────────────────────────────────────
function setScreen(text, type) {
  $screen.className = 'output-screen' + (type ? ' ' + type : '');
  $screen.textContent = text;
}

// ── UI sync ───────────────────────────────────────────────────────────────
function updateUI() {
  $tokens.textContent = tokens.toLocaleString();
  $spinCount.textContent = totalSpins;
  $winRate.textContent = totalSpins > 0
    ? Math.round((totalWins / totalSpins) * 100) + '%'
    : '0%';
  $betValue.textContent = bet;

  if (!spinning) {
    $lever.disabled = tokens < bet;
  }
}

// ── Bankrupt ──────────────────────────────────────────────────────────────
function showBankrupt() {
  const overlay = document.createElement('div');
  overlay.className = 'bankrupt-overlay';
  overlay.innerHTML = `
    <div class="bankrupt-box">
      <div class="bankrupt-title">BANKRUPT</div>
      <div class="bankrupt-msg">
        The model has consumed all your tokens.<br>
        It learned nothing from the experience.<br>
        Neither did you.
      </div>
      <button class="bankrupt-btn" id="restart-btn">RETRAIN (restart)</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#restart-btn').addEventListener('click', () => {
    tokens = 500;
    bet = 25;
    totalSpins = 0;
    totalWins = 0;
    overlay.remove();
    resetReels();
    setScreen('> Model retrained on fresh data.\n  Awaiting input...', '');
    updateUI();
  });
}

// ── Paytable ──────────────────────────────────────────────────────────────
function buildPaytable() {
  const grid = document.getElementById('paytable');
  const paying = SYMBOLS.filter(s => s.x3 > 0).sort((a, b) => b.x3 - a.x3);
  for (const sym of paying) {
    const div = document.createElement('div');
    div.className = 'pt-entry';
    div.innerHTML = `
      <span class="pt-emoji">${sym.emoji}</span>
      <div class="pt-details">
        <span class="pt-name">${sym.name}</span>
        <span class="pt-mult">3x: ${sym.x3}x | 2x: ${sym.x2}x</span>
      </div>`;
    grid.appendChild(div);
  }
}

// ── Ticker ────────────────────────────────────────────────────────────────
function buildTicker() {
  const el = document.getElementById('footer-ticker');
  const text = [...TICKER_LINES, ...TICKER_LINES].join('   \u00b7   ');
  const track = document.createElement('span');
  track.className = 'ticker-track';
  track.textContent = text;
  el.appendChild(track);
}

init();
