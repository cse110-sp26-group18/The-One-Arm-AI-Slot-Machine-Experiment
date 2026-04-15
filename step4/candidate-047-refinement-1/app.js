(() => {
  "use strict";

  // ── Sound FX (Web Audio API – no files needed) ─────
  const SFX = (() => {
    let ctx;
    function getCtx() {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      return ctx;
    }

    function playTone(freq, type, duration, volume = 0.15, ramp = 0.01) {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      gain.gain.setValueAtTime(volume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.connect(gain).connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration);
    }

    function noise(duration, volume = 0.06) {
      const c = getCtx();
      const bufferSize = c.sampleRate * duration;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      const gain = c.createGain();
      const filter = c.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      src.buffer = buffer;
      gain.gain.setValueAtTime(volume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      src.connect(filter).connect(gain).connect(c.destination);
      src.start();
    }

    return {
      leverPull() {
        // Mechanical clunk + spring
        noise(0.12, 0.1);
        playTone(180, "square", 0.08, 0.12);
        setTimeout(() => playTone(300, "sine", 0.06, 0.06), 80);
      },
      reelTick() {
        playTone(600 + Math.random() * 200, "square", 0.03, 0.04);
      },
      reelStop(index) {
        // Heavier thud for each reel landing, pitch drops per reel
        const freq = 250 - index * 40;
        playTone(freq, "triangle", 0.12, 0.15);
        noise(0.06, 0.08);
      },
      spin() {
        // Rising whir
        const c = getCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(100, c.currentTime);
        osc.frequency.linearRampToValueAtTime(400, c.currentTime + 0.3);
        gain.gain.setValueAtTime(0.05, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
        osc.connect(gain).connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.4);
      },
      win() {
        // Happy ascending arpeggio
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((f, i) => {
          setTimeout(() => playTone(f, "sine", 0.25, 0.12), i * 90);
        });
      },
      jackpot() {
        // Fanfare
        const notes = [523, 659, 784, 1047, 1319, 1568]; // C5 to G6
        notes.forEach((f, i) => {
          setTimeout(() => playTone(f, "sine", 0.4, 0.14), i * 100);
        });
        setTimeout(() => {
          // Final chord
          playTone(1047, "sine", 0.6, 0.1);
          playTone(1319, "sine", 0.6, 0.1);
          playTone(1568, "sine", 0.6, 0.1);
        }, 650);
      },
      lose() {
        // Descending sad tone
        const c = getCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, c.currentTime);
        osc.frequency.linearRampToValueAtTime(200, c.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
        osc.connect(gain).connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.35);
      },
      broke() {
        // Sad descending + low rumble
        const c = getCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(350, c.currentTime);
        osc.frequency.linearRampToValueAtTime(80, c.currentTime + 0.6);
        gain.gain.setValueAtTime(0.12, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.7);
        osc.connect(gain).connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.7);
      },
      betChange() {
        playTone(880, "sine", 0.06, 0.07);
      },
      addTokens() {
        // Coin drop cascade
        const freqs = [1200, 1400, 1600, 1800, 2000];
        freqs.forEach((f, i) => {
          setTimeout(() => playTone(f, "sine", 0.1, 0.08), i * 50);
        });
      },
    };
  })();

  // ── Symbols & Weights ──────────────────────────────
  const SYMBOLS = [
    { emoji: "🤖", name: "Robot",   weight: 8  },
    { emoji: "🧠", name: "Brain",   weight: 6  },
    { emoji: "💎", name: "Diamond", weight: 5  },
    { emoji: "🔥", name: "Fire",    weight: 10 },
    { emoji: "☁️", name: "Cloud",   weight: 12 },
    { emoji: "⚡", name: "Bolt",    weight: 12 },
    { emoji: "🐛", name: "Bug",     weight: 15 },
  ];

  const PAYOUTS = {
    "🤖": 50, "🧠": 25, "💎": 20, "🔥": 15,
    "☁️": 10, "⚡": 10, "🐛": 5,
  };

  const PARTIAL_MATCH_MULT = 2;

  // ── Messages (trimmed for less text) ──────────────
  const LOSE_MESSAGES = [
    "Tokens vanished into the cloud.",
    "The AI hallucinated your win.",
    "Training complete. Result: loss.",
    "Error 402: Winnings not found.",
    "Lost in a gradient descent.",
    "Tokens consumed. No refunds.",
    "Model confidence: 99%. Accuracy: 0%.",
    "The transformer ate your tokens.",
    "You've contributed to AI research! (involuntarily)",
    "14 million outcomes. You lost in all of them.",
    "Tokens deprecated without notice.",
    "Your bet trained a model that generates excuses.",
  ];

  const WIN_MESSAGES = [
    "The AI accidentally paid you!",
    "Tokens hallucinated into existence!",
    "The model overfitted to your luck!",
    "You beat the machine!",
    "Payout confirmed. The AI is seething.",
    "Even a broken clock wins sometimes.",
    "Someone check if it's been jailbroken.",
    "Tokens ethically sourced from failed startups.",
  ];

  const JACKPOT_MESSAGES = [
    "AGI ACHIEVED! (Just kidding. But nice win!)",
    "THE SINGULARITY PAYS WELL!",
    "You out-earned a Series A!",
    "THE MACHINES ALIGNED IN YOUR FAVOR!",
    "This payout needed more compute than GPT-4!",
  ];

  const BROKE_MESSAGES = [
    "Zero tokens. Like most AI startups.",
    "Bankrupt! Perfect burn rate simulation.",
    "Game over. Tokens deprecated.",
    "You qualify as a pre-revenue startup.",
  ];

  const SPIN_TAUNTS = [
    "Processing your regret...",
    "Running inference on your wallet...",
    "Feeding tokens to the algorithm...",
    "Calculating optimal disappointment...",
    "Burning GPU cycles...",
    "The model is thinking...",
  ];

  const ADD_TOKEN_MESSAGES = [
    "Tokens loaded! The algorithm thanks you.",
    "Restocked! The AI rubs its hands together.",
    "The sunk cost fallacy has entered the chat.",
    "More tokens! Your optimism is statistically unfounded.",
  ];

  // ── State ─────────────────────────────────────────
  let tokens = 100;
  let bet = 10;
  let spinning = false;
  const BET_STEP = 5;
  const MIN_BET = 5;

  let totalSpins = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let netProfitLoss = 0;

  // ── DOM refs ──────────────────────────────────────
  const tokenCountEl = document.getElementById("token-count");
  const betAmountEl = document.getElementById("bet-amount");
  const betDisplayEl = document.getElementById("bet-display");
  const messageEl = document.getElementById("message");
  const spinBtn = document.getElementById("spin-btn");
  const betUpBtn = document.getElementById("bet-up");
  const betDownBtn = document.getElementById("bet-down");
  const reelsFrame = document.querySelector(".reels-frame");
  const machine = document.querySelector(".slot-machine");
  const floatContainer = document.getElementById("token-float-container");
  const reelEls = [
    document.getElementById("reel-0"),
    document.getElementById("reel-1"),
    document.getElementById("reel-2"),
  ];

  const statSpins = document.getElementById("stat-spins");
  const statWins = document.getElementById("stat-wins");
  const statLosses = document.getElementById("stat-losses");
  const statRate = document.getElementById("stat-rate");
  const statNet = document.getElementById("stat-net");

  const historyToggle = document.getElementById("history-toggle");
  const historyBody = document.getElementById("history-body");
  const historyList = document.getElementById("history-list");
  const toggleArrow = document.getElementById("toggle-arrow");

  const leverAssembly = document.getElementById("lever-assembly");
  const leverArm = document.getElementById("lever-arm");

  const modalOverlay = document.getElementById("modal-overlay");
  const modalClose = document.getElementById("modal-close");
  const addTokensBtn = document.getElementById("add-tokens-btn");
  const customInput = document.getElementById("custom-token-input");
  const customAddBtn = document.getElementById("custom-add-btn");
  const quickBtns = document.querySelectorAll(".quick-btn");

  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");

  // ── Background – floating slot-themed symbols ──────
  const BG_ICONS = ["💵", "💰", "💎", "📈", "💲", "🪙", "💴", "💶", "💷", "🤑", "💸"];
  const particles = [];
  const PARTICLE_COUNT = 28;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle(startRandom) {
    const icon = BG_ICONS[Math.floor(Math.random() * BG_ICONS.length)];
    const size = 14 + Math.random() * 22;
    return {
      icon,
      x: Math.random() * canvas.width,
      y: startRandom ? Math.random() * canvas.height : canvas.height + size,
      size,
      opacity: 0.06 + Math.random() * 0.1,
      speedY: -(0.2 + Math.random() * 0.5),
      speedX: (Math.random() - 0.5) * 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.008,
      wobbleAmp: 0.3 + Math.random() * 0.6,
      wobbleFreq: 0.005 + Math.random() * 0.01,
      tick: Math.random() * 1000,
    };
  }

  function initParticles() {
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle(true));
  }

  function animateBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.tick++;
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.tick * p.wobbleFreq) * p.wobbleAmp;
      p.rotation += p.rotSpeed;

      // Recycle when off-screen top
      if (p.y < -p.size * 2) {
        particles[i] = createParticle(false);
        continue;
      }
      // Wrap horizontally
      if (p.x < -p.size) p.x = canvas.width + p.size;
      if (p.x > canvas.width + p.size) p.x = -p.size;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.icon, 0, 0);
      ctx.restore();
    }
    requestAnimationFrame(animateBackground);
  }

  // ── Helpers ───────────────────────────────────────
  const totalWeight = SYMBOLS.reduce((s, sym) => s + sym.weight, 0);

  function pickSymbol() {
    let r = Math.random() * totalWeight;
    for (const sym of SYMBOLS) {
      r -= sym.weight;
      if (r <= 0) return sym.emoji;
    }
    return SYMBOLS[SYMBOLS.length - 1].emoji;
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function buildStrip(finalSymbol, count) {
    const symbols = [];
    for (let i = 0; i < count; i++) symbols.push(pickSymbol());
    symbols.push(finalSymbol);
    return symbols;
  }

  // ── Floating Token Animation ──────────────────────
  function showTokenFloat(amount, type) {
    const el = document.createElement("div");
    el.className = "token-float";

    if (type === "jackpot") {
      el.classList.add("float-jackpot");
      el.textContent = `+${amount} 🪙`;
    } else if (amount > 0) {
      el.classList.add("float-win");
      el.textContent = `+${amount}`;
    } else {
      el.classList.add("float-lose");
      el.textContent = `${amount}`;
    }

    floatContainer.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  // ── Reel rendering & animation ────────────────────
  function renderStrip(reelIndex, symbols) {
    const strip = reelEls[reelIndex].querySelector(".reel-strip");
    strip.innerHTML = "";
    for (const sym of symbols) {
      const div = document.createElement("div");
      div.className = "symbol";
      div.textContent = sym;
      strip.appendChild(div);
    }
    strip.style.transition = "none";
    strip.style.transform = "translateY(0)";
  }

  function animateReel(reelIndex, symbols, duration) {
    return new Promise((resolve) => {
      const strip = reelEls[reelIndex].querySelector(".reel-strip");
      const reel = reelEls[reelIndex];
      const symbolHeight = reel.offsetHeight;
      const totalDistance = (symbols.length - 1) * symbolHeight;

      reel.classList.add("spinning");
      requestAnimationFrame(() => {
        strip.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.8, 0.3, 1)`;
        strip.style.transform = `translateY(-${totalDistance}px)`;
      });

      setTimeout(() => {
        reel.classList.remove("spinning");
        resolve();
      }, duration);
    });
  }

  // ── Result calc ───────────────────────────────────
  function calculateResult(results) {
    const [a, b, c] = results;
    if (a === b && b === c) {
      return { type: a === "🤖" ? "jackpot" : "win", multiplier: PAYOUTS[a] || 5 };
    }
    if (a === b || b === c || a === c) {
      return { type: "partial", multiplier: PARTIAL_MATCH_MULT };
    }
    return { type: "lose", multiplier: 0 };
  }

  // ── UI updates ────────────────────────────────────
  function updateTokenDisplay() {
    tokenCountEl.textContent = tokens;
    tokenCountEl.classList.add("bump");
    setTimeout(() => tokenCountEl.classList.remove("bump"), 200);
  }

  function updateBetDisplay() {
    betAmountEl.textContent = bet;
    betDisplayEl.textContent = bet;
  }

  function setMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = "";
    if (type) messageEl.classList.add(type);
  }

  function updateStats() {
    statSpins.textContent = totalSpins;
    statWins.textContent = totalWins;
    statLosses.textContent = totalLosses;
    const rate = totalSpins > 0 ? Math.round((totalWins / totalSpins) * 100) : 0;
    statRate.textContent = rate + "%";
    statNet.textContent = (netProfitLoss >= 0 ? "+" : "") + netProfitLoss;
    statNet.className = "stat-value " + (netProfitLoss >= 0 ? "stat-positive" : "stat-negative");
  }

  // ── History ───────────────────────────────────────
  function addHistoryEntry(spinNum, symbols, resultType, betAmt, payout) {
    const net = payout - betAmt;
    const emptyMsg = historyList.querySelector(".history-empty");
    if (emptyMsg) emptyMsg.remove();

    const div = document.createElement("div");
    const cssClass = resultType === "jackpot" ? "entry-jackpot" : (net >= 0 ? "entry-win" : "entry-lose");
    div.className = `history-entry ${cssClass}`;

    const label = resultType === "jackpot" ? "JACKPOT"
      : resultType === "win" ? "3x"
      : resultType === "partial" ? "2x"
      : "miss";

    div.innerHTML = `
      <span class="history-num">#${spinNum}</span>
      <span class="history-symbols">${symbols.join("")}</span>
      <span class="history-result">${label}</span>
      <span class="history-payout ${net >= 0 ? 'positive' : 'negative'}">${net >= 0 ? '+' : ''}${net}</span>
    `;

    historyList.prepend(div);
    const entries = historyList.querySelectorAll(".history-entry");
    if (entries.length > 50) entries[entries.length - 1].remove();
  }

  // ── Lever ─────────────────────────────────────────
  function pullLever() {
    leverArm.classList.remove("released");
    leverArm.classList.add("pulled");
  }

  function releaseLever() {
    leverArm.classList.remove("pulled");
    leverArm.classList.add("released");
  }

  // ── Init reels ────────────────────────────────────
  function initReels() {
    for (let i = 0; i < 3; i++) renderStrip(i, [pickSymbol()]);
  }

  // ── SPIN ──────────────────────────────────────────
  async function spin() {
    if (spinning) return;
    if (tokens < bet) {
      setMessage(randomFrom(BROKE_MESSAGES), "broke");
      machine.classList.add("shake");
      setTimeout(() => machine.classList.remove("shake"), 400);
      SFX.broke();
      return;
    }

    spinning = true;
    spinBtn.disabled = true;
    pullLever();
    SFX.leverPull();

    // Deduct bet
    tokens -= bet;
    updateTokenDisplay();
    showTokenFloat(-bet, "lose");
    setMessage(randomFrom(SPIN_TAUNTS), "");
    setTimeout(() => SFX.spin(), 150);

    const results = [pickSymbol(), pickSymbol(), pickSymbol()];
    const stripCounts = [18, 24, 30];
    const durations = [1200, 1600, 2000];

    for (let i = 0; i < 3; i++) {
      renderStrip(i, buildStrip(results[i], stripCounts[i]));
    }

    await new Promise((r) => setTimeout(r, 50));
    setTimeout(releaseLever, 400);

    const animations = reelEls.map((_, i) =>
      animateReel(i, buildStrip(results[i], stripCounts[i]), durations[i])
        .then(() => SFX.reelStop(i))
    );
    await Promise.all(animations);

    const result = calculateResult(results);
    const winnings = result.multiplier * bet;

    // Stats
    totalSpins++;
    if (result.type === "lose") {
      totalLosses++;
      netProfitLoss -= bet;
    } else {
      totalWins++;
      netProfitLoss += (winnings - bet);
    }
    updateStats();
    addHistoryEntry(totalSpins, results, result.type, bet, winnings);

    // Clear animations
    reelsFrame.classList.remove("win-flash", "jackpot-flash");
    machine.classList.remove("shake");

    if (result.type === "jackpot") {
      tokens += winnings;
      updateTokenDisplay();
      showTokenFloat(winnings, "jackpot");
      setMessage(`${randomFrom(JACKPOT_MESSAGES)} +${winnings}!`, "jackpot");
      reelsFrame.classList.add("jackpot-flash");
      SFX.jackpot();
    } else if (result.type === "win") {
      tokens += winnings;
      updateTokenDisplay();
      showTokenFloat(winnings, "win");
      setMessage(`${randomFrom(WIN_MESSAGES)} +${winnings}`, "win");
      reelsFrame.classList.add("win-flash");
      SFX.win();
    } else if (result.type === "partial") {
      tokens += winnings;
      updateTokenDisplay();
      showTokenFloat(winnings, "win");
      setMessage(`Partial match! +${winnings}`, "win");
      reelsFrame.classList.add("win-flash");
      SFX.win();
    } else {
      setMessage(randomFrom(LOSE_MESSAGES), "lose");
      machine.classList.add("shake");
      setTimeout(() => machine.classList.remove("shake"), 400);
      SFX.lose();
    }

    // Broke check
    if (tokens <= 0) {
      tokens = 0;
      updateTokenDisplay();
      setTimeout(() => {
        setMessage(randomFrom(BROKE_MESSAGES) + " Here's 50 pity tokens.", "broke");
        tokens = 50;
        updateTokenDisplay();
        showTokenFloat(50, "win");
      }, 1500);
    }

    // Clamp bet
    if (bet > tokens && tokens > 0) {
      bet = Math.max(MIN_BET, Math.floor(tokens / BET_STEP) * BET_STEP);
      if (bet > tokens) bet = MIN_BET;
      updateBetDisplay();
    }

    spinning = false;
    spinBtn.disabled = false;
  }

  // ── Bet controls ──────────────────────────────────
  betUpBtn.addEventListener("click", () => {
    if (spinning) return;
    if (bet + BET_STEP <= tokens) { bet += BET_STEP; updateBetDisplay(); SFX.betChange(); }
  });

  betDownBtn.addEventListener("click", () => {
    if (spinning) return;
    if (bet - BET_STEP >= MIN_BET) { bet -= BET_STEP; updateBetDisplay(); SFX.betChange(); }
  });

  // ── Spin triggers ─────────────────────────────────
  spinBtn.addEventListener("click", spin);
  leverAssembly.addEventListener("click", () => { if (!spinning) spin(); });
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !spinning) { e.preventDefault(); spin(); }
  });

  // ── History toggle ────────────────────────────────
  historyToggle.addEventListener("click", () => {
    historyBody.classList.toggle("open");
    toggleArrow.classList.toggle("open");
  });

  // ── Add Tokens Modal ──────────────────────────────
  function addTokens(amount) {
    if (amount <= 0 || isNaN(amount)) return;
    tokens += amount;
    updateTokenDisplay();
    showTokenFloat(amount, "win");
    tokenCountEl.classList.add("token-added");
    setTimeout(() => tokenCountEl.classList.remove("token-added"), 400);
    setMessage(randomFrom(ADD_TOKEN_MESSAGES), "win");
    SFX.addTokens();
    modalOverlay.classList.remove("visible");
    customInput.value = "";
  }

  addTokensBtn.addEventListener("click", () => {
    modalOverlay.classList.add("visible");
    setTimeout(() => customInput.focus(), 300);
  });

  modalClose.addEventListener("click", () => modalOverlay.classList.remove("visible"));

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove("visible");
  });

  customAddBtn.addEventListener("click", () => {
    addTokens(parseInt(customInput.value, 10));
  });

  customInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTokens(parseInt(customInput.value, 10));
  });

  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      addTokens(parseInt(btn.dataset.amount, 10));
    });
  });

  // ── Init ──────────────────────────────────────────
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  initParticles();
  animateBackground();

  initReels();
  updateBetDisplay();
  updateTokenDisplay();
  updateStats();
})();
