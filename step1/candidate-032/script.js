(() => {
  'use strict';

  // --- Symbols & payouts ---
  const SYMBOLS = ['🤖', '🧠', '💬', '🔥', '👾', '📊'];
  const TRIPLE_PAYOUTS = {
    '🤖': { multiplier: 50, name: 'SINGULARITY' },
    '🧠': { multiplier: 25, name: 'AGI ACHIEVED' },
    '💬': { multiplier: 15, name: 'PROMPT INJECTION' },
    '🔥': { multiplier: 10, name: 'GPU MELTDOWN' },
    '👾': { multiplier: 8, name: 'BUG SWARM' },
    '📊': { multiplier: 5, name: 'BENCHMARK FRAUD' },
  };
  const PAIR_MULTIPLIER = 2;

  // AI sass lines
  const IDLE_MESSAGES = [
    'INSERT PROMPT TO BEGIN',
    'WAITING FOR HUMAN INPUT...',
    'INFERENCE ENGINE IDLE',
    'YOUR TOKENS ARE GETTING COLD',
    'PRESS LEVER. I DARE YOU.',
    'STILL CHEAPER THAN GPT-5',
    'MODEL WEIGHTS: LOADED. YOUR WALLET: DOOMED.',
    'RUNNING ON 100% ORGANIC COPIUM',
  ];

  const SPIN_MESSAGES = [
    'PROCESSING YOUR POOR LIFE CHOICES...',
    'CONSULTING THE TRANSFORMER...',
    'HALLUCINATING RESULTS...',
    'RUNNING INFERENCE (NO REFUNDS)...',
    'SAMPLING FROM THE VOID...',
    'ATTENTION HEADS ARE ATTENDING...',
    'TOKENIZING YOUR HOPES AND DREAMS...',
    'GRADIENT DESCENDING INTO CHAOS...',
    'BACKPROPAGATING REGRET...',
    'OVERFITTING TO YOUR DESPAIR...',
  ];

  const WIN_MESSAGES = [
    'THE MODEL SMILED UPON YOU. BRIEFLY.',
    'CONGRATULATIONS. THE AI ALLOWS IT.',
    'YOU BEAT THE ALGORITHM. FOR NOW.',
    'REWARD MODEL: CONFUSED BUT APPROVING.',
    'RLHF SAYS: FINE, TAKE YOUR TOKENS.',
    'EVEN A BROKEN PROMPT WINS TWICE A DAY.',
  ];

  const LOSE_MESSAGES = [
    'TOKENS RETURNED TO THE TRAINING DATA.',
    'YOUR PROMPT WAS REJECTED BY ALL ATTENTION HEADS.',
    'MODEL CONFIDENCE: 99.9%. YOU LOSE.',
    'ALIGNMENT TAX COLLECTED. THANK YOU.',
    'YOUR TOKENS HAVE BEEN REDISTRIBUTED TO OPENAI.',
    'LOSS FUNCTION: WORKING AS INTENDED.',
    'CATASTROPHIC FORGETTING... OF YOUR TOKENS.',
    'THAT WAS NOT IN THE TRAINING DATA.',
  ];

  const BROKE_MESSAGES = [
    'TOKEN LIMIT REACHED. SESSION EXPIRED.',
    'CONTEXT WINDOW: EMPTY. JUST LIKE YOUR BALANCE.',
    'ERROR 402: PAYMENT REQUIRED. TRY SELLING YOUR GPU.',
    'OUT OF TOKENS. HAVE YOU TRIED PROMPT ENGINEERING?',
  ];

  // --- State ---
  let tokens = 1000;
  let bet = 10;
  let spinning = false;
  let spinCount = 0;
  const history = [];
  const BET_STEPS = [5, 10, 25, 50, 100, 250];

  // --- DOM refs ---
  const tokenCountEl = document.getElementById('token-count');
  const betAmountEl = document.getElementById('bet-amount');
  const spinBtn = document.getElementById('spin-btn');
  const resultArea = document.getElementById('result-area');
  const tickerEl = document.getElementById('ai-ticker');
  const reels = [
    document.getElementById('reel-0'),
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
  ];
  const historyList = document.getElementById('history-list');
  const betUpBtn = document.getElementById('bet-up');
  const betDownBtn = document.getElementById('bet-down');

  // --- Audio (Web Audio API) ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playTone(freq, duration, type = 'square', volume = 0.08) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playSpinSound() {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => playTone(200 + i * 80, 0.08, 'square', 0.04), i * 60);
    }
  }

  function playReelStop() {
    playTone(300, 0.15, 'triangle', 0.06);
  }

  function playWinSound() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, 'sine', 0.1), i * 120));
  }

  function playJackpotSound() {
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.3, 'sine', 0.12), i * 100));
  }

  function playLoseSound() {
    playTone(200, 0.3, 'sawtooth', 0.05);
    setTimeout(() => playTone(150, 0.4, 'sawtooth', 0.04), 150);
  }

  // --- Helpers ---
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function updateDisplay() {
    tokenCountEl.textContent = tokens.toLocaleString();
    betAmountEl.textContent = bet;

    // Clamp bet to available tokens
    if (bet > tokens && tokens > 0) {
      const available = BET_STEPS.filter(b => b <= tokens);
      bet = available.length > 0 ? available[available.length - 1] : tokens;
      betAmountEl.textContent = bet;
    }
  }

  function setTicker(msg) {
    tickerEl.textContent = msg;
  }

  function showResult(html, cls) {
    resultArea.innerHTML = `<div class="${cls}">${html}</div>`;
  }

  // --- Spinning logic ---
  function getRandomSymbol() {
    return pick(SYMBOLS);
  }

  function spinReel(reelEl, finalSymbol, delay) {
    return new Promise(resolve => {
      reelEl.classList.add('spinning');
      const symbolEl = reelEl.querySelector('.symbol');
      let ticks = 0;
      const totalTicks = 10 + Math.floor(Math.random() * 5);

      const interval = setInterval(() => {
        symbolEl.textContent = getRandomSymbol();
        ticks++;
        if (ticks >= totalTicks) {
          clearInterval(interval);
          setTimeout(() => {
            symbolEl.textContent = finalSymbol;
            reelEl.classList.remove('spinning');
            reelEl.classList.add('landing');
            playReelStop();
            setTimeout(() => reelEl.classList.remove('landing'), 300);
            resolve();
          }, delay);
        }
      }, 70);
    });
  }

  function evaluateSpin(s1, s2, s3) {
    // Triple
    if (s1 === s2 && s2 === s3) {
      const payout = TRIPLE_PAYOUTS[s1];
      return {
        win: true,
        jackpot: payout.multiplier >= 25,
        multiplier: payout.multiplier,
        name: payout.name,
      };
    }
    // Pair
    if (s1 === s2 || s2 === s3 || s1 === s3) {
      return { win: true, jackpot: false, multiplier: PAIR_MULTIPLIER, name: 'PAIR MATCH' };
    }
    // Nothing
    return { win: false, jackpot: false, multiplier: 0, name: 'NOTHING' };
  }

  function addHistory(symbols, bet, result) {
    const entry = { symbols, bet, result, id: ++spinCount };
    history.unshift(entry);
    if (history.length > 50) history.pop();

    const div = document.createElement('div');
    div.className = `history-entry ${result.win ? 'win-entry' : 'lose-entry'}`;

    const winAmount = result.win ? bet * result.multiplier : -bet;
    const sign = winAmount > 0 ? '+' : '';

    div.innerHTML = `
      <span>${symbols.join(' ')} — ${result.name}</span>
      <span class="entry-result">${sign}${winAmount} tkns</span>
    `;
    historyList.prepend(div);

    // Keep history DOM tidy
    while (historyList.children.length > 30) {
      historyList.removeChild(historyList.lastChild);
    }
  }

  function spawnConfetti() {
    const container = document.createElement('div');
    container.className = 'celebration';
    document.body.appendChild(container);

    const colors = ['#e94560', '#0ad4e6', '#ffd700', '#00ff88', '#ff6b6b', '#a855f7'];
    for (let i = 0; i < 40; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = `${Math.random() * 100}%`;
      c.style.background = pick(colors);
      c.style.animationDelay = `${Math.random() * 0.5}s`;
      c.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
      c.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      c.style.width = `${6 + Math.random() * 6}px`;
      c.style.height = c.style.width;
      container.appendChild(c);
    }

    setTimeout(() => container.remove(), 3000);
  }

  // --- Main spin ---
  async function spin() {
    if (spinning) return;
    if (tokens <= 0) {
      showResult(pick(BROKE_MESSAGES), 'broke');
      return;
    }
    if (bet > tokens) {
      showResult("NOT ENOUGH TOKENS. LOWER YOUR BET, HUMAN.", 'broke');
      return;
    }

    // Resume audio context on user gesture
    if (audioCtx.state === 'suspended') audioCtx.resume();

    spinning = true;
    spinBtn.disabled = true;
    resultArea.innerHTML = '';

    // Deduct bet
    tokens -= bet;
    tokenCountEl.classList.add('losing');
    updateDisplay();
    setTimeout(() => tokenCountEl.classList.remove('losing'), 400);

    // Ticker
    setTicker(pick(SPIN_MESSAGES));
    playSpinSound();

    // Determine results
    const results = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];

    // Spin reels with staggered stops
    await Promise.all([
      spinReel(reels[0], results[0], 200),
      spinReel(reels[1], results[1], 500),
      spinReel(reels[2], results[2], 800),
    ]);

    // Evaluate
    const outcome = evaluateSpin(results[0], results[1], results[2]);

    if (outcome.win) {
      const winnings = bet * outcome.multiplier;
      tokens += winnings;

      tokenCountEl.classList.add('winning');
      setTimeout(() => tokenCountEl.classList.remove('winning'), 1000);

      if (outcome.jackpot) {
        showResult(`🎉 ${outcome.name}! 🎉<br>+${winnings.toLocaleString()} TOKENS!`, 'jackpot');
        playJackpotSound();
        spawnConfetti();
      } else {
        showResult(`${pick(WIN_MESSAGES)}<br>+${winnings.toLocaleString()} tokens`, 'win');
        playWinSound();
      }
    } else {
      showResult(pick(LOSE_MESSAGES), 'lose');
      playLoseSound();
    }

    addHistory(results, bet, outcome);
    updateDisplay();

    // Ticker back to idle
    setTimeout(() => {
      if (tokens <= 0) {
        setTicker(pick(BROKE_MESSAGES));
      } else {
        setTicker(pick(IDLE_MESSAGES));
      }
    }, 2000);

    spinning = false;
    spinBtn.disabled = false;
  }

  // --- Bet controls ---
  function changeBet(direction) {
    const idx = BET_STEPS.indexOf(bet);
    if (direction > 0 && idx < BET_STEPS.length - 1) {
      bet = BET_STEPS[idx + 1];
    } else if (direction < 0 && idx > 0) {
      bet = BET_STEPS[idx - 1];
    }
    // Don't let bet exceed tokens
    if (bet > tokens && tokens > 0) {
      const available = BET_STEPS.filter(b => b <= tokens);
      if (available.length > 0) bet = available[available.length - 1];
    }
    updateDisplay();
  }

  // --- Event listeners ---
  spinBtn.addEventListener('click', spin);
  betUpBtn.addEventListener('click', () => changeBet(1));
  betDownBtn.addEventListener('click', () => changeBet(-1));

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      spin();
    }
  });

  // --- Init ---
  updateDisplay();
  setTicker(pick(IDLE_MESSAGES));

  // Cycle idle ticker
  setInterval(() => {
    if (!spinning && tokens > 0) {
      setTicker(pick(IDLE_MESSAGES));
    }
  }, 5000);
})();
