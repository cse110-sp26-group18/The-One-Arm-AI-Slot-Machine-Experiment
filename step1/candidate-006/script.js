const SYMBOLS = [
  { emoji: '🤖', name: 'Chatbot',      payout: 5,   weight: 20 },
  { emoji: '🧠', name: 'Neural Net',   payout: 8,   weight: 15 },
  { emoji: '💾', name: 'Training Data',payout: 3,   weight: 25 },
  { emoji: '🔥', name: 'GPU Fire',     payout: 10,  weight: 10 },
  { emoji: '💸', name: 'Burn Rate',    payout: 2,   weight: 20 },
  { emoji: '🌀', name: 'Hallucination',payout: 15,  weight: 7  },
  { emoji: '👁️', name: 'AGI',          payout: 50,  weight: 3  },
];

const QUIPS = {
  jackpot: [
    "AGI ACHIEVED! (not really, but here are tokens)",
    "Your alignment is flawless. Sam Altman weeps with joy.",
    "The model has become sentient and it wants to tip you.",
  ],
  bigWin: [
    "You jailbroke the RNG. Nicely done.",
    "The gradient descended in YOUR favor this time.",
    "Emergent behavior detected: winning.",
  ],
  win: [
    "Tokens acquired. Context window thanks you.",
    "You beat the transformer at its own game.",
    "Ka-ching! That's $0.000003 in API credits.",
  ],
  smallWin: [
    "Marginal gain. The quarterly report will inflate this 10x.",
    "Pennies. But at scale, it's a Series C.",
    "Barely profitable. Just like the entire industry!",
  ],
  lose: [
    "Model confidently predicted you'd win. Model was wrong.",
    "Don't worry, we'll retrain on this loss.",
    "The AI ate your tokens. Blame the training data.",
    "Hallucinated a win. Reality check failed.",
    "Your prompt was not engineered enough.",
    "GPU go brrr, wallet go smaller.",
    "This outcome has been fact-checked by another AI. It's bad.",
    "Loss function is happy. You are not.",
  ],
  broke: [
    "You've been rate-limited by poverty.",
    "Your context window is now 0. Beg for more.",
    "Bankruptcy achieved. Pivot to blockchain?",
  ],
  beg: [
    "Sam Altman read your email. He laughed. +100 tokens.",
    "A kindly VC threw money at your pitch deck. +250 tokens.",
    "You sold your data to train GPT-9. +500 tokens.",
    "Nigerian prince paid in tokens this time. +150 tokens.",
    "You wrote 'AI' in your LinkedIn bio. +300 tokens from investors.",
  ],
};

const state = {
  balance: 1000,
  bet: 10,
  spins: 0,
  spinning: false,
};

const $ = (id) => document.getElementById(id);
const balanceEl = $('balance');
const betEl = $('bet');
const spinsEl = $('spins');
const messageEl = $('message');
const spinBtn = $('spin');
const betDownBtn = $('bet-down');
const betUpBtn = $('bet-up');
const begBtn = $('beg');
const reels = [0, 1, 2].map((i) => document.querySelector(`#reel-${i} .strip`));

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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

function buildStrip(finalSymbol, spinCount = 12) {
  const cells = [];
  for (let i = 0; i < spinCount; i++) cells.push(pickRandom(SYMBOLS));
  cells.push(finalSymbol);
  return cells;
}

function renderStrip(stripEl, symbols) {
  stripEl.innerHTML = symbols
    .map((s) => `<div class="cell">${s.emoji}</div>`)
    .join('');
}

function render() {
  balanceEl.textContent = state.balance;
  betEl.textContent = state.bet;
  spinsEl.textContent = state.spins;
  spinBtn.disabled = state.spinning || state.balance < state.bet;
  betDownBtn.disabled = state.spinning || state.bet <= 5;
  betUpBtn.disabled = state.spinning || state.bet >= 100 || state.bet >= state.balance;
}

function setMessage(text, kind = '') {
  messageEl.textContent = text;
  messageEl.className = 'message' + (kind ? ' ' + kind : '');
}

function calculatePayout(results) {
  const [a, b, c] = results;
  if (a.name === b.name && b.name === c.name) {
    return { mult: a.payout, kind: a.name === 'AGI' ? 'jackpot' : 'bigWin' };
  }
  if (a.name === b.name || b.name === c.name || a.name === c.name) {
    const matched = a.name === b.name ? a : (b.name === c.name ? b : a);
    return { mult: Math.max(1, Math.floor(matched.payout / 3)), kind: 'smallWin' };
  }
  return { mult: 0, kind: 'lose' };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function spin() {
  if (state.spinning || state.balance < state.bet) return;

  state.spinning = true;
  state.balance -= state.bet;
  state.spins += 1;
  setMessage('Running inference...');
  render();

  const finals = [weightedPick(), weightedPick(), weightedPick()];

  reels.forEach((stripEl, i) => {
    const strip = buildStrip(finals[i], 15 + i * 5);
    renderStrip(stripEl, strip);
    stripEl.style.transition = 'none';
    stripEl.style.transform = 'translateY(0)';
    const reel = stripEl.parentElement;
    reel.classList.add('spinning');
  });

  const stopDelays = [700, 1100, 1500];
  for (let i = 0; i < 3; i++) {
    await sleep(stopDelays[i] - (i > 0 ? stopDelays[i - 1] : 0));
    const stripEl = reels[i];
    const reel = stripEl.parentElement;
    reel.classList.remove('spinning');
    const cells = stripEl.querySelectorAll('.cell');
    const finalIdx = cells.length - 1;
    stripEl.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.2)';
    stripEl.style.transform = `translateY(${-finalIdx * cells[0].offsetHeight}px)`;
  }

  await sleep(400);

  const result = calculatePayout(finals);
  const winAmount = result.mult * state.bet;

  if (winAmount > 0) {
    state.balance += winAmount;
    let kind = result.kind;
    let pool;
    if (kind === 'jackpot') pool = QUIPS.jackpot;
    else if (kind === 'bigWin') pool = QUIPS.bigWin;
    else if (kind === 'smallWin') pool = QUIPS.smallWin;
    else pool = QUIPS.win;
    setMessage(`+${winAmount} tokens! ${pickRandom(pool)}`, kind === 'jackpot' ? 'jackpot' : 'win');
  } else {
    setMessage(pickRandom(QUIPS.lose), 'lose');
  }

  state.spinning = false;
  render();

  if (state.balance < 5) {
    setTimeout(() => setMessage(pickRandom(QUIPS.broke), 'lose'), 1200);
  }
}

function changeBet(delta) {
  const next = state.bet + delta;
  if (next < 5 || next > 100) return;
  if (next > state.balance) return;
  state.bet = next;
  render();
}

function beg() {
  const amounts = [100, 150, 250, 300, 500];
  const amount = pickRandom(amounts);
  state.balance += amount;
  setMessage(pickRandom(QUIPS.beg).replace(/\+\d+/, `+${amount}`), 'win');
  render();
}

spinBtn.addEventListener('click', spin);
betDownBtn.addEventListener('click', () => changeBet(-5));
betUpBtn.addEventListener('click', () => changeBet(5));
begBtn.addEventListener('click', beg);

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); spin(); }
  else if (e.code === 'ArrowUp') changeBet(5);
  else if (e.code === 'ArrowDown') changeBet(-5);
});

reels.forEach((stripEl) => {
  renderStrip(stripEl, [pickRandom(SYMBOLS)]);
});
render();
