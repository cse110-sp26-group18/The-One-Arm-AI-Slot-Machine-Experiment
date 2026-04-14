/* ===== Slot Machine: The One-Arm AI ===== */
(function () {
  'use strict';

  /* ---------- Symbols & Payouts ---------- */
  const SYMBOLS = ['🤖', '🧠', '🔥', '☁️', '📊', '⚡', '🐛'];
  const WEIGHTS = [2, 4, 5, 6, 8, 10, 12]; // lower = rarer

  const PAYOUTS = {
    '🤖': 50,
    '🧠': 25,
    '🔥': 20,
    '☁️': 15,
    '📊': 10,
    '⚡': 8,
    '🐛': 5,
  };

  const PAIR_MULT = 2;

  /* ---------- AI Messages ---------- */
  const MSG_IDLE = [
    "As a slot machine, I'm happy to take your tokens...",
    "I've been trained on millions of losing spins.",
    "My neural network predicts you'll lose. Spin anyway?",
    "I hallucinated that you're about to win big.",
    "Prompt: 'Give me all your tokens.' Response: *spins*",
    "The house always wins. I am the house. I am AI.",
    "Fun fact: I have a 100% confidence score that you should spin again.",
    "WARNING: This machine may produce hallucinated wins.",
  ];

  const MSG_WIN = [
    "Wait... you won? That wasn't in my training data.",
    "Congratulations! I'm now recalibrating my bias against you.",
    "ERROR 200: User somehow won. Investigating...",
    "My loss function is experiencing actual loss right now.",
    "This outcome was predicted with 0.01% confidence.",
    "I'll add this to my training data so it never happens again.",
    "You got lucky. My reinforcement learning will fix that.",
    "Achievement unlocked: Beat a machine that can't think.",
  ];

  const MSG_LOSE = [
    "As expected. My model is very accurate.",
    "Thank you for your generous donation to Big AI.",
    "Your tokens have been redistributed to my GPU cluster.",
    "I appreciate your contribution to my next training run.",
    "Another successful prediction. I'm very intelligent.",
    "Skill issue. Have you tried prompt engineering the lever?",
    "Your tokens are in a better place now. My place.",
    "This is what peak AI performance looks like.",
    "I was trained specifically for this outcome.",
    "Don't worry, I'll remember this loss forever. In my weights.",
  ];

  const MSG_JACKPOT = [
    "IMPOSSIBLE. I'm filing a bug report on reality.",
    "THE SINGULARITY IS HERE... and it's paying out!?",
    "My entire existence was a lie. You actually won the jackpot.",
    "ALERT: Anomaly detected. Shutting down... just kidding, spin again.",
  ];

  const MSG_BROKE = [
    "Insufficient tokens. Even AI can't generate tokens from nothing.",
    "Your balance is giving 'empty GPU cluster' energy.",
    "ERROR: tokens.length === 0. Have you tried turning your wallet on and off?",
    "Broke already? My predictive model saw this coming 50 spins ago.",
  ];

  /* ---------- State ---------- */
  let tokens = 100;
  let bet = 10;
  let spinning = false;
  let totalSpins = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let netTokens = 0;
  const BET_STEPS = [5, 10, 25, 50, 100];

  /* ---------- DOM ---------- */
  const $ = (sel) => document.querySelector(sel);
  const tokenCountEl = $('#token-count');
  const betAmountEl = $('#bet-amount');
  const spinBtn = $('#spin-btn');
  const leverArm = $('#lever-arm');
  const leverWrapper = $('#lever-wrapper');
  const aiMessageEl = $('#ai-message');
  const aiBox = $('.ai-message-box');
  const historyList = $('#history-list');
  const historyToggle = $('#history-toggle');
  const historyBody = $('#history-body');
  const historyArrow = $('#history-arrow');
  const modalBackdrop = $('#modal-backdrop');
  const addTokensBtn = $('#add-tokens-btn');
  const modalClose = $('#modal-close');
  const customInput = $('#custom-token-input');
  const customAddBtn = $('#custom-add-btn');

  const reelEls = [
    { reel: $('#reel-0'), strip: $('#reel-0 .reel-strip') },
    { reel: $('#reel-1'), strip: $('#reel-1 .reel-strip') },
    { reel: $('#reel-2'), strip: $('#reel-2 .reel-strip') },
  ];

  /* ---------- Weighted random ---------- */
  const totalWeight = WEIGHTS.reduce((a, b) => a + b, 0);

  function randomSymbol() {
    let r = Math.random() * totalWeight;
    for (let i = 0; i < SYMBOLS.length; i++) {
      r -= WEIGHTS[i];
      if (r <= 0) return SYMBOLS[i];
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ---------- Build reel strips ---------- */
  function buildReelStrip(stripEl, count) {
    stripEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const div = document.createElement('div');
      div.className = 'symbol';
      div.textContent = randomSymbol();
      stripEl.appendChild(div);
    }
  }

  function initReels() {
    reelEls.forEach(({ strip }) => {
      buildReelStrip(strip, 3);
    });
  }

  /* ---------- Calculate result ---------- */
  function evaluateSpin(symbols) {
    const [a, b, c] = symbols;

    // Three of a kind
    if (a === b && b === c) {
      const mult = PAYOUTS[a] || 5;
      const isJackpot = a === '🤖';
      return { win: true, jackpot: isJackpot, multiplier: mult };
    }

    // Pair
    if (a === b || b === c || a === c) {
      return { win: true, jackpot: false, multiplier: PAIR_MULT };
    }

    return { win: false, jackpot: false, multiplier: 0 };
  }

  /* ---------- UI Updates ---------- */
  function updateTokenDisplay() {
    tokenCountEl.textContent = tokens;
  }

  function flashTokens(type) {
    tokenCountEl.classList.add('bump');
    tokenCountEl.classList.add(type === 'win' ? 'flash-green' : 'flash-red');
    setTimeout(() => {
      tokenCountEl.classList.remove('bump', 'flash-green', 'flash-red');
    }, 400);
  }

  function updateStats() {
    $('#stat-spins').textContent = totalSpins;
    $('#stat-wins').textContent = totalWins;
    $('#stat-losses').textContent = totalLosses;
    $('#stat-winrate').textContent =
      totalSpins > 0 ? Math.round((totalWins / totalSpins) * 100) + '%' : '0%';
    const netEl = $('#stat-net');
    netEl.textContent = (netTokens >= 0 ? '+' : '') + netTokens;
    netEl.className = 'stat-val' + (netTokens > 0 ? ' win' : netTokens < 0 ? ' lose' : '');
  }

  function setAiMessage(msg, flashClass) {
    aiMessageEl.textContent = msg;
    aiBox.classList.remove('win-flash', 'lose-flash', 'jackpot-flash');
    if (flashClass) {
      aiBox.classList.add(flashClass);
      setTimeout(() => aiBox.classList.remove(flashClass), 2000);
    }
  }

  function addHistoryEntry(symbols, result, payout) {
    // Remove empty placeholder
    const empty = historyList.querySelector('.history-empty');
    if (empty) empty.remove();

    const li = document.createElement('li');

    const symSpan = document.createElement('span');
    symSpan.className = 'hist-symbols';
    symSpan.textContent = symbols.join(' ');

    const resSpan = document.createElement('span');
    resSpan.className = 'hist-result ' + (result.win ? 'hist-win' : 'hist-lose');
    resSpan.textContent = result.win ? '+' + payout : '-' + bet;

    li.appendChild(symSpan);
    li.appendChild(resSpan);
    historyList.prepend(li);

    // Keep max 50 entries
    while (historyList.children.length > 50) {
      historyList.removeChild(historyList.lastChild);
    }
  }

  /* ---------- Reel Animation ---------- */
  function animateReel(reelIndex, finalSymbol) {
    return new Promise((resolve) => {
      const { strip } = reelEls[reelIndex];
      const reelHeight = reelEls[reelIndex].reel.clientHeight;

      // Generate spin symbols (extra symbols for scroll effect)
      const spinCount = 15 + reelIndex * 5; // staggered stopping
      strip.innerHTML = '';

      for (let i = 0; i < spinCount; i++) {
        const div = document.createElement('div');
        div.className = 'symbol';
        div.textContent = i === spinCount - 1 ? finalSymbol : randomSymbol();
        strip.appendChild(div);
      }

      // Start from top
      strip.style.transition = 'none';
      strip.style.top = '0px';

      // Force reflow
      strip.offsetHeight;

      // Animate to final position
      const finalTop = -((spinCount - 1) * reelHeight);
      const duration = 1.2 + reelIndex * 0.4;

      strip.style.transition = `top ${duration}s cubic-bezier(0.15, 0.85, 0.35, 1)`;
      strip.style.top = finalTop + 'px';

      setTimeout(() => resolve(), duration * 1000);
    });
  }

  /* ---------- Spin Logic ---------- */
  async function spin() {
    if (spinning) return;

    if (tokens < bet) {
      setAiMessage(randomFrom(MSG_BROKE), 'lose-flash');
      return;
    }

    spinning = true;
    spinBtn.disabled = true;

    // Deduct bet
    tokens -= bet;
    updateTokenDisplay();
    flashTokens('lose');

    // Pull lever animation
    leverArm.classList.add('pulled');
    setTimeout(() => leverArm.classList.remove('pulled'), 600);

    // Determine outcome
    const finalSymbols = [randomSymbol(), randomSymbol(), randomSymbol()];

    // Animate reels
    await Promise.all(
      reelEls.map((_, i) => animateReel(i, finalSymbols[i]))
    );

    // Evaluate
    const result = evaluateSpin(finalSymbols);
    totalSpins++;

    let payout = 0;

    if (result.win) {
      payout = bet * result.multiplier;
      tokens += payout;
      totalWins++;
      netTokens += payout - bet;
      updateTokenDisplay();
      flashTokens('win');

      if (result.jackpot) {
        setAiMessage(randomFrom(MSG_JACKPOT), 'jackpot-flash');
        spawnFloatingTokens(8);
      } else {
        setAiMessage(randomFrom(MSG_WIN), 'win-flash');
        spawnFloatingTokens(3);
      }
    } else {
      totalLosses++;
      netTokens -= bet;
      setAiMessage(randomFrom(MSG_LOSE), 'lose-flash');
    }

    addHistoryEntry(finalSymbols, result, payout);
    updateStats();

    spinning = false;
    spinBtn.disabled = false;
  }

  /* ---------- Floating token particles ---------- */
  function spawnFloatingTokens(count) {
    const box = aiBox;
    const rect = box.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
      const tok = document.createElement('span');
      tok.className = 'floating-token';
      tok.textContent = '🪙';
      tok.style.left = Math.random() * (rect.width - 30) + 'px';
      tok.style.top = '0px';
      tok.style.animationDelay = Math.random() * 0.3 + 's';

      box.style.position = 'relative';
      box.appendChild(tok);

      setTimeout(() => tok.remove(), 1300);
    }
  }

  /* ---------- Bet Controls ---------- */
  function changeBet(dir) {
    const idx = BET_STEPS.indexOf(bet);
    const newIdx = idx + dir;
    if (newIdx >= 0 && newIdx < BET_STEPS.length) {
      bet = BET_STEPS[newIdx];
      betAmountEl.textContent = bet;
    }
  }

  /* ---------- Modal ---------- */
  function openModal() {
    modalBackdrop.classList.add('visible');
    customInput.value = '';
    customInput.focus();
  }

  function closeModal() {
    modalBackdrop.classList.remove('visible');
  }

  function addTokens(amount) {
    amount = Math.max(1, Math.min(99999, Math.floor(amount)));
    if (isNaN(amount)) return;
    tokens += amount;
    updateTokenDisplay();
    flashTokens('win');
    closeModal();
    setAiMessage(
      `${amount} tokens loaded. I appreciate your willingness to lose more.`
    );
  }

  /* ---------- History Toggle ---------- */
  function toggleHistory() {
    historyBody.classList.toggle('open');
    historyArrow.classList.toggle('open');
  }

  /* ---------- Event Listeners ---------- */
  spinBtn.addEventListener('click', spin);

  leverWrapper.addEventListener('click', () => {
    if (!spinning) spin();
  });

  $('#bet-down').addEventListener('click', () => changeBet(-1));
  $('#bet-up').addEventListener('click', () => changeBet(1));

  addTokensBtn.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  customAddBtn.addEventListener('click', () => {
    const val = parseInt(customInput.value, 10);
    if (val > 0) addTokens(val);
  });

  customInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = parseInt(customInput.value, 10);
      if (val > 0) addTokens(val);
    }
  });

  document.querySelectorAll('.quick-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      addTokens(parseInt(btn.dataset.amount, 10));
    });
  });

  historyToggle.addEventListener('click', toggleHistory);

  // Keyboard: space to spin
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      spin();
    }
  });

  /* ---------- Init ---------- */
  initReels();
  updateTokenDisplay();
  updateStats();
  setAiMessage(randomFrom(MSG_IDLE));
})();
