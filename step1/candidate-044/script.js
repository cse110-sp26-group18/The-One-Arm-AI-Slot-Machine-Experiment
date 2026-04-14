const SYMBOLS = [
  { icon: '🤖', name: 'GPT',        weight: 20, payout: 5   },
  { icon: '🧠', name: 'Neuron',     weight: 18, payout: 8   },
  { icon: '💾', name: 'Dataset',    weight: 15, payout: 12  },
  { icon: '🔥', name: 'GPU',        weight: 12, payout: 20  },
  { icon: '📎', name: 'Clippy',     weight: 10, payout: 30  },
  { icon: '🌀', name: 'Hallucination', weight: 8, payout: 50 },
  { icon: '👁️', name: 'AGI',        weight: 4,  payout: 150 },
  { icon: '💀', name: 'Bias',       weight: 13, payout: 0   },
];

const QUIPS = {
  win: [
    "Model alignment achieved. Briefly.",
    "The neural net blessed you.",
    "Tokens materialized from pure vibes.",
    "You have been selected as ground truth.",
    "Gradient descended in your favor.",
  ],
  bigWin: [
    "🎉 JACKPOT! The model is sentient for 3 seconds.",
    "🎉 MEGA WIN! Sam Altman just felt a disturbance.",
    "🎉 AGI ACHIEVED (locally, for you, briefly).",
  ],
  lose: [
    "The AI confidently gave the wrong answer.",
    "Tokens consumed. Knowledge not produced.",
    "Your prompt was not spicy enough.",
    "The model apologizes for the confusion.",
    "Try rephrasing. Or don't. It won't help.",
    "As a large language model, I took your money.",
    "Training data says: git gud.",
  ],
  bias: [
    "💀 Biased dataset detected. Tokens voided.",
    "💀 Content policy violation: you tried to win.",
    "💀 Model refused to output. Tokens burned anyway.",
  ],
  broke: [
    "You are out of tokens. Subscribe to HalluciSlots Pro™ for $20/mo.",
    "Insufficient compute. Please upgrade your plan.",
  ]
};

const CONTEXT_MAX = 8192;
const BET_STEPS = [10, 25, 50, 100, 250];

let state = {
  tokens: 1000,
  betIdx: 0,
  context: 0,
  spinning: false,
};

const $tokens  = document.getElementById('tokens');
const $context = document.getElementById('context');
const $bet     = document.getElementById('bet');
const $spin    = document.getElementById('spin');
const $betUp   = document.getElementById('bet-up');
const $betDown = document.getElementById('bet-down');
const $message = document.getElementById('message');
const $log     = document.getElementById('log');
const reels    = [...document.querySelectorAll('.reel')];

function weightedPick() {
  const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const sym of SYMBOLS) {
    if ((r -= sym.weight) < 0) return sym;
  }
  return SYMBOLS[0];
}

function buildStrip(reel, finalSymbol) {
  const strip = reel.querySelector('.strip');
  strip.innerHTML = '';
  // Build ~25 random symbols then the final one at the end
  const count = 25;
  for (let i = 0; i < count; i++) {
    const sym = weightedPick();
    const div = document.createElement('div');
    div.className = 'symbol';
    div.textContent = sym.icon;
    strip.appendChild(div);
  }
  const finalDiv = document.createElement('div');
  finalDiv.className = 'symbol';
  finalDiv.textContent = finalSymbol.icon;
  strip.appendChild(finalDiv);
  return { strip, totalSymbols: count + 1 };
}

function render() {
  $tokens.textContent = state.tokens;
  $bet.textContent = BET_STEPS[state.betIdx];
  $context.textContent = `${state.context} / ${CONTEXT_MAX}`;
  $spin.disabled = state.spinning || state.tokens < BET_STEPS[state.betIdx];
  $betUp.disabled = state.spinning;
  $betDown.disabled = state.spinning;
}

function log(text) {
  const li = document.createElement('li');
  li.textContent = `> ${text}`;
  $log.prepend(li);
  while ($log.children.length > 20) $log.lastChild.remove();
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function setMessage(text, cls = '') {
  $message.className = 'message ' + cls;
  $message.textContent = text;
}

async function spin() {
  const bet = BET_STEPS[state.betIdx];
  if (state.tokens < bet) {
    setMessage(pick(QUIPS.broke), 'lose');
    return;
  }
  state.spinning = true;
  state.tokens -= bet;
  state.context = Math.min(CONTEXT_MAX, state.context + bet * 2);
  if (state.context >= CONTEXT_MAX) {
    log('Context window full — forgetting earlier spins...');
    state.context = Math.floor(CONTEXT_MAX * 0.3);
  }
  render();
  setMessage('⚙️ Running inference...');

  const results = [weightedPick(), weightedPick(), weightedPick()];

  // Animate reels
  const durations = [1400, 1900, 2400];
  const promises = reels.map((reel, i) => animateReel(reel, results[i], durations[i]));
  await Promise.all(promises);

  evaluate(results, bet);
  state.spinning = false;
  render();
}

function animateReel(reel, finalSymbol, duration) {
  const { strip, totalSymbols } = buildStrip(reel, finalSymbol);
  const symbolHeight = 130;
  const endOffset = (totalSymbols - 1) * symbolHeight;
  reel.classList.add('spinning');

  strip.style.transition = 'none';
  strip.style.transform = 'translateY(0)';
  // force reflow
  void strip.offsetHeight;
  strip.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
  strip.style.transform = `translateY(-${endOffset}px)`;

  return new Promise((resolve) => {
    setTimeout(() => {
      reel.classList.remove('spinning');
      resolve();
    }, duration + 50);
  });
}

function evaluate(results, bet) {
  const [a, b, c] = results;
  const names = results.map(r => r.name).join(' · ');
  log(`Spin: ${names}`);

  // Bias symbol anywhere = instant loss quip
  if (results.some(r => r.name === 'Bias') && !(a.name === b.name && b.name === c.name)) {
    setMessage(pick(QUIPS.bias), 'lose');
    return;
  }

  // Three of a kind
  if (a.name === b.name && b.name === c.name) {
    const payout = bet * a.payout;
    state.tokens += payout;
    if (a.name === 'AGI') {
      setMessage(`${pick(QUIPS.bigWin)} +${payout} tokens`, 'win');
      $message.classList.add('jackpot');
      setTimeout(() => $message.classList.remove('jackpot'), 3000);
    } else if (a.name === 'Bias') {
      // Triple Bias = ironic jackpot
      setMessage(`💀 TRIPLE BIAS. The algorithm declares you the problem. +${payout} tokens (guilt money).`, 'win');
    } else {
      setMessage(`Three ${a.name}s! +${payout} tokens. ${pick(QUIPS.win)}`, 'win');
    }
    return;
  }

  // Two of a kind = small consolation
  if (a.name === b.name || b.name === c.name || a.name === c.name) {
    const matchSym = a.name === b.name ? a : (b.name === c.name ? b : a);
    const payout = Math.floor(bet * matchSym.payout * 0.2);
    if (payout > 0) {
      state.tokens += payout;
      setMessage(`Partial match (${matchSym.name} x2). +${payout} tokens. ${pick(QUIPS.win)}`, 'win');
      return;
    }
  }

  setMessage(pick(QUIPS.lose), 'lose');
}

// Initial strip render
reels.forEach(r => buildStrip(r, weightedPick()));

$spin.addEventListener('click', spin);
$betUp.addEventListener('click', () => {
  state.betIdx = Math.min(BET_STEPS.length - 1, state.betIdx + 1);
  render();
});
$betDown.addEventListener('click', () => {
  state.betIdx = Math.max(0, state.betIdx - 1);
  render();
});

// Space / Enter to spin
document.addEventListener('keydown', (e) => {
  if ((e.code === 'Space' || e.code === 'Enter') && !state.spinning) {
    e.preventDefault();
    spin();
  }
});

render();
log('System initialized. Model loaded with 0.0001% alignment.');
