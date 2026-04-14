const SYMBOLS = [
  { emoji: '🤖', name: 'Chatbot',     weight: 20 },
  { emoji: '🧠', name: 'Neural Net',  weight: 15 },
  { emoji: '📊', name: 'Benchmark',   weight: 15 },
  { emoji: '💸', name: 'Burn Rate',   weight: 18 },
  { emoji: '🔥', name: 'GPU Fire',    weight: 12 },
  { emoji: '📎', name: 'Paperclip',   weight: 8  },
  { emoji: '🌀', name: 'Hallucination', weight: 8 },
  { emoji: '💎', name: 'Singularity', weight: 4  },
];

const PAYOUTS = {
  '🤖': { mult: 3,   label: 'Three chatbots agree. Must be true.' },
  '🧠': { mult: 5,   label: 'Neural network consensus achieved.' },
  '📊': { mult: 4,   label: 'State-of-the-art on a benchmark no one uses.' },
  '💸': { mult: 2,   label: 'You spent more than you won. Classic.' },
  '🔥': { mult: 6,   label: 'Datacenter literally on fire. Bullish.' },
  '📎': { mult: 8,   label: 'Paperclip maximizer partial unlock.' },
  '🌀': { mult: 10,  label: 'The machine confidently lied to you. Jackpot.' },
  '💎': { mult: 50,  label: 'SINGULARITY. You are now obsolete. Congrats.' },
};

const TWO_OF_KIND_MULT = 0.5;

const QUIPS = {
  idle: [
    'Thinking deeply about nothing in particular...',
    'Fine-tuning on your wallet.',
    'Calculating 2 + 2. Please wait.',
    'Ready to confidently generate random results.',
    'Synergizing verticals via AI-powered paradigms.',
  ],
  spin: [
    'Querying the vector database of your regrets...',
    'Reticulating splines. And also your cash.',
    'Consulting 47 GPUs for this one spin.',
    'Prompting the latent space politely.',
    'Asking the model if it feels lucky today.',
  ],
  win: [
    'Aligned! Briefly.',
    'The model chose you. For now.',
    'Emergent winnings detected.',
    'This was definitely not in the training data.',
    'Payout: 90% confidence, 10% vibes.',
  ],
  bigWin: [
    'AGI ACHIEVED (for this spin only).',
    'JACKPOT! Investors informed. Valuation doubled.',
    'You broke the benchmark. Literally.',
    'Series F closed mid-spin. Congratulations.',
  ],
  lose: [
    'Model refused to answer. Tokens consumed anyway.',
    'Hallucinated a win. Balance disagrees.',
    'The attention heads were looking elsewhere.',
    'Loss function: you.',
    'Results inconclusive. Please subscribe to Pro.',
    'That was not a bug, it was a feature.',
  ],
  broke: [
    'Your compute has been revoked. Go touch grass.',
    'Insufficient tokens. Have you tried beginning a Series A?',
  ],
};

const MIN_BET = 10;
const MAX_BET = 500;
const BET_STEP = 10;
const STARTING_BALANCE = 1000;

const state = {
  balance: STARTING_BALANCE,
  bet: 50,
  spinning: false,
};

const el = {
  balance: document.getElementById('balance'),
  bet: document.getElementById('bet'),
  betUp: document.getElementById('bet-up'),
  betDown: document.getElementById('bet-down'),
  lastPayout: document.getElementById('last-payout'),
  spinBtn: document.getElementById('spin-btn'),
  spinCost: document.getElementById('spin-cost'),
  resetBtn: document.getElementById('reset-btn'),
  reels: Array.from(document.querySelectorAll('.reel')),
  ticker: document.getElementById('ticker-text'),
  paytableBody: document.getElementById('paytable-body'),
};

function buildWeightedPool() {
  const pool = [];
  for (const s of SYMBOLS) {
    for (let i = 0; i < s.weight; i++) pool.push(s.emoji);
  }
  return pool;
}
const POOL = buildWeightedPool();

function randomSymbol() {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function renderBalance(change = 0) {
  el.balance.textContent = state.balance;
  el.balance.classList.remove('balance-flash-up', 'balance-flash-down');
  void el.balance.offsetWidth;
  if (change > 0) el.balance.classList.add('balance-flash-up');
  else if (change < 0) el.balance.classList.add('balance-flash-down');
}

function renderBet() {
  el.bet.textContent = state.bet;
  el.spinCost.textContent = state.bet;
  el.betDown.disabled = state.bet <= MIN_BET || state.spinning;
  el.betUp.disabled = state.bet >= MAX_BET || state.spinning;
}

function updateSpinButton() {
  const canSpin = !state.spinning && state.balance >= state.bet;
  el.spinBtn.disabled = !canSpin;
  if (state.balance < state.bet && !state.spinning) {
    setTicker(pick(QUIPS.broke));
  }
}

function setTicker(text) { el.ticker.textContent = text; }

function renderPaytable() {
  const rows = Object.entries(PAYOUTS)
    .sort((a, b) => b[1].mult - a[1].mult)
    .map(([emoji, info]) => {
      return `<tr>
        <td>${emoji}${emoji}${emoji}</td>
        <td>${info.label}</td>
        <td>×${info.mult}</td>
      </tr>`;
    })
    .concat([`<tr>
        <td>✕✕</td>
        <td>Any two matching (participation trophy).</td>
        <td>×${TWO_OF_KIND_MULT}</td>
      </tr>`])
    .join('');
  el.paytableBody.innerHTML = rows;
}

function spin() {
  if (state.spinning) return;
  if (state.balance < state.bet) {
    setTicker(pick(QUIPS.broke));
    return;
  }

  state.spinning = true;
  state.balance -= state.bet;
  renderBalance(-state.bet);
  el.lastPayout.textContent = '0';
  setTicker(pick(QUIPS.spin));
  updateSpinButton();
  renderBet();

  el.reels.forEach(r => {
    r.classList.remove('win');
    r.classList.add('spinning');
  });

  const finalSymbols = [randomSymbol(), randomSymbol(), randomSymbol()];
  const stopDelays = [700, 1100, 1500];

  el.reels.forEach((reel, i) => {
    const strip = reel.querySelector('.reel-strip');
    const shuffler = setInterval(() => {
      strip.textContent = randomSymbol();
    }, 70);

    setTimeout(() => {
      clearInterval(shuffler);
      strip.textContent = finalSymbols[i];
      reel.classList.remove('spinning');
      if (i === el.reels.length - 1) {
        setTimeout(() => resolveSpin(finalSymbols), 200);
      }
    }, stopDelays[i]);
  });
}

function resolveSpin(symbols) {
  const [a, b, c] = symbols;
  let payout = 0;
  let message = '';
  let bigWin = false;

  if (a === b && b === c) {
    const info = PAYOUTS[a];
    payout = state.bet * info.mult;
    message = info.label;
    bigWin = info.mult >= 10;
    el.reels.forEach(r => r.classList.add('win'));
  } else if (a === b || b === c || a === c) {
    payout = Math.floor(state.bet * TWO_OF_KIND_MULT);
    const matched = a === b ? a : (b === c ? b : a);
    const reelIndices = a === b ? [0, 1] : (b === c ? [1, 2] : [0, 2]);
    reelIndices.forEach(i => el.reels[i].classList.add('win'));
    message = `Two ${matched}s. The model is 50% sure about this one.`;
  } else {
    message = pick(QUIPS.lose);
  }

  if (payout > 0) {
    state.balance += payout;
    el.lastPayout.textContent = `+${payout}`;
    renderBalance(payout);
    const flavor = bigWin ? pick(QUIPS.bigWin) : pick(QUIPS.win);
    setTicker(`${flavor} ${message}`);
  } else {
    setTicker(message);
  }

  state.spinning = false;
  updateSpinButton();
  renderBet();
}

el.spinBtn.addEventListener('click', spin);

el.betUp.addEventListener('click', () => {
  if (state.spinning) return;
  state.bet = Math.min(MAX_BET, state.bet + BET_STEP);
  renderBet();
  updateSpinButton();
});

el.betDown.addEventListener('click', () => {
  if (state.spinning) return;
  state.bet = Math.max(MIN_BET, state.bet - BET_STEP);
  renderBet();
  updateSpinButton();
});

el.resetBtn.addEventListener('click', () => {
  if (state.spinning) return;
  state.balance = STARTING_BALANCE;
  state.bet = 50;
  el.lastPayout.textContent = '0';
  renderBalance(1);
  renderBet();
  updateSpinButton();
  setTicker('A generous VC has graciously wired you more tokens. Burn responsibly.');
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !state.spinning) {
    e.preventDefault();
    spin();
  }
});

renderPaytable();
renderBalance();
renderBet();
updateSpinButton();
setTicker(pick(QUIPS.idle));
