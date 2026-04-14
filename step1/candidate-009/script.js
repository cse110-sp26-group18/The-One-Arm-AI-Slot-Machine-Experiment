(() => {
  "use strict";

  const SYMBOLS = [
    { icon: "🤖", name: "AGI",       multiplier: 100, weight: 1  },
    { icon: "🧠", name: "Brain",     multiplier: 50,  weight: 2  },
    { icon: "💸", name: "VC Money",  multiplier: 40,  weight: 2  },
    { icon: "⚡", name: "GPU",       multiplier: 30,  weight: 3  },
    { icon: "📊", name: "Benchmark", multiplier: 20,  weight: 4  },
    { icon: "🔮", name: "Prompt",    multiplier: 15,  weight: 5  },
    { icon: "🍌", name: "Banana",    multiplier: 10,  weight: 6  },
  ];

  const BET_OPTIONS = [5, 10, 25, 50, 100, 250];
  const STORAGE_KEY = "hallucislots.v1";

  const WIN_MESSAGES = {
    "🤖": "🚨 AGI ACHIEVED. Please notify the board, the press, and your therapist.",
    "🧠": "Big Brain Energy detected. Emergent capabilities unlocked (citation needed).",
    "💸": "Venture capital has entered the chat. Burn rate nominal.",
    "⚡": "GPUs overclocked. The planet cries. You win.",
    "📊": "Benchmark farmed. MMLU score suspiciously round.",
    "🔮": "Prompt engineered to perfection. You are a 10× prompter.",
    "🍌": "🍌 It's bananas. Nobody knows why the model likes this.",
  };

  const LOSS_MESSAGES = [
    "Model hallucinated. Tokens refunded: 0.",
    "Context window exceeded. Please try again in 2 turns.",
    "Rate limited by the universe.",
    "Loss was not due to the model. It was definitely your prompt.",
    "Temperature too high. Try again at 0.7.",
    "The attention heads were looking the other way.",
    "Mode collapse. All reels agreed on nothing.",
    "Fine-tuning required. (Yours.)",
    "Alignment tax applied. House wins.",
    "Output was filtered for safety. So were your tokens.",
  ];

  const PARTIAL_MESSAGES = [
    "Partial hallucination. Two matching — close enough for a demo.",
    "Almost AGI. Moving goalposts engaged.",
    "Cherry-picked result. Ship it.",
  ];

  const BROKE_MESSAGES = [
    "Out of tokens. Consider a Series A.",
    "Compute budget exhausted. Try begging.",
    "You have been rate-limited into poverty.",
  ];

  const BEG_MESSAGES = [
    "A kind VC threw you 100 tokens. You now owe them a pitch deck.",
    "An intern smuggled you 100 tokens from the ops budget.",
    "Found 100 tokens behind the GPU rack.",
  ];

  // ---------- State ----------
  const state = load() || { balance: 1000, bet: 25, lastPayout: 0 };

  // ---------- Elements ----------
  const $ = (id) => document.getElementById(id);
  const els = {
    balance: $("balance"),
    bet:     $("bet"),
    payout:  $("payout"),
    message: $("message"),
    spin:    $("spin"),
    betUp:   $("betUp"),
    betDown: $("betDown"),
    maxBet:  $("maxBet"),
    beg:     $("beg"),
    reset:   $("reset"),
    reels:   [$("reel-0"), $("reel-1"), $("reel-2")],
    reelBox: $("reels"),
  };

  // ---------- Build weighted symbol pool ----------
  const pool = [];
  for (const s of SYMBOLS) {
    for (let i = 0; i < s.weight; i++) pool.push(s);
  }
  const pickSymbol = () => pool[Math.floor(Math.random() * pool.length)];

  // ---------- Init reels ----------
  const REEL_CELLS = 25; // how many cells render per spin
  function buildStrip(reelEl, finalIcon) {
    reelEl.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (let i = 0; i < REEL_CELLS; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.textContent = i === REEL_CELLS - 1 ? finalIcon : pickSymbol().icon;
      frag.appendChild(cell);
    }
    reelEl.appendChild(frag);
    reelEl.style.transform = "translateY(0)";
  }

  function initialRender() {
    for (const reelEl of els.reels) {
      reelEl.innerHTML = "";
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.textContent = "❓";
      reelEl.appendChild(cell);
    }
    render();
  }

  // ---------- Rendering HUD ----------
  function render() {
    els.balance.textContent = state.balance;
    els.bet.textContent = state.bet;
    els.payout.textContent = state.lastPayout;

    const canAfford = state.balance >= state.bet;
    els.spin.disabled = !canAfford;
  }

  function setMessage(text, kind = "") {
    els.message.textContent = text;
    els.message.className = "message" + (kind ? " " + kind : "");
  }

  // ---------- Persistence ----------
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ---------- Spin logic ----------
  let spinning = false;

  async function spin() {
    if (spinning) return;
    if (state.balance < state.bet) {
      setMessage(pick(BROKE_MESSAGES), "loss");
      return;
    }

    spinning = true;
    state.balance -= state.bet;
    state.lastPayout = 0;
    render();
    setMessage("Hallucinating…");
    els.spin.disabled = true;

    // Decide outcome
    const results = [pickSymbol(), pickSymbol(), pickSymbol()];

    // Animate each reel
    const durations = [700, 1000, 1350];
    const promises = results.map((sym, i) =>
      animateReel(els.reels[i], sym.icon, durations[i])
    );

    await Promise.all(promises);

    // Resolve payout
    const payout = computePayout(results, state.bet);
    state.lastPayout = payout;
    state.balance += payout;

    if (payout > 0) {
      announceWin(results, payout);
      els.reelBox.classList.remove("flash");
      void els.reelBox.offsetWidth;
      els.reelBox.classList.add("flash");
    } else {
      setMessage(pick(LOSS_MESSAGES), "loss");
    }

    save();
    spinning = false;
    render();
  }

  function animateReel(reelEl, finalIcon, durationMs) {
    return new Promise((resolve) => {
      buildStrip(reelEl, finalIcon);

      // After layout, compute target offset and animate.
      requestAnimationFrame(() => {
        const cellHeight = reelEl.firstChild.getBoundingClientRect().height;
        const targetY = -(REEL_CELLS - 1) * cellHeight;
        reelEl.style.transition = `transform ${durationMs}ms cubic-bezier(0.18, 0.9, 0.25, 1)`;
        reelEl.style.transform = `translateY(${targetY}px)`;

        const onEnd = () => {
          reelEl.removeEventListener("transitionend", onEnd);
          // Collapse strip to only the final symbol to free DOM.
          reelEl.style.transition = "none";
          reelEl.style.transform = "translateY(0)";
          reelEl.innerHTML = "";
          const cell = document.createElement("div");
          cell.className = "cell";
          cell.textContent = finalIcon;
          reelEl.appendChild(cell);
          resolve();
        };
        reelEl.addEventListener("transitionend", onEnd);
      });
    });
  }

  function computePayout(results, bet) {
    const [a, b, c] = results;
    if (a.icon === b.icon && b.icon === c.icon) {
      return bet * a.multiplier;
    }
    if (a.icon === b.icon || b.icon === c.icon || a.icon === c.icon) {
      return bet * 2;
    }
    return 0;
  }

  function announceWin(results, payout) {
    const [a, b, c] = results;
    const isJackpot = a.icon === b.icon && b.icon === c.icon;
    if (isJackpot) {
      const msg = WIN_MESSAGES[a.icon] || "You won. Somehow.";
      setMessage(`${msg} +${payout} tokens`, a.icon === "🤖" ? "jackpot" : "win");
    } else {
      setMessage(`${pick(PARTIAL_MESSAGES)} +${payout} tokens`, "win");
    }
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ---------- Bet controls ----------
  function changeBet(dir) {
    const idx = BET_OPTIONS.indexOf(state.bet);
    const next = Math.max(0, Math.min(BET_OPTIONS.length - 1, idx + dir));
    state.bet = BET_OPTIONS[next];
    save();
    render();
  }

  function maxBet() {
    // Highest bet that the player can actually afford (or lowest if broke).
    let chosen = BET_OPTIONS[0];
    for (const b of BET_OPTIONS) {
      if (b <= state.balance) chosen = b;
    }
    state.bet = chosen;
    save();
    render();
  }

  function beg() {
    if (state.balance >= 100) {
      setMessage("You have tokens. Dignity intact. Denied.", "loss");
      return;
    }
    state.balance += 100;
    setMessage(pick(BEG_MESSAGES), "win");
    save();
    render();
  }

  function reset() {
    if (!confirm("Factory reset the machine? Your balance and bet will be wiped.")) return;
    state.balance = 1000;
    state.bet = 25;
    state.lastPayout = 0;
    setMessage("Weights re-initialized. Good luck, researcher.");
    save();
    render();
  }

  // ---------- Wire up ----------
  els.spin.addEventListener("click", spin);
  els.betUp.addEventListener("click", () => changeBet(+1));
  els.betDown.addEventListener("click", () => changeBet(-1));
  els.maxBet.addEventListener("click", maxBet);
  els.beg.addEventListener("click", beg);
  els.reset.addEventListener("click", reset);

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.code === "Space" || e.key === "Enter") {
      e.preventDefault();
      spin();
    } else if (e.key === "ArrowUp") {
      changeBet(+1);
    } else if (e.key === "ArrowDown") {
      changeBet(-1);
    }
  });

  initialRender();
})();
