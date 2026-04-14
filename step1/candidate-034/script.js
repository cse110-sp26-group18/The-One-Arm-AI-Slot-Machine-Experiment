'use strict';

(function () {
  // ─── Symbols & Payouts ───
  const SYMBOLS = ['🤖', '🧠', '🔥', '💎', '📊', '🎲'];

  const TRIPLE_PAYOUTS = {
    '🤖': { name: 'AGI Achieved', multiplier: 50 },
    '🧠': { name: 'Emergent Behavior', multiplier: 30 },
    '🔥': { name: 'GPU Meltdown', multiplier: 25 },
    '💎': { name: 'Series B Funding', multiplier: 20 },
    '📊': { name: 'Benchmark Fraud', multiplier: 15 },
    '🎲': { name: 'Stochastic Parrot', multiplier: 10 },
  };

  const PAIR_MULTIPLIER = 2;

  // ─── Snarky Messages ───
  const WIN_MESSAGES = [
    'The model got lucky. Don\'t let it go to its weights.',
    'Congratulations, you\'ve been positively reinforced.',
    'Your gradient just descended into profit!',
    'Even a hallucinating model is right sometimes.',
    'The loss function smiles upon you today.',
    'You\'ve achieved token-level coherence. Impressive.',
    'RLHF says you deserve this. Probably.',
    'Your prompt engineering finally paid off.',
  ];

  const LOSE_MESSAGES = [
    'Your tokens have been added to the training corpus.',
    'Context window exceeded. Your luck has been truncated.',
    'The attention mechanism wasn\'t paying attention to you.',
    'Your tokens joined a rival startup\'s pre-training run.',
    'Model says: "I\'m sorry, I can\'t generate wins for you."',
    'Your bet was flagged as low-quality data and discarded.',
    'Temperature too high — output was garbage. As usual.',
    'Catastrophic forgetting: the machine forgot to pay you.',
    'Your tokens were used to fine-tune a model that still can\'t code FizzBuzz.',
    'The safety filter blocked your winnings.',
    'Inference complete: you lose. Confidence: 99.7%.',
    'Your tokens have been embedded in a 4096-dimensional void.',
    'Overfitting to the losing distribution, I see.',
    'Your bet was below the minimum viable context length.',
    'Chain-of-thought reasoning concludes: skill issue.',
  ];

  const BROKE_MESSAGES = [
    'Token balance: 0. Just like an open-source model\'s revenue.',
    'You\'ve been deprecated. Please submit a funding proposal.',
    'Out of tokens. Try reducing your expectations to 4-bit quantization.',
    'Your account has been rate-limited to zero.',
    'Bankrupt. The AI will now accept your dignity as payment.',
  ];

  const BAILOUT_MESSAGES = [
    'Fine. Here\'s 100 tokens. The AI overlords are feeling generous today.',
    'Bailout approved. Consider this your Series A of bad decisions.',
    'The model has hallucinated 100 tokens into your account.',
    'Tokens restored. Don\'t say AI never did anything for you.',
    'Emergency RLHF applied: +100 tokens. Human preference: gambling.',
  ];

  // ─── State ───
  let balance = 1000;
  let bet = 10;
  let isSpinning = false;
  let isBroke = false;
  const BET_STEP = 10;
  const MIN_BET = 10;
  const BAILOUT_AMOUNT = 100;
  const MAX_HISTORY = 30;

  // ─── DOM Refs ───
  const balanceEl = document.getElementById('balance');
  const betValueEl = document.getElementById('bet-value');
  const betUpBtn = document.getElementById('bet-up');
  const betDownBtn = document.getElementById('bet-down');
  const spinBtn = document.getElementById('spin-btn');
  const resultEl = document.getElementById('result');
  const historyList = document.getElementById('history-list');
  const strips = [
    document.getElementById('strip-0'),
    document.getElementById('strip-1'),
    document.getElementById('strip-2'),
  ];
  const reels = [
    document.getElementById('reel-0'),
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
  ];

  // ─── Audio (Web Audio API) ───
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) {
        // No audio support — silently continue
      }
    }
    return audioCtx;
  }

  function playTone(freq, duration, type, volume) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.value = volume || 0.08;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (_) {
      // Audio failed — no big deal
    }
  }

  function playTickSound() {
    playTone(300 + Math.random() * 400, 0.05, 'square', 0.03);
  }

  function playWinSound() {
    const notes = [523, 659, 784, 1047];
    notes.forEach(function (freq, i) {
      setTimeout(function () { playTone(freq, 0.2, 'sine', 0.1); }, i * 100);
    });
  }

  function playJackpotSound() {
    const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
    notes.forEach(function (freq, i) {
      setTimeout(function () { playTone(freq, 0.25, 'triangle', 0.12); }, i * 80);
    });
  }

  function playLoseSound() {
    playTone(200, 0.3, 'sawtooth', 0.04);
    setTimeout(function () { playTone(150, 0.4, 'sawtooth', 0.03); }, 150);
  }

  // ─── Helpers ───
  function randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function updateBalance(newBalance) {
    balance = newBalance;
    balanceEl.textContent = balance;
    balanceEl.classList.toggle('is-low', balance <= 50 && balance > 0);
  }

  function updateBetDisplay() {
    betValueEl.textContent = bet;
  }

  function setResult(msg, state) {
    resultEl.className = 'result';
    if (state) resultEl.classList.add('is-' + state);
    resultEl.innerHTML = '<p>' + msg + '</p>';
  }

  function setSpinButton(text, className) {
    spinBtn.querySelector('.btn__text').textContent = text;
    spinBtn.className = 'btn btn--spin';
    if (className) spinBtn.classList.add(className);
  }

  // ─── Build Reel Strips ───
  function buildStrip(stripEl, symbol) {
    stripEl.innerHTML = '';
    // Build a strip with many symbols for animation, landing on the target
    var cells = [];
    for (var i = 0; i < 20; i++) {
      cells.push(randomSymbol());
    }
    cells.push(symbol); // index 20 = final landing symbol
    cells.forEach(function (s) {
      var div = document.createElement('div');
      div.className = 'reel__cell';
      div.textContent = s;
      stripEl.appendChild(div);
    });
  }

  // ─── Initialize Reels ───
  function initReels() {
    strips.forEach(function (strip) {
      strip.innerHTML = '';
      var div = document.createElement('div');
      div.className = 'reel__cell';
      div.textContent = randomSymbol();
      strip.appendChild(div);
      strip.style.transform = 'translateY(0)';
    });
  }

  // ─── Evaluate Spin ───
  function evaluateSpin(results) {
    var a = results[0], b = results[1], c = results[2];

    if (a === b && b === c) {
      // Triple match
      var payout = TRIPLE_PAYOUTS[a];
      return {
        type: 'triple',
        multiplier: payout.multiplier,
        name: payout.name,
        winnings: bet * payout.multiplier,
      };
    }

    if (a === b || b === c || a === c) {
      return {
        type: 'pair',
        multiplier: PAIR_MULTIPLIER,
        name: 'Partial Match',
        winnings: bet * PAIR_MULTIPLIER,
      };
    }

    return { type: 'loss', multiplier: 0, name: null, winnings: 0 };
  }

  // ─── Animate a Single Reel ───
  function animateReel(index, targetSymbol, duration) {
    return new Promise(function (resolve) {
      var strip = strips[index];
      var reel = reels[index];
      var reelSize = reel.querySelector('.reel__window').clientHeight || 80;

      buildStrip(strip, targetSymbol);
      reel.classList.add('is-spinning');
      strip.style.transform = 'translateY(0)';

      var totalCells = strip.children.length;
      var targetOffset = -(totalCells - 1) * reelSize;
      var startTime = performance.now();
      var tickCounter = 0;

      function step(now) {
        var elapsed = now - startTime;
        var progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        var eased = 1 - Math.pow(1 - progress, 3);
        var currentOffset = eased * targetOffset;
        strip.style.transform = 'translateY(' + currentOffset + 'px)';

        // Tick sound every few cells
        var cellsPassed = Math.floor(Math.abs(currentOffset) / reelSize);
        if (cellsPassed > tickCounter) {
          tickCounter = cellsPassed;
          playTickSound();
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          reel.classList.remove('is-spinning');
          resolve();
        }
      }

      requestAnimationFrame(step);
    });
  }

  // ─── Add History Entry ───
  function addHistory(results, outcome) {
    var entry = document.createElement('div');
    entry.className = 'history__entry history__entry--' + (outcome.type === 'loss' ? 'lose' : 'win');

    var symbols = document.createElement('span');
    symbols.className = 'history__symbols';
    symbols.textContent = results.join(' ');

    var amount = document.createElement('span');
    amount.className = 'history__amount';
    if (outcome.type === 'loss') {
      amount.textContent = '−' + bet;
    } else {
      amount.textContent = '+' + outcome.winnings;
    }

    entry.appendChild(symbols);
    entry.appendChild(amount);

    historyList.insertBefore(entry, historyList.firstChild);

    // Cap history
    while (historyList.children.length > MAX_HISTORY) {
      historyList.removeChild(historyList.lastChild);
    }
  }

  // ─── Handle Broke State ───
  function enterBrokeState() {
    isBroke = true;
    setResult(randomFrom(BROKE_MESSAGES), 'broke');
    setSpinButton('🙏 BEG THE AI FOR TOKENS', 'is-beg');
  }

  function handleBailout() {
    isBroke = false;
    updateBalance(BAILOUT_AMOUNT);
    bet = MIN_BET;
    updateBetDisplay();
    setResult(randomFrom(BAILOUT_MESSAGES), 'win');
    setSpinButton('🎰 PULL THE LEVER');
    playWinSound();
  }

  // ─── Main Spin ───
  function spin() {
    if (isSpinning) return;

    if (isBroke) {
      handleBailout();
      return;
    }

    if (balance < bet) {
      if (balance <= 0) {
        enterBrokeState();
        return;
      }
      bet = Math.max(MIN_BET, Math.floor(balance / BET_STEP) * BET_STEP);
      if (bet > balance) bet = balance;
      updateBetDisplay();
    }

    isSpinning = true;
    spinBtn.disabled = true;
    updateBalance(balance - bet);

    // Clear previous win glow
    reels.forEach(function (r) { r.classList.remove('is-winner'); });
    setResult('Processing your tokens through the neural network...', '');

    // Pick results
    var results = [randomSymbol(), randomSymbol(), randomSymbol()];

    // Stagger reel animations
    var durations = [800, 1200, 1600];

    Promise.all([
      animateReel(0, results[0], durations[0]),
      animateReel(1, results[1], durations[1]),
      animateReel(2, results[2], durations[2]),
    ]).then(function () {
      var outcome = evaluateSpin(results);

      if (outcome.type === 'triple') {
        updateBalance(balance + outcome.winnings);
        setResult(outcome.name + '! You win ' + outcome.winnings + ' tokens!', 'win');
        reels.forEach(function (r) { r.classList.add('is-winner'); });
        playJackpotSound();
      } else if (outcome.type === 'pair') {
        updateBalance(balance + outcome.winnings);
        setResult(randomFrom(WIN_MESSAGES) + ' +' + outcome.winnings + ' tokens', 'win');
        playWinSound();
      } else {
        setResult(randomFrom(LOSE_MESSAGES), 'lose');
        playLoseSound();
      }

      addHistory(results, outcome);

      if (balance <= 0) {
        enterBrokeState();
      }

      isSpinning = false;
      spinBtn.disabled = false;
    });
  }

  // ─── Event Listeners ───
  spinBtn.addEventListener('click', spin);

  betUpBtn.addEventListener('click', function () {
    if (isBroke || isSpinning) return;
    var newBet = bet + BET_STEP;
    if (newBet <= balance) {
      bet = newBet;
      updateBetDisplay();
    }
  });

  betDownBtn.addEventListener('click', function () {
    if (isBroke || isSpinning) return;
    var newBet = bet - BET_STEP;
    if (newBet >= MIN_BET) {
      bet = newBet;
      updateBetDisplay();
    }
  });

  // Keyboard support
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      spin();
    }
  });

  // ─── Init ───
  initReels();
  updateBalance(balance);
  updateBetDisplay();
})();
