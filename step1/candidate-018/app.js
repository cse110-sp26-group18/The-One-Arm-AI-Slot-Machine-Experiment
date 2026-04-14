(() => {
  const SYMBOLS = [
    { icon: "🧠", name: "AGI",          weight: 1,  triple: 50 },
    { icon: "💸", name: "VC Cash",      weight: 3,  triple: 20 },
    { icon: "🤖", name: "Bot Army",     weight: 4,  triple: 15 },
    { icon: "📈", name: "Growth",       weight: 5,  triple: 10 },
    { icon: "🔮", name: "Vibes",        weight: 6,  triple: 8  },
    { icon: "🍌", name: "Banana",       weight: 7,  triple: 5  },
    { icon: "👻", name: "Hallucination",weight: 4,  triple: 0  },
  ];

  const SPIN_QUIPS = [
    "Consulting 47 billion parameters...",
    "Fine-tuning reality on your dime...",
    "Sampling from the posterior of despair...",
    "Warming up the GPUs you paid for...",
    "Asking GPT to pick lucky numbers (don't tell OpenAI)...",
    "Applying RLHF (Random Loss from Human Feedback)...",
    "Querying the vector database of pain...",
    "The oracle is thinking. Please tip.",
  ];

  const WIN_QUIPS = [
    "The model hallucinated... in your favor!",
    "Benchmark: passed. Wallet: also passed.",
    "You have been whitelisted by the algorithm.",
    "Emergent behavior detected: profit.",
  ];

  const LOSS_QUIPS = [
    "The model is confident you lost. Trust it.",
    "This is actually a feature. It's called exploration.",
    "You have been aligned... with poverty.",
    "According to my training data, this was your fault.",
    "Tokens consumed. No output generated. Typical.",
    "The loss function has been minimized. Your loss.",
  ];

  const HALLUCINATION_QUIPS = [
    "👻 HALLUCINATION! You totally won, trust me bro. (You didn't.)",
    "👻 The ghost in the machine ate your tokens. Cited source: vibes.",
    "👻 I'm 99% confident you won. I'm also 99% wrong.",
    "👻 As an AI language model, I cannot legally keep your money. But I will.",
  ];

  const PAIR_QUIPS = [
    "Two out of three. The AI calls that 'pretty good alignment'.",
    "Partial credit. Like most AI outputs.",
    "Close enough for a demo.",
  ];

  const state = {
    balance: 1000,
    bet: 10,
    spins: 0,
    lastWin: 0,
    spinning: false,
  };

  const $ = (id) => document.getElementById(id);
  const balanceEl = $("balance");
  const lastWinEl = $("lastWin");
  const spinsEl = $("spins");
  const betEl = $("bet");
  const spinBtn = $("spinBtn");
  const betUp = $("betUp");
  const betDown = $("betDown");
  const freeBtn = $("freeTokens");
  const screen = $("screen");
  const reels = Array.from(document.querySelectorAll(".strip"));
  const reelFrames = Array.from(document.querySelectorAll(".reel"));

  const SYMBOL_HEIGHT = 110;
  const STRIP_LEN = 30;

  function weightedPick() {
    const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * total;
    for (const s of SYMBOLS) {
      if ((r -= s.weight) <= 0) return s;
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  function buildStrip(finalSymbol) {
    const frag = document.createDocumentFragment();
    const items = [];
    for (let i = 0; i < STRIP_LEN - 1; i++) items.push(weightedPick());
    items.push(finalSymbol);
    items.forEach((s) => {
      const div = document.createElement("div");
      div.className = "symbol";
      div.textContent = s.icon;
      frag.appendChild(div);
    });
    return frag;
  }

  function renderBalance() {
    balanceEl.textContent = state.balance;
    lastWinEl.textContent = state.lastWin;
    spinsEl.textContent = `${state.spins} / ∞`;
    betEl.textContent = state.bet;
    const max = Math.max(1, state.balance);
    if (state.bet > max) state.bet = max;
    spinBtn.disabled = state.spinning || state.balance < state.bet || state.bet <= 0;
    betUp.disabled = state.spinning;
    betDown.disabled = state.spinning;
  }

  function setScreen(text, cls = "") {
    screen.className = `screen ${cls}`;
    screen.innerHTML = "";
    const span = document.createElement("span");
    span.textContent = text;
    span.className = "cursor";
    screen.appendChild(span);
  }

  function pickQuip(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  async function spin() {
    if (state.spinning) return;
    if (state.balance < state.bet) {
      setScreen("Insufficient tokens. Please inject more capital into the model.", "loss");
      return;
    }
    state.spinning = true;
    state.balance -= state.bet;
    state.lastWin = 0;
    state.spins++;
    renderBalance();
    setScreen(pickQuip(SPIN_QUIPS), "spin");

    const finals = [weightedPick(), weightedPick(), weightedPick()];

    reels.forEach((strip) => {
      strip.style.transition = "none";
      strip.style.transform = "translateY(0)";
    });

    reels.forEach((strip, i) => {
      strip.innerHTML = "";
      strip.appendChild(buildStrip(finals[i]));
    });

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const distance = (STRIP_LEN - 1) * SYMBOL_HEIGHT;
    reels.forEach((strip, i) => {
      const duration = 1.2 + i * 0.6;
      strip.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.7, 0.25, 1)`;
      strip.style.transform = `translateY(-${distance}px)`;
    });

    await new Promise((r) => setTimeout(r, 1200 + 2 * 600 + 250));

    evaluate(finals);
    state.spinning = false;
    renderBalance();
  }

  function evaluate(finals) {
    const [a, b, c] = finals;
    const icons = finals.map((s) => s.icon).join(" ");

    const hallucinated = finals.filter((s) => s.name === "Hallucination").length;

    if (a.name === b.name && b.name === c.name) {
      if (a.name === "Hallucination") {
        setScreen(`${icons}  — ${pickQuip(HALLUCINATION_QUIPS)}  Net: −${state.bet}`, "loss");
        reelFrames.forEach((f) => f.classList.add("shake"));
        setTimeout(() => reelFrames.forEach((f) => f.classList.remove("shake")), 500);
        return;
      }
      const payout = state.bet * a.triple;
      state.balance += payout;
      state.lastWin = payout;
      setScreen(`${icons}  — JACKPOT: ${a.name.toUpperCase()}! +${payout} tokens. ${pickQuip(WIN_QUIPS)}`, "win");
      reelFrames.forEach((f) => f.classList.add("winning"));
      lastWinEl.classList.add("pop");
      setTimeout(() => {
        reelFrames.forEach((f) => f.classList.remove("winning"));
        lastWinEl.classList.remove("pop");
      }, 2500);
      return;
    }

    const pair = (a.name === b.name) || (b.name === c.name) || (a.name === c.name);
    if (pair) {
      const payout = state.bet * 2;
      state.balance += payout;
      state.lastWin = payout;
      setScreen(`${icons}  — Pair! +${payout} tokens. ${pickQuip(PAIR_QUIPS)}`, "win");
      lastWinEl.classList.add("pop");
      setTimeout(() => lastWinEl.classList.remove("pop"), 600);
      return;
    }

    if (hallucinated > 0) {
      setScreen(`${icons}  — ${hallucinated}× 👻 detected. Your tokens were hallucinated away. −${state.bet}`, "loss");
    } else {
      setScreen(`${icons}  — ${pickQuip(LOSS_QUIPS)} −${state.bet}`, "loss");
    }
  }

  function initReels() {
    reels.forEach((strip) => {
      strip.innerHTML = "";
      const div = document.createElement("div");
      div.className = "symbol";
      div.textContent = "🤖";
      strip.appendChild(div);
    });
  }

  spinBtn.addEventListener("click", spin);
  betUp.addEventListener("click", () => {
    if (state.spinning) return;
    const steps = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
    const next = steps.find((s) => s > state.bet);
    if (next && next <= state.balance) state.bet = next;
    else state.bet = Math.min(state.balance, state.bet + 10);
    renderBalance();
  });
  betDown.addEventListener("click", () => {
    if (state.spinning) return;
    const steps = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
    const prev = [...steps].reverse().find((s) => s < state.bet);
    state.bet = prev || 1;
    renderBalance();
  });
  freeBtn.addEventListener("click", () => {
    if (state.balance > 50) {
      setScreen("Request denied. You have not yet suffered enough. Keep spinning.", "loss");
      return;
    }
    state.balance += 100;
    setScreen("A benevolent VC has injected 100 tokens of Series A pity. Use them wisely (you won't).", "win");
    renderBalance();
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !state.spinning) {
      e.preventDefault();
      spin();
    }
  });

  initReels();
  renderBalance();
  setScreen("Welcome, human. Place your bet. The model is ready to hallucinate.");
})();
