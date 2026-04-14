'use strict';

// ── Symbol definitions ─────────────────────────────────────────────────────
const SYMBOLS = [
  {
    id: 'hallucinate',
    emoji: '🌀',
    label: 'Hallucination',
    quip: 'The model invented a citation',
    weight: 18,
    payouts: { 3: 0, 2: 0 },
  },
  {
    id: 'context',
    emoji: '📄',
    label: 'Context Window',
    quip: '4k tokens remaining',
    weight: 16,
    payouts: { 3: 2, 2: 0 },   // multiplier of bet
  },
  {
    id: 'gpu',
    emoji: '🖥️',
    label: 'GPU Cluster',
    quip: 'Renting compute by the nanosecond',
    weight: 14,
    payouts: { 3: 4, 2: 0.5 },
  },
  {
    id: 'prompt',
    emoji: '💬',
    label: 'System Prompt',
    quip: '"You are a helpful assistant…"',
    weight: 12,
    payouts: { 3: 5, 2: 0.75 },
  },
  {
    id: 'rlhf',
    emoji: '👍',
    label: 'RLHF Thumb',
    quip: 'Human rater approved (probably)',
    weight: 10,
    payouts: { 3: 7, 2: 1 },
  },
  {
    id: 'embedding',
    emoji: '🔢',
    label: 'Embedding Vector',
    quip: '1536 floats that mean "dog"',
    weight: 9,
    payouts: { 3: 8, 2: 1 },
  },
  {
    id: 'rag',
    emoji: '🗃️',
    label: 'RAG Retrieval',
    quip: 'Retrieved the wrong document',
    weight: 8,
    payouts: { 3: 10, 2: 1.5 },
  },
  {
    id: 'token',
    emoji: '🪙',
    label: 'Token',
    quip: 'One unit of model currency',
    weight: 7,
    payouts: { 3: 12, 2: 2 },
  },
  {
    id: 'finetune',
    emoji: '🎛️',
    label: 'Fine-tune Run',
    quip: 'Overfit on 200 examples',
    weight: 6,
    payouts: { 3: 15, 2: 2.5 },
  },
  {
    id: 'attention',
    emoji: '👁️',
    label: 'Attention Head',
    quip: 'Attending to every token equally (oops)',
    weight: 5,
    payouts: { 3: 20, 2: 3 },
  },
  {
    id: 'datacentre',
    emoji: '🏭',
    label: 'Data Centre',
    quip: 'Cooling bill exceeds GDP of small nation',
    weight: 4,
    payouts: { 3: 25, 2: 4 },
  },
  {
    id: 'agi',
    emoji: '🤖',
    label: 'AGI (supposedly)',
    quip: '"This time we mean it"',
    weight: 2,
    payouts: { 3: 50, 2: 8 },
  },
  {
    id: 'jackpot',
    emoji: '💎',
    label: 'Alignment Solved',
    quip: 'JK — researchers still arguing on Twitter',
    weight: 1,
    payouts: { 3: 200, 2: 20 },
  },
];

// Build weighted pool
const POOL = [];
for (const sym of SYMBOLS) {
  for (let i = 0; i < sym.weight; i++) POOL.push(sym);
}

// ── Ticker messages ────────────────────────────────────────────────────────
const TICKER_MSGS = [
  'BREAKING: AI claims sentience — admits it was just predicting the next token',
  'TOKEN PRICES UP 300% — analysts baffled',
  'NEW MODEL: same vibes, more parameters',
  'HALLUCINATION RATE: "within acceptable limits" says company',
  'CONTEXT WINDOW EXTENDED to 1M tokens — still forgets your name',
  'PROMPT INJECTION vulnerability discovered in your thoughts',
  'RAG pipeline retrieved cat memes instead of documentation',
  'ALIGNMENT RESEARCHERS reach consensus — consensus immediately disputed',
  'GPT-NEXT benchmarks: superhuman on everything except common sense',
  '"We are six months from AGI" — same researcher, every year since 2017',
  'EMBEDDINGS COMPANY raises Series C — product: matrix multiplication',
  'FINE-TUNE your way to mediocrity — $0.008/token',
  'OPEN SOURCE MODEL released — weights 400 GB, vibes priceless',
  'RESPONSIBLE AI framework updated — still no refunds',
  'SAFETY TEAM says model is safe — model immediately disagrees',
];

// ── Quips on loss ──────────────────────────────────────────────────────────
const LOSS_QUIPS = [
  'The model confidently got it wrong.',
  'Your tokens have been tokenized.',
  'Inference complete. Outcome: suboptimal.',
  'Training loss: minimal. Gambling loss: maximal.',
  'The temperature was set too high.',
  'A hallucination consumed your tokens.',
  'Compute expended. Value: negligible.',
  'Gradient descent into your wallet.',
  'The attention mechanism ignored your bet.',
  'Overfitted to losing. Classic.',
  'Context: you lost. Window: closing.',
  '"This outcome was unexpected." — the model',
];

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  balance: 1000,
  netGain: 0,
  spins: 0,
  bet: 50,
  spinning: false,
};

// ── DOM refs ───────────────────────────────────────────────────────────────
const $balance    = document.getElementById('balance');
const $netGain    = document.getElementById('net-gain');
const $spins      = document.getElementById('spins');
const $spinBtn    = document.getElementById('spin-btn');
const $betDisplay = document.getElementById('bet-display');
const $resultPanel = document.getElementById('result-panel');
const $resultText  = document.getElementById('result-text');
const $resultTokens = document.getElementById('result-tokens');
const $tickerInner  = document.getElementById('ticker-inner');
const $paytableGrid = document.getElementById('paytable-grid');

const strips = [
  document.getElementById('strip-0'),
  document.getElementById('strip-1'),
  document.getElementById('strip-2'),
];

// ── Init ───────────────────────────────────────────────────────────────────
function init() {
  buildPaytable();
  buildTicker();
  initReels();
  bindBetButtons();
  $spinBtn.addEventListener('click', onSpin);
  updateUI();
}

function buildPaytable() {
  // Only show symbols with a 3-match payout for brevity
  const rows = SYMBOLS.filter(s => s.payouts[3] > 0)
    .sort((a, b) => b.payouts[3] - a.payouts[3]);

  for (const sym of rows) {
    const div = document.createElement('div');
    div.className = 'pt-row';
    div.innerHTML = `
      <span class="pt-emoji">${sym.emoji}${sym.emoji}${sym.emoji}</span>
      <div class="pt-info">
        <span class="pt-name">${sym.label}</span>
        <span class="pt-payout">×${sym.payouts[3]} bet &nbsp;|&nbsp; 2-match ×${sym.payouts[2]}</span>
      </div>`;
    $paytableGrid.appendChild(div);
  }
}

function buildTicker() {
  // Duplicate for seamless loop
  const msgs = [...TICKER_MSGS, ...TICKER_MSGS];
  $tickerInner.textContent = msgs.join('   ·   ');
}

// ── Reel setup ─────────────────────────────────────────────────────────────
const VISIBLE_CELLS = 1;   // how many cells are visible
const PAD_CELLS     = 20;  // extra cells for spin illusion

function buildStrip(strip) {
  strip.innerHTML = '';
  // Pad with random symbols so the reel appears to spin through many items
  const total = PAD_CELLS + VISIBLE_CELLS;
  for (let i = 0; i < total; i++) {
    strip.appendChild(makeCell(randomSymbol()));
  }
}

function makeCell(sym) {
  const div = document.createElement('div');
  div.className = 'reel-cell';
  div.dataset.id = sym.id;
  div.innerHTML = `
    <span>${sym.emoji}</span>
    <span class="symbol-label">${sym.label}</span>`;
  return div;
}

function initReels() {
  for (const strip of strips) buildStrip(strip);
  positionStrips(0); // show first cell
}

function positionStrips(cellIndex) {
  for (const strip of strips) {
    strip.style.transition = 'none';
    strip.style.top = `${-cellIndex * 130}px`;
  }
}

function randomSymbol() {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

// ── Bet buttons ────────────────────────────────────────────────────────────
function bindBetButtons() {
  document.querySelectorAll('.bet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.spinning) return;
      document.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.bet = parseInt(btn.dataset.bet, 10);
      $betDisplay.textContent = state.bet;
    });
  });
}

// ── Spin logic ─────────────────────────────────────────────────────────────
function onSpin() {
  if (state.spinning) return;
  if (state.balance < state.bet) {
    showResult('⚠ INSUFFICIENT TOKENS', 'Not even enough to hallucinate with.', null);
    return;
  }

  state.spinning = true;
  state.balance -= state.bet;
  state.spins++;
  $spinBtn.disabled = true;
  clearResult();
  updateUI();

  // Pick outcomes
  const results = [randomSymbol(), randomSymbol(), randomSymbol()];

  // Rebuild strips with outcome as the landing cell
  const SPIN_CELLS = 14; // how many cells to spin through
  for (let r = 0; r < 3; r++) {
    const strip = strips[r];
    strip.innerHTML = '';
    // Fill spin cells with random symbols
    for (let i = 0; i < SPIN_CELLS; i++) {
      strip.appendChild(makeCell(randomSymbol()));
    }
    // Final cell is the outcome
    strip.appendChild(makeCell(results[r]));
    // Reset position to top with no transition
    strip.style.transition = 'none';
    strip.style.top = '0px';
    strip.offsetHeight; // force reflow
  }

  // Stagger reel stops: reel 0 stops first, then 1, then 2
  const BASE_MS  = 400;
  const STAGGER  = 280;

  for (let r = 0; r < 3; r++) {
    const delay = r * STAGGER;
    const ms    = BASE_MS + delay;
    const strip = strips[r];

    setTimeout(() => {
      strip.style.transition = `top ${ms}ms cubic-bezier(0.17, 0.67, 0.35, 1.0)`;
      strip.style.top = `${-SPIN_CELLS * 130}px`;
    }, delay);
  }

  // Evaluate after all reels stop
  const totalMs = BASE_MS + (STAGGER * 2) + 80;
  setTimeout(() => {
    evaluateResult(results);
    state.spinning = false;
    $spinBtn.disabled = false;
    updateUI();
  }, totalMs);
}

function evaluateResult(results) {
  const ids = results.map(s => s.id);
  const [a, b, c] = ids;

  let multiplier = 0;
  let matchCount = 0;
  let matchSym   = null;

  if (a === b && b === c) {
    matchCount = 3;
    matchSym   = results[0];
    multiplier = matchSym.payouts[3];
  } else if (a === b || b === c || a === c) {
    matchCount = 2;
    // find the duplicated symbol
    if (a === b) matchSym = results[0];
    else if (b === c) matchSym = results[1];
    else matchSym = results[0];
    multiplier = matchSym.payouts[2];
  }

  const winAmount = Math.round(state.bet * multiplier);
  state.balance += winAmount;
  state.netGain += winAmount - state.bet;

  if (matchCount === 3 && multiplier >= 50) {
    showBigWin(matchSym, winAmount);
  } else if (winAmount > 0) {
    const label = matchCount === 3 ? '3× MATCH' : '2× MATCH';
    showResult(
      `${label} — ${matchSym.label}`,
      matchSym.quip,
      winAmount
    );
    $resultPanel.classList.add('win-flash');
    setTimeout(() => $resultPanel.classList.remove('win-flash'), 1500);
  } else {
    const quip = LOSS_QUIPS[Math.floor(Math.random() * LOSS_QUIPS.length)];
    showResult('NO MATCH', quip, -state.bet);
  }
}

// ── Result display ─────────────────────────────────────────────────────────
function showResult(heading, sub, tokens) {
  $resultText.textContent = `${heading}${sub ? ' — ' + sub : ''}`;
  if (tokens !== null) {
    const sign = tokens > 0 ? '+' : '';
    $resultTokens.textContent = `${sign}${tokens} tokens`;
    $resultTokens.className = 'result-tokens ' + (tokens > 0 ? 'win' : 'lose');
  } else {
    $resultTokens.textContent = '';
    $resultTokens.className = 'result-tokens';
  }
}

function clearResult() {
  $resultText.textContent = '';
  $resultTokens.textContent = '';
  $resultTokens.className = 'result-tokens';
}

function showBigWin(sym, amount) {
  const overlay = document.createElement('div');
  overlay.className = 'big-win-overlay';
  overlay.innerHTML = `
    <div class="big-win-box">
      <span class="big-win-emoji">${sym.emoji}</span>
      <div class="big-win-title">JACKPOT!</div>
      <div class="big-win-msg">${sym.label}<br><em>${sym.quip}</em></div>
      <div class="big-win-tokens">+${amount} tokens</div>
      <div class="big-win-dismiss">CLICK ANYWHERE TO DISMISS</div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', () => overlay.remove());

  // Also update the result panel underneath
  showResult(`JACKPOT — ${sym.label}`, sym.quip, amount);
  $resultPanel.classList.add('win-flash');
  setTimeout(() => $resultPanel.classList.remove('win-flash'), 1500);
}

// ── UI update ──────────────────────────────────────────────────────────────
function updateUI() {
  $balance.textContent = state.balance.toLocaleString();
  $spins.textContent   = state.spins.toLocaleString();

  const ng = state.netGain;
  $netGain.textContent = (ng >= 0 ? '+' : '') + ng.toLocaleString();
  $netGain.style.color = ng >= 0 ? 'var(--green)' : 'var(--red)';

  // Disable spin if broke
  if (!state.spinning) {
    $spinBtn.disabled = state.balance < state.bet;
  }
}

init();
