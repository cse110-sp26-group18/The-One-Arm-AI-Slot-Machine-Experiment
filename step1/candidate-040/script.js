const SYMBOLS = [
  { icon: '🤖', name: 'GPT',         weight: 6,  payout: 5  },
  { icon: '🧠', name: 'Neural Net',   weight: 5,  payout: 8  },
  { icon: '💭', name: 'Hallucination',weight: 8,  payout: 3  },
  { icon: '📝', name: 'Prompt',       weight: 7,  payout: 4  },
  { icon: '⚠️', name: 'Bias',         weight: 4,  payout: 10 },
  { icon: '🔥', name: 'GPU Fire',     weight: 3,  payout: 20 },
  { icon: '💎', name: 'Jackpot',      weight: 1,  payout: 100 },
];

const WIN_MESSAGES = {
  '🤖': "Three GPTs walk into a bar. You win {amt} tokens. The bar is now sentient.",
  '🧠': "Your neural net converged! +{amt} tokens. Loss function weeping with joy.",
  '💭': "You hallucinated a win! +{amt} tokens (citation needed).",
  '📝': "Prompt engineering paid off. +{amt} tokens. PhD pending.",
  '⚠️': "Your model is biased — toward winning! +{amt} tokens. Do not audit.",
  '🔥': "GPU cluster on fire 🔥 +{amt} tokens. H100s not included.",
  '💎': "JACKPOT! AGI ACHIEVED! +{amt} tokens. Please remain calm.",
};

const LOSE_MESSAGES = [
  "Model returned: 'As an AI, I cannot help you win.'",
  "Your tokens were consumed by a 37-line system prompt.",
  "OpenAI raised the price per token. Again.",
  "Token burned in training data. Gone forever.",
  "The RLHF reviewers rejected your bet.",
  "Out of memory. Your luck was offloaded to disk.",
  "Temperature too high. Output: unrelated poem about moss.",
  "The alignment team has put your winnings on hold.",
  "Rate limited. Try again after 17 minutes of breathing exercises.",
  "Your context window overflowed. Winnings truncated to 0.",
];

const NEAR_MISS_MESSAGES = [
  "Two out of three. Classic AI: confidently incomplete.",
  "So close — your prompt needed more 'please'.",
  "Almost! The model was 99.9% sure. It was wrong.",
];

const state = {
  tokens: 1000,
  spent: 0,
  bet: 10,
  spinning: false,
};

const BET_STEPS = [5, 10, 25, 50, 100, 250];

const weightedPool = SYMBOLS.flatMap(s => Array(s.weight).fill(s));
const stripLength = 30;

const els = {
  tokens: document.getElementById('tokens'),
  spent:  document.getElementById('spent'),
  bet:    document.getElementById('bet'),
  spin:   document.getElementById('spin'),
  betUp:  document.getElementById('bet-up'),
  betDown:document.getElementById('bet-down'),
  message:document.getElementById('message'),
  reels:  [0,1,2].map(i => document.querySelector(`#reel-${i} .strip`)),
  container: document.querySelector('.reels-container'),
};

function randomSymbol() {
  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
}

function buildStrip(finalSymbol) {
  const symbols = [];
  for (let i = 0; i < stripLength - 1; i++) symbols.push(randomSymbol());
  symbols.push(finalSymbol);
  return symbols;
}

function renderStrip(stripEl, symbols) {
  stripEl.innerHTML = '';
  for (const s of symbols) {
    const div = document.createElement('div');
    div.className = 'symbol';
    div.textContent = s.icon;
    stripEl.appendChild(div);
  }
}

function updateUI() {
  els.tokens.textContent = state.tokens.toLocaleString();
  els.spent.textContent  = state.spent.toLocaleString();
  els.bet.textContent    = state.bet;
  els.betUp.disabled   = state.spinning || BET_STEPS.indexOf(state.bet) >= BET_STEPS.length - 1;
  els.betDown.disabled = state.spinning || BET_STEPS.indexOf(state.bet) <= 0;
  els.spin.disabled    = state.spinning || state.tokens < state.bet;
  if (state.tokens < state.bet && !state.spinning) {
    els.spin.textContent = 'OUT OF TOKENS';
  } else {
    els.spin.textContent = 'PROMPT & PRAY';
  }
}

function setMessage(text, type = '') {
  els.message.textContent = text;
  els.message.className = 'message' + (type ? ' ' + type : '');
}

function spinReel(reelEl, finalSymbol, durationMs) {
  const symbols = buildStrip(finalSymbol);
  renderStrip(reelEl, symbols);
  const symbolHeight = 150;
  const targetY = -(symbols.length - 1) * symbolHeight;
  reelEl.style.transition = 'none';
  reelEl.style.transform = 'translateY(0px)';
  void reelEl.offsetHeight;
  reelEl.style.transition = `transform ${durationMs}ms cubic-bezier(0.22, 0.9, 0.27, 1)`;
  reelEl.style.transform = `translateY(${targetY}px)`;

  return new Promise(resolve => setTimeout(resolve, durationMs));
}

function evaluate(results) {
  const [a, b, c] = results;
  if (a.name === b.name && b.name === c.name) {
    const multiplier = a.name === 'Jackpot' ? a.payout : a.payout;
    const payout = state.bet * multiplier;
    const msg = WIN_MESSAGES[a.icon].replace('{amt}', payout.toLocaleString());
    return { payout, message: msg, type: a.name === 'Jackpot' ? 'jackpot' : 'win' };
  }
  if (a.name === b.name || b.name === c.name) {
    const msg = NEAR_MISS_MESSAGES[Math.floor(Math.random() * NEAR_MISS_MESSAGES.length)];
    return { payout: 0, message: msg, type: '' };
  }
  const msg = LOSE_MESSAGES[Math.floor(Math.random() * LOSE_MESSAGES.length)];
  return { payout: 0, message: msg, type: 'lose' };
}

async function spin() {
  if (state.spinning || state.tokens < state.bet) return;
  state.spinning = true;
  state.tokens -= state.bet;
  state.spent  += state.bet;
  setMessage('Inferencing…', '');
  updateUI();

  const results = [randomSymbol(), randomSymbol(), randomSymbol()];
  const durations = [1200, 1600, 2000];

  const spins = els.reels.map((el, i) => spinReel(el, results[i], durations[i]));
  await Promise.all(spins);

  const outcome = evaluate(results);
  if (outcome.payout > 0) {
    state.tokens += outcome.payout;
    els.container.classList.add('shaking');
    setTimeout(() => els.container.classList.remove('shaking'), 400);
  }
  setMessage(outcome.message, outcome.type);

  state.spinning = false;
  updateUI();

  if (state.tokens <= 0) {
    setTimeout(() => {
      setMessage("Bankrupt. The AI thanks you for your contribution to its training data.", 'lose');
    }, 800);
  }
}

function changeBet(delta) {
  const idx = BET_STEPS.indexOf(state.bet);
  const next = Math.max(0, Math.min(BET_STEPS.length - 1, idx + delta));
  state.bet = BET_STEPS[next];
  updateUI();
}

function init() {
  for (const reel of els.reels) {
    renderStrip(reel, [randomSymbol()]);
  }
  els.spin.addEventListener('click', spin);
  els.betUp.addEventListener('click', () => changeBet(+1));
  els.betDown.addEventListener('click', () => changeBet(-1));
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !state.spinning) {
      e.preventDefault();
      spin();
    }
  });
  updateUI();
}

init();
