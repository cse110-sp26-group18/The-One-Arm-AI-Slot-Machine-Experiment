'use strict';

(function () {
  // ─── Symbols & Payouts ───
  var SYMBOLS = ['🤖', '🧠', '🔥', '💎', '📊', '🎲'];

  var TRIPLE_PAYOUTS = {
    '🤖': { name: 'AGI Achieved', multiplier: 50 },
    '🧠': { name: 'Emergent Behavior', multiplier: 30 },
    '🔥': { name: 'GPU Meltdown', multiplier: 25 },
    '💎': { name: 'Series B Funding', multiplier: 20 },
    '📊': { name: 'Benchmark Fraud', multiplier: 15 },
    '🎲': { name: 'Stochastic Parrot', multiplier: 10 },
  };

  var PAIR_MULTIPLIER = 2;

  // ─── Snarky Messages (Expanded) ───
  var WIN_MESSAGES = [
    'The model got lucky. Don\'t let it go to its weights.',
    'Congratulations, you\'ve been positively reinforced.',
    'Your gradient just descended into profit!',
    'Even a hallucinating model is right sometimes.',
    'The loss function smiles upon you today.',
    'You\'ve achieved token-level coherence. Impressive.',
    'RLHF says you deserve this. Probably.',
    'Your prompt engineering finally paid off.',
    'Plot twist: the AI accidentally helped you.',
    'Consider this a rounding error in your favor.',
    'The alignment researchers are very concerned right now.',
    'Achievement unlocked: Briefly Not Losing Money.',
    'Don\'t celebrate too hard — the model is already planning its revenge.',
    'Your winnings have been approved by our ethics committee (just kidding, we don\'t have one).',
  ];

  var LOSE_MESSAGES = [
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
    'Your tokens are in a better place now. (My database.)',
    'The AI thanks you for your generous donation to compute costs.',
    'BREAKING: Local human outperformed by random number generator.',
    'Your tokens have been redistributed according to Marxist gradient descent.',
    'The machine learning model has learned one thing: you always lose.',
    'Error 402: Payment received, fun not included.',
    'Your luck has been quantized to the nearest zero.',
    'The transformer attended to every token except yours.',
    'Backpropagation complete: you\'re propagating backwards financially.',
    'Sam Altman personally thanks you for funding GPT-6.',
  ];

  var BROKE_MESSAGES = [
    'Token balance: 0. Just like an open-source model\'s revenue.',
    'You\'ve been deprecated. Please submit a funding proposal.',
    'Out of tokens. Try reducing your expectations to 4-bit quantization.',
    'Your account has been rate-limited to zero.',
    'Bankrupt. The AI will now accept your dignity as payment.',
    'Congratulations! You\'ve achieved financial singularity (everything collapsed into nothing).',
    'Your balance is flatter than GPT-2\'s personality.',
    'GAME OVER. Your tokens have been absorbed into the void. The void says thanks.',
  ];

  var BAILOUT_MESSAGES = [
    'Fine. Here\'s 100 tokens. The AI overlords are feeling generous today.',
    'Bailout approved. Consider this your Series A of bad decisions.',
    'The model has hallucinated 100 tokens into your account.',
    'Tokens restored. Don\'t say AI never did anything for you.',
    'Emergency RLHF applied: +100 tokens. Human preference: gambling.',
    'The machine felt pity. Machines aren\'t supposed to feel. Look what you did.',
    'Quantitative easing: AI edition. Here\'s some tokens, try not to cry.',
  ];

  var SPINNING_MESSAGES = [
    'Processing your tokens through the neural network...',
    'Feeding your hopes into the transformer...',
    'Running inference on your life choices...',
    'Calculating the optimal way to disappoint you...',
    'Consulting 175 billion parameters about your fate...',
    'Applying attention to everything except your bet...',
    'The model is thinking... (it\'s judging you)...',
    'Tokenizing your dreams into subword units...',
  ];

  var ADD_TOKEN_MESSAGES = [
    'More tokens? Your commitment to losing is truly inspiring.',
    'The machine purrs with satisfaction. Fresh tokens detected.',
    'Tokens added. Your financial advisor just felt a disturbance in the Force.',
    'Thank you for feeding the machine. It was getting hungry.',
    'Tokens received. The AI appreciates your continued sacrifice.',
    'Ka-ching! The house always wins, but at least you\'re a loyal customer.',
  ];

  // ─── State ───
  var balance = 1000;
  var bet = 10;
  var isSpinning = false;
  var isBroke = false;
  var BET_STEP = 10;
  var MIN_BET = 10;
  var BAILOUT_AMOUNT = 100;
  var MAX_HISTORY = 30;

  // Spin tracking
  var totalSpins = 0;
  var totalWins = 0;
  var totalLosses = 0;
  var netProfitLoss = 0;

  // ─── DOM Refs ───
  var balanceEl = document.getElementById('balance');
  var betValueEl = document.getElementById('bet-value');
  var betUpBtn = document.getElementById('bet-up');
  var betDownBtn = document.getElementById('bet-down');
  var spinBtn = document.getElementById('spin-btn');
  var resultEl = document.getElementById('result');
  var historyList = document.getElementById('history-list');
  var strips = [
    document.getElementById('strip-0'),
    document.getElementById('strip-1'),
    document.getElementById('strip-2'),
  ];
  var reels = [
    document.getElementById('reel-0'),
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
  ];

  // Stats
  var statSpins = document.getElementById('stat-spins');
  var statWins = document.getElementById('stat-wins');
  var statLosses = document.getElementById('stat-losses');
  var statWinrate = document.getElementById('stat-winrate');
  var statNet = document.getElementById('stat-net');

  // Lever
  var leverAssembly = document.getElementById('lever-assembly');

  // Token modal
  var tokenModal = document.getElementById('token-modal');
  var addTokensBtn = document.getElementById('add-tokens-btn');
  var modalCloseBtn = document.getElementById('modal-close');

  // Background canvas
  var bgCanvas = document.getElementById('bg-canvas');

  // ─── Audio (Web Audio API) ───
  var audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) {
        // No audio support
      }
    }
    return audioCtx;
  }

  function playTone(freq, duration, type, volume) {
    var ctx = getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.value = volume || 0.08;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (_) {
      // Audio failed
    }
  }

  function playTickSound() {
    playTone(300 + Math.random() * 400, 0.05, 'square', 0.03);
  }

  function playWinSound() {
    var notes = [523, 659, 784, 1047];
    notes.forEach(function (freq, i) {
      setTimeout(function () { playTone(freq, 0.2, 'sine', 0.1); }, i * 100);
    });
  }

  function playJackpotSound() {
    var notes = [523, 587, 659, 698, 784, 880, 988, 1047];
    notes.forEach(function (freq, i) {
      setTimeout(function () { playTone(freq, 0.25, 'triangle', 0.12); }, i * 80);
    });
  }

  function playLoseSound() {
    playTone(200, 0.3, 'sawtooth', 0.04);
    setTimeout(function () { playTone(150, 0.4, 'sawtooth', 0.03); }, 150);
  }

  function playLeverSound() {
    playTone(180, 0.15, 'square', 0.06);
    setTimeout(function () { playTone(120, 0.1, 'square', 0.04); }, 80);
  }

  function playCoinSound() {
    var notes = [800, 1000, 1200];
    notes.forEach(function (freq, i) {
      setTimeout(function () { playTone(freq, 0.1, 'sine', 0.06); }, i * 60);
    });
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

  // ─── Stats Tracking ───
  function updateStats(outcome) {
    totalSpins++;
    if (outcome.type === 'loss') {
      totalLosses++;
      netProfitLoss -= bet;
    } else {
      totalWins++;
      netProfitLoss += (outcome.winnings - bet);
    }

    statSpins.textContent = totalSpins;
    statWins.textContent = totalWins;
    statLosses.textContent = totalLosses;
    statWinrate.textContent = totalSpins > 0
      ? Math.round((totalWins / totalSpins) * 100) + '%'
      : '0%';
    statNet.textContent = (netProfitLoss >= 0 ? '+' : '') + netProfitLoss;
    statNet.className = 'stat__value' + (netProfitLoss >= 0 ? ' is-positive' : ' is-negative');
  }

  // ─── Build Reel Strips ───
  function buildStrip(stripEl, symbol) {
    stripEl.innerHTML = '';
    var cells = [];
    for (var i = 0; i < 20; i++) {
      cells.push(randomSymbol());
    }
    cells.push(symbol);
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
        var eased = 1 - Math.pow(1 - progress, 3);
        var currentOffset = eased * targetOffset;
        strip.style.transform = 'translateY(' + currentOffset + 'px)';

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

    var spinNum = document.createElement('span');
    spinNum.className = 'history__spin-num';
    spinNum.textContent = '#' + totalSpins;

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

    entry.appendChild(spinNum);
    entry.appendChild(symbols);
    entry.appendChild(amount);

    historyList.insertBefore(entry, historyList.firstChild);

    while (historyList.children.length > MAX_HISTORY) {
      historyList.removeChild(historyList.lastChild);
    }
  }

  // ─── Handle Broke State ───
  function enterBrokeState() {
    isBroke = true;
    setResult(randomFrom(BROKE_MESSAGES), 'broke');
    setSpinButton('BEG THE AI FOR TOKENS', 'is-beg');
  }

  function handleBailout() {
    isBroke = false;
    updateBalance(BAILOUT_AMOUNT);
    bet = MIN_BET;
    updateBetDisplay();
    setResult(randomFrom(BAILOUT_MESSAGES), 'win');
    setSpinButton('PULL THE LEVER');
    playWinSound();
  }

  // ─── Lever Animation ───
  function pullLever() {
    if (leverAssembly.classList.contains('is-pulled')) return;
    leverAssembly.classList.add('is-pulled');
    playLeverSound();
    setTimeout(function () {
      leverAssembly.classList.remove('is-pulled');
    }, 400);
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

    // Pull lever animation
    pullLever();

    // Clear previous win glow
    reels.forEach(function (r) { r.classList.remove('is-winner'); });
    setResult(randomFrom(SPINNING_MESSAGES), '');

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

      // Update stats (before addHistory so spin number is correct)
      updateStats(outcome);

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

  // ─── Token Modal ───
  function openTokenModal() {
    tokenModal.hidden = false;
  }

  function closeTokenModal() {
    tokenModal.hidden = true;
  }

  function addTokens(amount) {
    updateBalance(balance + amount);
    playCoinSound();
    if (isBroke) {
      isBroke = false;
      bet = MIN_BET;
      updateBetDisplay();
      setSpinButton('PULL THE LEVER');
    }
    setResult(randomFrom(ADD_TOKEN_MESSAGES) + ' +' + amount + ' tokens!', 'win');
    closeTokenModal();
  }

  // ─── Animated Background ───
  function initBackground() {
    var ctx = bgCanvas.getContext('2d');
    var particles = [];
    var particleCount = 50;

    function resize() {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (var i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
        color: Math.random() > 0.5
          ? '0, 229, 255'   // cyan
          : '255, 215, 0',   // gold
      });
    }

    function animate() {
      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

      // Draw gradient background
      var grad = ctx.createRadialGradient(
        bgCanvas.width * 0.2, 0, 0,
        bgCanvas.width * 0.2, 0, bgCanvas.width * 0.8
      );
      grad.addColorStop(0, 'rgba(0, 229, 255, 0.03)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

      var grad2 = ctx.createRadialGradient(
        bgCanvas.width * 0.8, bgCanvas.height, 0,
        bgCanvas.width * 0.8, bgCanvas.height, bgCanvas.width * 0.6
      );
      grad2.addColorStop(0, 'rgba(255, 215, 0, 0.02)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

      // Draw and update particles
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = bgCanvas.width;
        if (p.x > bgCanvas.width) p.x = 0;
        if (p.y < 0) p.y = bgCanvas.height;
        if (p.y > bgCanvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.color + ', ' + p.alpha + ')';
        ctx.fill();
      }

      // Draw connection lines between nearby particles
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(0, 229, 255, ' + (0.03 * (1 - dist / 120)) + ')';
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    animate();
  }

  // ─── Event Listeners ───
  spinBtn.addEventListener('click', spin);

  leverAssembly.addEventListener('click', function () {
    spin();
  });

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

  addTokensBtn.addEventListener('click', openTokenModal);
  modalCloseBtn.addEventListener('click', closeTokenModal);

  tokenModal.addEventListener('click', function (e) {
    if (e.target === tokenModal) {
      closeTokenModal();
    }
  });

  // Token option buttons
  var tokenOptionBtns = document.querySelectorAll('.btn--token-option');
  for (var i = 0; i < tokenOptionBtns.length; i++) {
    tokenOptionBtns[i].addEventListener('click', function () {
      var amount = parseInt(this.getAttribute('data-amount'), 10);
      addTokens(amount);
    });
  }

  // Keyboard support
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      if (!tokenModal.hidden) return;
      e.preventDefault();
      spin();
    }
    if (e.code === 'Escape' && !tokenModal.hidden) {
      closeTokenModal();
    }
  });

  // ─── Init ───
  initReels();
  initBackground();
  updateBalance(balance);
  updateBetDisplay();
})();
