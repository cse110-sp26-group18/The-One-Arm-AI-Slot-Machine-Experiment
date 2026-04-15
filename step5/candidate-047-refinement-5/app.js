// ============================================================================
// The One-Arm AI – Slot Machine
// ----------------------------------------------------------------------------
// All game logic lives inside one IIFE so nothing leaks onto window. The major
// subsystems (each delimited by a banner comment below) are:
//
//   1. SFX           – one-shot synthesised sound effects (Web Audio).
//   2. Music         – generative looping casino jingle scheduler (Web Audio).
//   3. Symbols/State – reel symbol table, payout table, and game state.
//   4. Background    – animated emoji particle field on <canvas>.
//   5. Reels         – render + spin animation for the three columns.
//   6. UI            – DOM updates for tokens, bet, message, stats, history.
//   7. Spin loop     – the main async spin() function that ties it all together.
//   8. Event wiring  – button/keyboard/modal listeners.
//   9. Init          – one-time setup at the bottom of the IIFE.
//
// See DOCUMENTATION.md (in this folder) for a higher-level feature overview
// and step-by-step guides for adding new symbols, sounds, and tests.
// ============================================================================
(() => {
  "use strict";

  // ── 1. Sound FX (Web Audio API – no audio files needed) ─────────────────
  // Every effect is synthesised on the fly with oscillators and filtered noise,
  // so the project ships with zero binary assets. The whole module is a
  // singleton built lazily on first use to satisfy browser autoplay policies
  // (an AudioContext can only start in response to a user gesture).
  const SFX = (() => {
    let ctx;

    // Lazily create the shared AudioContext on first sound. Browsers block
    // creation outside a user gesture, so we never instantiate eagerly.
    function getCtx() {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      return ctx;
    }

    // Generic oscillator helper: schedules a single tone with an exponential
    // fade-out envelope. Used as the building block for most blippy effects.
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

    // Filtered white-noise burst — used for the mechanical "clunk" of the
    // lever and the percussive thud of each reel landing.
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

    // Public effect catalogue. Each entry describes a discrete game event.
    return {
      // Pulling the lever — heavy mechanical clunk + spring response.
      leverPull() {
        noise(0.12, 0.1);
        playTone(180, "square", 0.08, 0.12);
        setTimeout(() => playTone(300, "sine", 0.06, 0.06), 80);
      },
      // Tick-tick reel sound (currently unused but kept for future polish).
      reelTick() {
        playTone(600 + Math.random() * 200, "square", 0.03, 0.04);
      },
      // The thud each time a reel locks into place; pitch drops with index
      // so the three landings feel like a descending arpeggio.
      reelStop(index) {
        const freq = 250 - index * 40;
        playTone(freq, "triangle", 0.12, 0.15);
        noise(0.06, 0.08);
      },
      // Rising whirr that plays as the reels start spinning.
      spin() {
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
      // Cheerful arpeggio for a regular 3-of-a-kind win.
      win() {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((f, i) => {
          setTimeout(() => playTone(f, "sine", 0.25, 0.12), i * 90);
        });
      },
      // Full fanfare reserved for the 🤖🤖🤖 jackpot.
      jackpot() {
        const notes = [523, 659, 784, 1047, 1319, 1568]; // C5 → G6
        notes.forEach((f, i) => {
          setTimeout(() => playTone(f, "sine", 0.4, 0.14), i * 100);
        });
        // Sustained final chord (C-E-G stacked) ~650 ms after the run-up.
        setTimeout(() => {
          playTone(1047, "sine", 0.6, 0.1);
          playTone(1319, "sine", 0.6, 0.1);
          playTone(1568, "sine", 0.6, 0.1);
        }, 650);
      },
      // Sad descending pitch on a losing spin.
      lose() {
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
      // Deeper rumble used when the player runs out of tokens.
      broke() {
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
      // Tiny blip when adjusting the bet via +/- buttons.
      betChange() {
        playTone(880, "sine", 0.06, 0.07);
      },
      // Coin-cascade chime when adding more tokens through the modal.
      addTokens() {
        const freqs = [1200, 1400, 1600, 1800, 2000];
        freqs.forEach((f, i) => {
          setTimeout(() => playTone(f, "sine", 0.1, 0.08), i * 50);
        });
      },
    };
  })();

  // ── 2. Background Music (looping generative casino jingle) ──────────────
  // The music system schedules notes ahead of time on the AudioContext clock
  // (the standard pattern from "A Tale of Two Clocks" by Chris Wilson). We
  // keep a small four-bar chord progression in C major and walk through it
  // forever while the toggle is on. There are no audio files to load — every
  // note is a fresh oscillator instance.
  //
  // Lifecycle:
  //   start() → resumes the AudioContext and kicks the scheduler loop.
  //   stop()  → flips the playing flag; in-flight notes finish naturally.
  // The scheduler runs on a JS interval and only schedules notes that fall
  // within a short look-ahead window (SCHEDULE_AHEAD), so toggling off feels
  // responsive instead of waiting for a long pre-queued buffer to drain.
  const Music = (() => {
    let ctx;
    let masterGain;
    let isPlaying = false;
    let nextBarTime = 0;     // AudioContext time of the next bar to schedule.
    let barIndex = 0;         // Which bar of the progression to play next.
    let schedulerTimer = null;

    const BPM = 120;
    const BEAT = 60 / BPM;        // Seconds per quarter note (0.5s @ 120 BPM).
    const BAR = 4 * BEAT;          // Four beats per bar.
    const SCHEDULE_AHEAD = 0.3;    // Schedule notes up to 300ms in the future.
    const TICK_MS = 80;            // Run the scheduler ~12× per second.

    // MIDI-ish frequency lookup for the notes we use. Kept inline so anyone
    // editing the loop can see at a glance which pitches are involved.
    const N = {
      C3: 130.81, E3: 164.81, G3: 196.00, A3: 220.00, F3: 174.61, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
    };

    // Four-bar I-vi-IV-V progression (C → Am → F → G). Each bar holds a
    // bassline (low sawtooth) and a melodic figure (triangle lead). The
    // shape is "{ bass:[...], lead:[...] }" where every note is
    // [frequency, beatOffset, durationInBeats].
    const PROGRESSION = [
      { // Bar 1 – C major
        bass: [[N.C3, 0, 1], [N.G3, 1, 1], [N.C3, 2, 1], [N.G3, 3, 1]],
        lead: [[N.C5, 0, 0.5], [N.E5, 0.5, 0.5], [N.G5, 1, 0.5], [N.C5, 1.5, 0.5],
               [N.E5, 2, 0.5], [N.G5, 2.5, 0.5], [N.E5, 3, 1]],
      },
      { // Bar 2 – A minor
        bass: [[N.A3, 0, 1], [N.E3, 1, 1], [N.A3, 2, 1], [N.E3, 3, 1]],
        lead: [[N.A4, 0, 0.5], [N.C5, 0.5, 0.5], [N.E5, 1, 0.5], [N.A5, 1.5, 0.5],
               [N.E5, 2, 0.5], [N.C5, 2.5, 0.5], [N.A4, 3, 1]],
      },
      { // Bar 3 – F major
        bass: [[N.F3, 0, 1], [N.C4, 1, 1], [N.F3, 2, 1], [N.C4, 3, 1]],
        lead: [[N.F4, 0, 0.5], [N.A4, 0.5, 0.5], [N.C5, 1, 0.5], [N.F5, 1.5, 0.5],
               [N.C5, 2, 0.5], [N.A4, 2.5, 0.5], [N.F4, 3, 1]],
      },
      { // Bar 4 – G major (turnaround back to C)
        bass: [[N.G3, 0, 1], [N.D4, 1, 1], [N.G3, 2, 1], [N.B3, 3, 1]],
        lead: [[N.G4, 0, 0.5], [N.B4, 0.5, 0.5], [N.D5, 1, 0.5], [N.G5, 1.5, 0.5],
               [N.D5, 2, 0.5], [N.B4, 2.5, 0.5], [N.G4, 3, 1]],
      },
    ];

    // Lazily build the AudioContext and a master gain we keep low so the
    // music sits underneath the SFX. Returning the same context we use for
    // SFX would also be fine — they happily share output.
    function getCtx() {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.18; // Headroom so SFX still cut through.
        masterGain.connect(ctx.destination);
      }
      return ctx;
    }

    // Schedule a single note at an absolute AudioContext time. Each note is
    // its own short-lived oscillator with an attack/decay envelope so they
    // don't click at the boundaries.
    function scheduleNote(freq, startTime, durationSec, type, peakGain) {
      const c = getCtx();
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      g.gain.setValueAtTime(0.0001, startTime);
      g.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);
      osc.connect(g).connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + durationSec + 0.05);
    }

    // Schedule one full bar of the progression starting at `barStart`.
    function scheduleBar(barStart, bar) {
      // Bassline: warm sawtooth, low and steady.
      for (const [freq, beat, dur] of bar.bass) {
        scheduleNote(freq, barStart + beat * BEAT, dur * BEAT, "sawtooth", 0.09);
      }
      // Lead melody: bright triangle on top.
      for (const [freq, beat, dur] of bar.lead) {
        scheduleNote(freq, barStart + beat * BEAT, dur * BEAT, "triangle", 0.07);
      }
      // Sparkle on beat 1 of each bar — a tiny high-pitched "ding" gives
      // the loop that classic slot-floor casino feel.
      scheduleNote(N.C5 * 4, barStart, 0.12, "sine", 0.04);
    }

    // Scheduler tick: walk forward through the progression, queuing any
    // bars that fall inside our look-ahead window.
    function scheduler() {
      if (!isPlaying) return;
      const c = getCtx();
      while (nextBarTime < c.currentTime + SCHEDULE_AHEAD) {
        scheduleBar(nextBarTime, PROGRESSION[barIndex % PROGRESSION.length]);
        nextBarTime += BAR;
        barIndex++;
      }
      schedulerTimer = setTimeout(scheduler, TICK_MS);
    }

    return {
      // Begin playing. Safe to call repeatedly; a no-op if already running.
      start() {
        if (isPlaying) return;
        const c = getCtx();
        // Some browsers leave the context "suspended" until a gesture.
        if (c.state === "suspended") c.resume();
        isPlaying = true;
        nextBarTime = c.currentTime + 0.1;
        barIndex = 0;
        scheduler();
      },
      // Stop the scheduler. Notes already queued ring out naturally so we
      // never get an audible click, which would be jarring when toggling.
      stop() {
        isPlaying = false;
        if (schedulerTimer) {
          clearTimeout(schedulerTimer);
          schedulerTimer = null;
        }
      },
      isOn() { return isPlaying; },
    };
  })();

  // ── 3. Symbols, payouts, and game state ────────────────────────────────
  // Adjusting `weight` here directly tunes how often each symbol appears on
  // the reels — heavier symbols are more common, so cheaper payouts have
  // higher weights and rare jackpot symbols have low weights.
  const SYMBOLS = [
    { emoji: "🤖", name: "Robot",   weight: 8  },
    { emoji: "🧠", name: "Brain",   weight: 6  },
    { emoji: "💎", name: "Diamond", weight: 5  },
    { emoji: "🔥", name: "Fire",    weight: 10 },
    { emoji: "☁️", name: "Cloud",   weight: 12 },
    { emoji: "⚡", name: "Bolt",    weight: 12 },
    { emoji: "🐛", name: "Bug",     weight: 15 },
  ];

  // Multiplier applied to the bet when all three reels show this symbol.
  // 🤖 is treated specially: matching three robots fires the JACKPOT path.
  const PAYOUTS = {
    "🤖": 50, "🧠": 25, "💎": 20, "🔥": 15,
    "☁️": 10, "⚡": 10, "🐛": 5,
  };

  // Reward for two-of-a-kind (any pair). Tweak to balance how generous the
  // machine feels in everyday spins.
  const PARTIAL_MATCH_MULT = 2;

  // ── Flavour text pools (chosen at random per event) ────────────────────
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

  // ── Mutable game state ─────────────────────────────────────────────────
  // All of this lives in module scope so spin(), the bet buttons, and the
  // stat updaters can read/write it without passing it around. There is no
  // persistence — refreshing the page restores defaults.
  let tokens = 100;       // Current player balance.
  let bet = 10;           // How much each spin costs.
  let spinning = false;   // Re-entry guard so multi-clicks don't stack spins.
  const BET_STEP = 5;     // Granularity of the bet +/- buttons.
  const MIN_BET = 5;      // Floor for the bet so it never reaches 0.

  let totalSpins = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let netProfitLoss = 0;  // Signed net change in tokens for this session.

  // ── DOM references (cached once at module load) ────────────────────────
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

  const musicToggleBtn = document.getElementById("music-toggle");
  const musicIcon = document.getElementById("music-icon");
  const musicLabel = document.getElementById("music-label");

  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");

  // ── 4. Background particle field ───────────────────────────────────────
  // A sparse cloud of money/casino emojis floating up the screen. Pure
  // canvas — no DOM nodes per particle, so it stays cheap on slow devices.
  // Particles wrap horizontally and respawn from the bottom when they leave
  // the top edge.
  const BG_ICONS = ["💵", "💰", "💎", "📈", "💲", "🪙", "💴", "💶", "💷", "🤑", "💸", "🎰", "🎲", "♠️", "♥️"];
  const particles = [];
  const PARTICLE_COUNT = 38; // Bumped up for a livelier casino atmosphere.

  // Match the canvas pixel size to its CSS size (re-run on window resize).
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // Build one particle. If `startRandom` is true the particle is placed at
  // a random vertical position (used at startup so the screen is already
  // populated instead of waiting for particles to drift in from the bottom).
  function createParticle(startRandom) {
    const icon = BG_ICONS[Math.floor(Math.random() * BG_ICONS.length)];
    const size = 18 + Math.random() * 26;
    return {
      icon,
      x: Math.random() * canvas.width,
      y: startRandom ? Math.random() * canvas.height : canvas.height + size,
      size,
      // Higher opacity than before so the colourful background reads through
      // as a true casino floor instead of an empty void.
      opacity: 0.18 + Math.random() * 0.22,
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

  // requestAnimationFrame loop. Each frame we clear the canvas, advance
  // every particle, recycle any that have left the screen, then draw them.
  function animateBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.tick++;
      p.y += p.speedY;
      // Sinusoidal x wobble adds an organic floaty motion.
      p.x += p.speedX + Math.sin(p.tick * p.wobbleFreq) * p.wobbleAmp;
      p.rotation += p.rotSpeed;

      // Recycle when the particle drifts past the top of the screen.
      if (p.y < -p.size * 2) {
        particles[i] = createParticle(false);
        continue;
      }
      // Wrap horizontally so nothing piles up at the edges.
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

  // ── Helpers ───────────────────────────────────────────────────────────
  // Sum of all symbol weights — pre-computed once so pickSymbol() is O(n)
  // over symbols rather than recomputing the total on every spin.
  const totalWeight = SYMBOLS.reduce((s, sym) => s + sym.weight, 0);

  // Weighted random symbol picker. Generate r ∈ [0, totalWeight) and walk
  // through the symbol list subtracting weights until r drops to 0.
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

  // Build a strip of `count` random symbols, with `finalSymbol` pinned to
  // the very end. The reel animation slides the strip up so that the final
  // symbol lands inside the reel window when it stops.
  function buildStrip(finalSymbol, count) {
    const symbols = [];
    for (let i = 0; i < count; i++) symbols.push(pickSymbol());
    symbols.push(finalSymbol);
    return symbols;
  }

  // ── Floating Token Animation ──────────────────────────────────────────
  // Small +N / -N labels that drift above the reels each spin. Different
  // CSS classes give wins, losses, and jackpots distinct colours and motion.
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
    // Self-cleanup once the CSS animation finishes.
    setTimeout(() => el.remove(), 2000);
  }

  // ── 5. Reel rendering & animation ─────────────────────────────────────
  // Each reel is a fixed-height window with a tall vertical "strip" inside
  // it. We render the strip from scratch for each spin and translate it
  // upward with a CSS transition — much cheaper than animating individual
  // symbols, and the cubic-bezier easing gives the slowdown its weight.
  function renderStrip(reelIndex, symbols) {
    const strip = reelEls[reelIndex].querySelector(".reel-strip");
    strip.innerHTML = "";
    for (const sym of symbols) {
      const div = document.createElement("div");
      div.className = "symbol";
      div.textContent = sym;
      strip.appendChild(div);
    }
    // Snap back to the top instantly before the next spin animates downward.
    strip.style.transition = "none";
    strip.style.transform = "translateY(0)";
  }

  // Animate one reel. Returns a Promise that resolves when the slide ends,
  // so spin() can `await Promise.all([...])` for all three reels at once.
  function animateReel(reelIndex, symbols, duration) {
    return new Promise((resolve) => {
      const strip = reelEls[reelIndex].querySelector(".reel-strip");
      const reel = reelEls[reelIndex];
      const symbolHeight = reel.offsetHeight;
      const totalDistance = (symbols.length - 1) * symbolHeight;

      reel.classList.add("spinning");
      // Wait one frame so the snap-to-zero from renderStrip has actually
      // landed before we start the transition — otherwise the browser may
      // collapse the two transforms and the slide won't animate.
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

  // ── Result calculation ────────────────────────────────────────────────
  // Three outcomes:
  //   * all three match → jackpot if 🤖, otherwise regular win.
  //   * exactly two match → "partial" — small consolation payout.
  //   * no match         → loss (multiplier = 0).
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

  // ── 6. UI updates ─────────────────────────────────────────────────────
  // Each updater is intentionally small so it's obvious where DOM writes
  // happen. spin() calls these explicitly after mutating state.
  function updateTokenDisplay() {
    tokenCountEl.textContent = tokens;
    // "bump" class drives a quick scale-up CSS animation for visual feedback.
    tokenCountEl.classList.add("bump");
    setTimeout(() => tokenCountEl.classList.remove("bump"), 200);
  }

  function updateBetDisplay() {
    betAmountEl.textContent = bet;
    betDisplayEl.textContent = bet;
  }

  // The optional `type` becomes a class on #message so the CSS can colour
  // wins, losses, jackpots, etc. differently.
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

  // ── History panel ─────────────────────────────────────────────────────
  // Maintains a capped, prepend-only list (newest first) of the last 50
  // spins, with colour-coded entries for win/loss/jackpot.
  function addHistoryEntry(spinNum, symbols, resultType, betAmt, payout) {
    const net = payout - betAmt;
    // Drop the "no spins yet" placeholder once we have real data.
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
    // Cap the list at 50 entries so it doesn't grow unbounded over a long
    // play session. Oldest entry (last child) gets dropped.
    const entries = historyList.querySelectorAll(".history-entry");
    if (entries.length > 50) entries[entries.length - 1].remove();
  }

  // ── Lever animation helpers ───────────────────────────────────────────
  function pullLever() {
    leverArm.classList.remove("released");
    leverArm.classList.add("pulled");
  }

  function releaseLever() {
    leverArm.classList.remove("pulled");
    leverArm.classList.add("released");
  }

  // ── Initial reel render — one symbol each before the first spin. ───────
  function initReels() {
    for (let i = 0; i < 3; i++) renderStrip(i, [pickSymbol()]);
  }

  // ── 7. SPIN — the main game loop ──────────────────────────────────────
  // Async because each spin involves multiple awaited animations. The
  // sequence of steps is:
  //   1. Guard: bail if we're already spinning or the player can't afford it.
  //   2. Lock UI, deduct the bet, kick off lever + whirr SFX.
  //   3. Pre-build each reel's symbol strip with its final symbol pinned.
  //   4. Animate all three reels in parallel; each reel resolves on landing.
  //   5. Score the result, update stats/history, fire the right SFX class.
  //   6. Handle the "broke" edge case (gift 50 pity tokens).
  //   7. Clamp the bet down if the player can no longer afford the previous
  //      bet amount, then unlock the UI for the next spin.
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

    // Take the bet up front. The float shows a -bet drift to make the cost
    // visible even on losing spins where there's no payout to follow.
    tokens -= bet;
    updateTokenDisplay();
    showTokenFloat(-bet, "lose");
    setMessage(randomFrom(SPIN_TAUNTS), "");
    setTimeout(() => SFX.spin(), 150);

    // Predetermine the final landing for each reel so animation is just
    // visual sugar. Different strip lengths/durations stagger the stops.
    const results = [pickSymbol(), pickSymbol(), pickSymbol()];
    const stripCounts = [18, 24, 30];
    const durations = [1200, 1600, 2000];

    for (let i = 0; i < 3; i++) {
      renderStrip(i, buildStrip(results[i], stripCounts[i]));
    }

    // Tiny defer so the browser commits the renderStrip transform reset
    // before we apply the animated transform.
    await new Promise((r) => setTimeout(r, 50));
    setTimeout(releaseLever, 400);

    // Run all three reels in parallel; play the per-reel stop SFX as each
    // reel's promise resolves so the thuds line up with the visual landings.
    const animations = reelEls.map((_, i) =>
      animateReel(i, buildStrip(results[i], stripCounts[i]), durations[i])
        .then(() => SFX.reelStop(i))
    );
    await Promise.all(animations);

    // Score the spin and update everything dependent on the outcome.
    const result = calculateResult(results);
    const winnings = result.multiplier * bet;

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

    // Wipe any flash classes from the previous spin so the next animation
    // can re-trigger cleanly.
    reelsFrame.classList.remove("win-flash", "jackpot-flash");
    machine.classList.remove("shake");

    // Branch on outcome: pay out, set a themed message, fire the SFX, and
    // add a corresponding flash/shake animation to the machine frame.
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

    // Pity rescue: if the player just lost their last token, gift them 50
    // after a short pause so the game never dead-ends from a broke state.
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

    // Auto-clamp the bet if the player can no longer afford their previous
    // amount, snapping it down to the closest legal multiple of BET_STEP.
    if (bet > tokens && tokens > 0) {
      bet = Math.max(MIN_BET, Math.floor(tokens / BET_STEP) * BET_STEP);
      if (bet > tokens) bet = MIN_BET;
      updateBetDisplay();
    }

    spinning = false;
    spinBtn.disabled = false;
  }

  // ── 8. Event wiring ───────────────────────────────────────────────────
  // Bet adjustment buttons. Both clamp against tokens / MIN_BET so we can
  // never bet more than we have or less than the minimum.
  betUpBtn.addEventListener("click", () => {
    if (spinning) return;
    if (bet + BET_STEP <= tokens) { bet += BET_STEP; updateBetDisplay(); SFX.betChange(); }
  });

  betDownBtn.addEventListener("click", () => {
    if (spinning) return;
    if (bet - BET_STEP >= MIN_BET) { bet -= BET_STEP; updateBetDisplay(); SFX.betChange(); }
  });

  // Spin can be triggered three different ways: the SPIN button, clicking
  // the lever assembly, or pressing space. All three funnel into spin().
  spinBtn.addEventListener("click", spin);
  leverAssembly.addEventListener("click", () => { if (!spinning) spin(); });
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !spinning) { e.preventDefault(); spin(); }
  });

  // History panel collapse/expand toggle.
  historyToggle.addEventListener("click", () => {
    historyBody.classList.toggle("open");
    toggleArrow.classList.toggle("open");
  });

  // ── Add Tokens modal ──────────────────────────────────────────────────
  // Validates the amount, credits the balance, plays a happy chime, and
  // closes the modal. Used by both the custom input and the preset buttons.
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
    // Slight delay so the focus lands after the modal's scale-in animation.
    setTimeout(() => customInput.focus(), 300);
  });

  modalClose.addEventListener("click", () => modalOverlay.classList.remove("visible"));

  // Click on the dimmed backdrop (but not the modal itself) closes it.
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove("visible");
  });

  customAddBtn.addEventListener("click", () => {
    addTokens(parseInt(customInput.value, 10));
  });

  customInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTokens(parseInt(customInput.value, 10));
  });

  // Preset quick-add buttons read their amount from a data-amount attr.
  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      addTokens(parseInt(btn.dataset.amount, 10));
    });
  });

  // ── Music toggle ──────────────────────────────────────────────────────
  // Flips the Music module on/off and swaps the icon/label so the button
  // visibly reflects state. Browser autoplay rules require this to be a
  // user-initiated click, which it is.
  function setMusicUi(on) {
    if (on) {
      musicToggleBtn.classList.add("playing");
      musicIcon.textContent = "🎵";
      musicLabel.textContent = "Music On";
    } else {
      musicToggleBtn.classList.remove("playing");
      musicIcon.textContent = "🔇";
      musicLabel.textContent = "Music";
    }
  }

  musicToggleBtn.addEventListener("click", () => {
    if (Music.isOn()) {
      Music.stop();
      setMusicUi(false);
    } else {
      Music.start();
      setMusicUi(true);
    }
  });

  // ── 9. Init ───────────────────────────────────────────────────────────
  // Final boot sequence: size the canvas, populate particles, kick the
  // animation loop, draw the initial reel symbols, and sync all UI text
  // with the starting state.
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  initParticles();
  animateBackground();

  initReels();
  updateBetDisplay();
  updateTokenDisplay();
  updateStats();
  setMusicUi(false);
})();
