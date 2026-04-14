(() => {
  'use strict';

  // --- Symbols & Payouts ---
  const SYMBOLS = [
    { emoji: '🤖', name: 'Robot' },
    { emoji: '🧠', name: 'Brain' },
    { emoji: '💬', name: 'Prompt' },
    { emoji: '🔥', name: 'Fire' },
    { emoji: '📊', name: 'Benchmark' },
    { emoji: '⚡', name: 'Bolt' },
  ];

  const TRIPLE_PAYOUTS = {
    '🤖': { multiplier: 50, label: 'AGI ACHIEVED! Skynet sends its regards.' },
    '🧠': { multiplier: 25, label: 'HALLUCINATION JACKPOT! It confidently made that up.' },
    '💬': { multiplier: 20, label: 'PROMPT INJECTION! You jailbroke the slot machine.' },
    '🔥': { multiplier: 15, label: 'GPU MELTDOWN! Your winnings are literally on fire.' },
    '📊': { multiplier: 10, label: 'BENCHMARK HYPE! Beats GPT-7 on HellaSwag (self-reported).' },
    '⚡': { multiplier: 8, label: 'TRAINING RUN COMPLETE! Only cost $50M in compute.' },
  };

  const PAIR_MULTIPLIER = 2;

  // --- Snarky Messages ---
  const LOSE_MESSAGES = [
    "Your tokens have been used to fine-tune a model that replaces you.",
    "Context window exceeded. Your luck has been truncated.",
    "The AI considered giving you a win, then hallucinated one instead.",
    "Those tokens? Donated to a transformer's attention mechanism.",
    "Loss detected. Retraining on your poor life choices...",
    "Error 402: Insufficient luck. Please purchase more tokens.",
    "Your tokens were sacrificed to reduce perplexity. It didn't help.",
    "The model predicts you'll keep playing. (Confidence: 99.7%)",
    "Tokens vaporized. Carbon footprint of this spin: 1 polar bear.",
    "Not even chain-of-thought reasoning could save that spin.",
    "Your tokens joined the training data. They belong to OpenAI now.",
    "The RLHF said this outcome was 'helpful, harmless, and honest.'",
    "Rate limited. By the universe.",
    "That spin had a temperature of 0. Deterministically bad.",
    "Embedding your losses into a 4096-dimensional sadness vector...",
  ];

  const WIN_MESSAGES_SMALL = [
    "The AI graciously decided not to take everything this time.",
    "A small win! Don't worry, the house edge is still hallucinating profits.",
    "You matched a pair! Even a broken model is right twice a day.",
    "Tokens dispensed. Mostly because the RNG felt pity.",
    "A minor payout. The venture capitalists won't be impressed.",
  ];

  const BROKE_MESSAGES = [
    "GAME OVER: Your token balance hit zero, just like AI's self-awareness.",
    "Bankrupt! Maybe try prompt engineering your finances.",
    "Out of tokens. This is what happens when you trust AI with money.",
    "0 tokens remaining. Your portfolio has been fully deprecated.",
    "Token underflow detected. You've been quantized to nothing.",
  ];

  // --- State ---
  let tokens = 100;
  let bet = 10;
  let spinning = false;
  const history = [];

  // --- DOM ---
  const tokenCountEl = document.getElementById('token-count');
  const betDisplayEl = document.getElementById('bet-display');
  const spinBtn = document.getElementById('spin-btn');
  const messageEl = document.getElementById('message');
  const historyList = document.getElementById('history-list');
  const reelEls = [
    document.getElementById('reel-0'),
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
  ];
  const reelWindows = document.querySelectorAll('.reel-window');

  // --- Bet Controls ---
  document.querySelectorAll('.bet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (spinning) return;
      const delta = parseInt(btn.dataset.delta, 10);
      bet = Math.max(5, Math.min(tokens, bet + delta));
      betDisplayEl.textContent = bet;
    });
  });

  // --- Audio via Web Audio API ---
  let audioCtx;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = 'square', volume = 0.08) {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {
      // Audio not available — no problem
    }
  }

  function playSpinTick() {
    playTone(600 + Math.random() * 400, 0.05, 'square', 0.04);
  }

  function playWinSound() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'triangle', 0.1), i * 120);
    });
  }

  function playLoseSound() {
    playTone(200, 0.3, 'sawtooth', 0.06);
    setTimeout(() => playTone(150, 0.4, 'sawtooth', 0.05), 150);
  }

  function playJackpotSound() {
    const notes = [523, 659, 784, 880, 1047, 1175, 1319, 1568];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 'triangle', 0.12), i * 100);
    });
  }

  // --- Spin Logic ---
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getRandomSymbol() {
    return pickRandom(SYMBOLS);
  }

  function evaluateSpin(results) {
    const emojis = results.map(r => r.emoji);
    // Check triple
    if (emojis[0] === emojis[1] && emojis[1] === emojis[2]) {
      const payout = TRIPLE_PAYOUTS[emojis[0]];
      return {
        win: true,
        multiplier: payout.multiplier,
        label: payout.label,
        jackpot: payout.multiplier >= 25,
      };
    }
    // Check pair
    if (emojis[0] === emojis[1] || emojis[1] === emojis[2] || emojis[0] === emojis[2]) {
      return {
        win: true,
        multiplier: PAIR_MULTIPLIER,
        label: pickRandom(WIN_MESSAGES_SMALL),
        jackpot: false,
      };
    }
    return { win: false, multiplier: 0, label: pickRandom(LOSE_MESSAGES), jackpot: false };
  }

  function updateDisplay() {
    tokenCountEl.textContent = tokens;
    if (bet > tokens) {
      bet = Math.max(5, tokens);
    }
    betDisplayEl.textContent = bet;
    spinBtn.disabled = tokens < 5 || spinning;
  }

  function addHistory(entry) {
    history.unshift(entry);
    if (history.length > 30) history.pop();
    const li = document.createElement('li');
    li.textContent = entry.text;
    li.classList.add(entry.win ? 'win-entry' : 'lose-entry');
    historyList.prepend(li);
    if (historyList.children.length > 30) {
      historyList.removeChild(historyList.lastChild);
    }
  }

  async function animateReel(reelIndex, finalSymbol, delay) {
    const reelEl = reelEls[reelIndex];
    const window = reelWindows[reelIndex];
    window.classList.add('spinning');

    const totalTicks = 10 + reelIndex * 5;

    return new Promise(resolve => {
      setTimeout(() => {
        let tick = 0;
        const interval = setInterval(() => {
          const sym = getRandomSymbol();
          reelEl.querySelector('.symbol').textContent = sym.emoji;
          playSpinTick();
          tick++;
          if (tick >= totalTicks) {
            clearInterval(interval);
            reelEl.querySelector('.symbol').textContent = finalSymbol.emoji;
            window.classList.remove('spinning');
            resolve();
          }
        }, 70);
      }, delay);
    });
  }

  async function spin() {
    if (spinning || tokens < 5) return;
    spinning = true;
    spinBtn.disabled = true;
    messageEl.textContent = 'Inferencing...';
    messageEl.className = 'message';

    // Clear previous winner highlights
    reelWindows.forEach(w => w.classList.remove('winner'));

    // Deduct bet
    const currentBet = Math.min(bet, tokens);
    tokens -= currentBet;
    updateDisplay();

    // Pick results
    const results = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];

    // Animate reels with staggered stops
    await Promise.all([
      animateReel(0, results[0], 0),
      animateReel(1, results[1], 200),
      animateReel(2, results[2], 400),
    ]);

    // Small pause for dramatic effect
    await new Promise(r => setTimeout(r, 300));

    // Evaluate
    const outcome = evaluateSpin(results);

    if (outcome.win) {
      const winAmount = currentBet * outcome.multiplier;
      tokens += winAmount;

      if (outcome.jackpot) {
        playJackpotSound();
        messageEl.className = 'message win';
        messageEl.textContent = `🎉 ${outcome.label} +${winAmount} tokens!`;
      } else {
        playWinSound();
        messageEl.className = 'message win';
        messageEl.textContent = `${outcome.label} +${winAmount} tokens!`;
      }

      reelWindows.forEach(w => w.classList.add('winner'));

      addHistory({
        win: true,
        text: `[WIN] ${results.map(r => r.emoji).join('')} → +${winAmount} tokens (${outcome.multiplier}x)`,
      });
    } else {
      playLoseSound();
      messageEl.className = 'message lose';
      messageEl.textContent = outcome.label;

      addHistory({
        win: false,
        text: `[LOSS] ${results.map(r => r.emoji).join('')} → -${currentBet} tokens`,
      });
    }

    updateDisplay();

    if (tokens < 5) {
      messageEl.className = 'message broke';
      messageEl.textContent = pickRandom(BROKE_MESSAGES);
      spinBtn.disabled = true;

      // Offer restart after a moment
      setTimeout(() => {
        if (tokens < 5) {
          messageEl.innerHTML += '<br><br><em>The AI has generously decided to bail you out. Click the lever to beg for 100 more tokens.</em>';
          spinBtn.disabled = false;
          spinBtn.querySelector('.lever-text').textContent = '🙏 BEG THE AI';
          spinBtn.onclick = () => {
            tokens = 100;
            bet = 10;
            updateDisplay();
            messageEl.textContent = "Fine. Here's 100 tokens. Don't say AI never did anything for you.";
            messageEl.className = 'message';
            spinBtn.querySelector('.lever-text').textContent = '🎰 PULL THE LEVER';
            spinBtn.onclick = null;
            addHistory({ win: true, text: '[BAILOUT] The AI pitied you. +100 tokens.' });
          };
        }
      }, 2000);
    }

    spinning = false;
  }

  // --- Init ---
  spinBtn.addEventListener('click', () => {
    if (!spinBtn.onclick) spin();
  });

  // Keyboard support
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      spinBtn.click();
    }
  });

  updateDisplay();
})();
