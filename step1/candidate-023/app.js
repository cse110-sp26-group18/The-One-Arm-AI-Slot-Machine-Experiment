// ════════════════════════════════════════════════════
//  The One-Arm AI — a slot machine that's very sorry
//  about its training data
// ════════════════════════════════════════════════════

const SYMBOLS = [
  { icon: '🧠', name: 'Brain',       weight: 18, mult: 3,   quip: 'A synthetic thought appears.' },
  { icon: '🤖', name: 'Bot',         weight: 16, mult: 5,   quip: 'Beep boop. Tokens acquired.' },
  { icon: '💾', name: 'Dataset',     weight: 14, mult: 8,   quip: 'Scraped ethically*. (*no)' },
  { icon: '⚡', name: 'GPU',         weight: 10, mult: 15,  quip: 'H100s go brrr.' },
  { icon: '🔑', name: 'API Key',     weight: 8,  mult: 25,  quip: 'Leaked in public repo. On purpose.' },
  { icon: '💎', name: 'Token',       weight: 6,  mult: 50,  quip: 'Rare alignment achieved.' },
  { icon: '👁️', name: 'Hallucinate', weight: 12, mult: 0,   quip: 'Confidently wrong. That\'ll be $20.' },
  { icon: '🚫', name: 'Refusal',     weight: 10, mult: 0,   quip: '"As a language model, I cannot..."' },
  { icon: '🌀', name: 'Loop',        weight: 6,  mult: 10,  quip: 'Stuck in recursion. Sending help.' },
];

const JACKPOT_MULT = 500;
const NEAR_MISS_QUIPS = [
  'So close. The model feels nothing.',
  '99% confidence. 0% reward.',
  'Training loss went up. Yikes.',
  'Your bet has been deprecated.',
];
const LOSS_QUIPS = [
  'Tokens fed to the algorithm. Forever.',
  'GPU go brrr, wallet go smaller.',
  'That counts as "fine-tuning" now.',
  'The model has learned nothing. Same.',
  'Have you tried prompting it better?',
  'Error 402: Payment required. Again.',
  'Added to the training set. Sorry.',
];
const WIN_QUIPS = [
  'ALIGNMENT ACHIEVED.',
  'RLHF APPROVES.',
  'EMERGENT BEHAVIOR DETECTED.',
  'BENCHMARK SMASHED (on the test set).',
  'OPEN WEIGHTS ENERGY.',
];
const JACKPOT_QUIPS = [
  '⚡ SUPERALIGNMENT JACKPOT ⚡',
  '⚡ AGI UNLOCKED (probably) ⚡',
  '⚡ MODEL COLLAPSE? IN THIS ECONOMY? ⚡',
];

// ═══ State ═══
const state = {
  balance: 1000,
  bet: 10,
  minBet: 5,
  maxBet: 200,
  spinning: false,
};

// ═══ DOM ═══
const $ = (id) => document.getElementById(id);
const balanceEl = $('balance');
const contextEl = $('context');
const betEl = $('bet');
const spinBtn = $('spin');
const statusEl = $('status-line');
const toastEl = $('toast');
const reelEls = Array.from(document.querySelectorAll('.reel'));
const stripEls = reelEls.map(r => r.querySelector('.strip'));

// ═══ Init ═══
function init() {
  loadState();
  buildPaytable();
  renderReels(['🤖', '🧠', '💎']);
  renderWallet();
  attachEvents();
  updateSpinButton();
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('onearm-ai-state') || '{}');
    if (typeof saved.balance === 'number') state.balance = saved.balance;
    if (typeof saved.bet === 'number') state.bet = saved.bet;
  } catch (_) { /* shrug */ }
}

function saveState() {
  localStorage.setItem('onearm-ai-state', JSON.stringify({
    balance: state.balance, bet: state.bet,
  }));
}

function buildPaytable() {
  const list = $('paytable-list');
  const sorted = [...SYMBOLS].sort((a, b) => b.mult - a.mult);
  for (const s of sorted) {
    const li = document.createElement('li');
    const payout = s.mult > 0 ? `×${s.mult}` : 'BUST';
    li.innerHTML = `
      <span class="sym">${s.icon}${s.icon}${s.icon}</span>
      <span class="name">${s.name}</span>
      <span class="mult">${payout}</span>
    `;
    list.appendChild(li);
  }
  const jackpot = document.createElement('li');
  jackpot.innerHTML = `
    <span class="sym">💎💎💎</span>
    <span class="name">SUPERALIGNMENT</span>
    <span class="mult">×${JACKPOT_MULT}</span>
  `;
  jackpot.style.background = 'rgba(255, 207, 77, 0.12)';
  list.insertBefore(jackpot, list.firstChild);
}

function renderReels(symbols) {
  stripEls.forEach((strip, i) => {
    const icon = symbols[i] || '🤖';
    strip.innerHTML = `
      <div class="cell">${randIcon()}</div>
      <div class="cell">${icon}</div>
      <div class="cell">${randIcon()}</div>
    `;
  });
}

function randIcon() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].icon;
}

function weightedPick() {
  const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return SYMBOLS[0];
}

function renderWallet() {
  balanceEl.textContent = state.balance.toLocaleString();
  betEl.textContent = state.bet.toLocaleString();
  const ctxK = Math.max(1, Math.floor(state.balance / 128));
  contextEl.textContent = ctxK + 'k';
}

function updateSpinButton() {
  spinBtn.disabled = state.spinning || state.balance < state.bet;
  if (state.balance < state.bet && !state.spinning) {
    statusEl.textContent = 'Out of tokens. The model suggests a credit card.';
  }
}

// ═══ Events ═══
function attachEvents() {
  spinBtn.addEventListener('click', spin);
  $('bet-up').addEventListener('click', () => changeBet(+5));
  $('bet-down').addEventListener('click', () => changeBet(-5));
  $('max-bet').addEventListener('click', () => {
    state.bet = Math.min(state.maxBet, state.balance);
    if (state.bet < state.minBet) state.bet = state.minBet;
    renderWallet();
    updateSpinButton();
  });
  $('reset').addEventListener('click', () => {
    if (confirm('Reset balance to 1000 tokens? (The model will remember. It always remembers.)')) {
      state.balance = 1000;
      state.bet = 10;
      saveState();
      renderWallet();
      updateSpinButton();
      statusEl.textContent = 'Weights randomized. Fresh start.';
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !spinBtn.disabled) {
      e.preventDefault();
      spin();
    }
  });
}

function changeBet(delta) {
  if (state.spinning) return;
  let next = state.bet + delta;
  if (next < state.minBet) next = state.minBet;
  if (next > state.maxBet) next = state.maxBet;
  if (next > state.balance) next = Math.max(state.minBet, state.balance);
  state.bet = next;
  renderWallet();
  updateSpinButton();
}

// ═══ Spin ═══
async function spin() {
  if (state.spinning || state.balance < state.bet) return;

  state.spinning = true;
  state.balance -= state.bet;
  renderWallet();
  updateSpinButton();
  statusEl.textContent = 'Running inference...';

  const result = [weightedPick(), weightedPick(), weightedPick()];

  // Clear any previous win highlights
  reelEls.forEach(r => r.classList.remove('win'));

  const stopDelays = [700, 1000, 1350];
  const spinners = reelEls.map((reel, i) => spinReel(i, result[i].icon, stopDelays[i]));
  await Promise.all(spinners);

  evaluateResult(result);

  state.spinning = false;
  saveState();
  updateSpinButton();
}

function spinReel(index, finalIcon, duration) {
  return new Promise((resolve) => {
    const strip = stripEls[index];
    const start = performance.now();
    let lastTick = 0;

    function frame(now) {
      const elapsed = now - start;
      if (now - lastTick > 60) {
        strip.innerHTML = `
          <div class="cell">${randIcon()}</div>
          <div class="cell">${randIcon()}</div>
          <div class="cell">${randIcon()}</div>
        `;
        lastTick = now;
      }
      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        strip.innerHTML = `
          <div class="cell">${randIcon()}</div>
          <div class="cell">${finalIcon}</div>
          <div class="cell">${randIcon()}</div>
        `;
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

// ═══ Scoring ═══
function evaluateResult(result) {
  const [a, b, c] = result;
  let winnings = 0;
  let mode = 'loss';
  let message = '';

  if (a.icon === b.icon && b.icon === c.icon) {
    if (a.icon === '💎') {
      winnings = state.bet * JACKPOT_MULT;
      mode = 'jackpot';
      message = pick(JACKPOT_QUIPS);
    } else if (a.mult > 0) {
      winnings = state.bet * a.mult;
      mode = 'win';
      message = `${pick(WIN_QUIPS)} (${a.name} ×${a.mult})`;
    } else {
      mode = 'bust';
      message = `Triple ${a.name}! ${a.quip} No payout though — it\'s a feature.`;
    }
  } else if (a.icon === b.icon || b.icon === c.icon || a.icon === c.icon) {
    // Two of a kind → small consolation for paying symbols
    const matchIcon = a.icon === b.icon ? a : (b.icon === c.icon ? b : a);
    if (matchIcon.mult > 0) {
      winnings = Math.floor(state.bet * matchIcon.mult * 0.25);
      if (winnings > 0) {
        mode = 'smallwin';
        message = `Double ${matchIcon.name}. Partial credit — you\'re learning.`;
      } else {
        message = pick(NEAR_MISS_QUIPS);
      }
    } else {
      message = pick(NEAR_MISS_QUIPS);
    }
  } else {
    message = pick(LOSS_QUIPS);
  }

  if (winnings > 0) {
    state.balance += winnings;
    message += ` +${winnings.toLocaleString()} tokens.`;
    highlightWinningReels(result);
    showToast(mode === 'jackpot'
      ? `💎 JACKPOT! +${winnings.toLocaleString()} 💎`
      : `+${winnings.toLocaleString()} tokens`);
  } else {
    document.querySelector('.machine').classList.add('shake');
    setTimeout(() => document.querySelector('.machine').classList.remove('shake'), 600);
  }

  statusEl.textContent = message;
  statusEl.style.color =
    mode === 'jackpot' ? 'var(--gold)' :
    mode === 'win' || mode === 'smallwin' ? 'var(--neon-green)' :
    'var(--neon-pink)';

  renderWallet();
}

function highlightWinningReels(result) {
  // Reels matching any winning pair/triple
  const counts = {};
  result.forEach(s => counts[s.icon] = (counts[s.icon] || 0) + 1);
  result.forEach((s, i) => {
    if (counts[s.icon] >= 2 && s.mult > 0) {
      reelEls[i].classList.add('win');
    }
  });
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2400);
}

// ═══ Go ═══
init();
