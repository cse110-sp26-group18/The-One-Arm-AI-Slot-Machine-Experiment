(() => {
  const SYMBOLS = [
    { key: "AGI",   label: "AGI",   weight: 1,  payout: 250 },
    { key: "GPT",   label: "GPT",   weight: 4,  payout: 25  },
    { key: "LLM",   label: "LLM",   weight: 5,  payout: 15  },
    { key: "HYPE",  label: "HYPE",  weight: 6,  payout: 10  },
    { key: "PRMPT", label: "🪄",    weight: 6,  payout: 8   },
    { key: "BIAS",  label: "BIAS",  weight: 5,  payout: 5   },
    { key: "404",   label: "404",   weight: 5,  payout: -3  },
    { key: "BUG",   label: "🐛",    weight: 7,  payout: -5  },
  ];

  const WIN_QUOTES = {
    AGI:   ["AGI achieved (in a JSON file).", "The singularity is in beta.", "Congrats, you've unionized the paperclips."],
    GPT:   ["Ship it to prod, nobody will notice.", "Plausible tokens detected.", "Your pitch deck thanks you."],
    LLM:   ["Three L's, one M, infinite vibes.", "Context window: filled with hopium.", "The model says yes to everything."],
    HYPE:  ["Valuation just 10x'd on a tweet.", "Series Z, baby.", "Add 'AI' to the name, double the raise."],
    PRMPT: ["You are now a Prompt Engineer.", "Please think step-by-step — it worked!", "Prompt injected successfully."],
    BIAS:  ["At least it's consistent.", "The training data remembers.", "Bias-as-a-Service subscription activated."],
  };

  const LOSS_QUOTES = {
    "404": [
      "Model not found. Have you tried turning capitalism off and on?",
      "404: Sentience missing.",
      "The endpoint ghosted you.",
    ],
    BUG: [
      "It's not a bug, it's an emergent behavior.",
      "The model confidently made that up.",
      "Your GPU is crying in Celsius.",
    ],
    MIXED: [
      "Mid-tier hallucination. Try again.",
      "The model said 'As an AI language model…' and charged you $0.03.",
      "Tokens burned for no measurable output. Classic.",
      "That was a lot of compute to learn nothing.",
      "The reels disagree. So does the board.",
    ],
  };

  const BROKE_QUOTES = [
    "Out of tokens. Just like your free tier.",
    "Runway exhausted. Pivot to blockchain?",
    "Insufficient funds. Try scraping Reddit harder.",
  ];

  const STRIP_LENGTH = 40;
  const CELL_HEIGHT = 60;
  const SPIN_DURATION = [1100, 1500, 1900];

  const state = {
    tokens: 100,
    bet: 5,
    burn: 0,
    spinning: false,
  };

  const weightedPool = SYMBOLS.flatMap(s => Array(s.weight).fill(s));
  const randSym = () => weightedPool[Math.floor(Math.random() * weightedPool.length)];

  const $ = id => document.getElementById(id);
  const tokensEl = $("tokens");
  const betEl = $("bet");
  const burnEl = $("burn");
  const messageEl = $("message");
  const spinBtn = $("spin");
  const maxBtn = $("max");
  const bailoutBtn = $("bailout");
  const reels = [...document.querySelectorAll(".reel")];
  const reelsSection = $("reels");

  function buildStrip(reel, finalSym) {
    const strip = reel.querySelector(".strip");
    strip.innerHTML = "";
    strip.style.transition = "none";
    strip.style.transform = "translateY(0)";
    const symbols = [];
    for (let i = 0; i < STRIP_LENGTH; i++) symbols.push(randSym());
    symbols[STRIP_LENGTH - 2] = finalSym;
    symbols.forEach(s => {
      const cell = document.createElement("div");
      cell.className = `cell sym-${s.key}`;
      cell.textContent = s.label;
      strip.appendChild(cell);
    });
    return strip;
  }

  function spinReel(reel, finalSym, duration) {
    const strip = buildStrip(reel, finalSym);
    const reelHeight = reel.clientHeight;
    const centerOffset = (reelHeight - CELL_HEIGHT) / 2;
    const targetY = -((STRIP_LENGTH - 2) * CELL_HEIGHT - centerOffset);
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        strip.style.transition = `transform ${duration}ms cubic-bezier(0.18, 0.89, 0.25, 1.05)`;
        strip.style.transform = `translateY(${targetY}px)`;
        setTimeout(resolve, duration + 20);
      });
    });
  }

  function renderHud() {
    tokensEl.textContent = state.tokens;
    betEl.textContent = state.bet;
    burnEl.textContent = state.burn;
    spinBtn.disabled = state.spinning || state.tokens < state.bet;
    maxBtn.disabled = state.spinning || state.tokens < 25;
    if (state.tokens <= 0 && !state.spinning) {
      bailoutBtn.hidden = false;
    }
  }

  function setMessage(text, cls = "") {
    messageEl.className = "";
    messageEl.textContent = text;
    if (cls) messageEl.classList.add(cls);
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function evaluate(results) {
    const [a, b, c] = results;
    if (a.key === b.key && b.key === c.key) {
      const mult = a.payout;
      return { kind: "triple", sym: a, mult };
    }
    if (a.key === b.key || b.key === c.key || a.key === c.key) {
      const pairKey = a.key === b.key ? a.key : (b.key === c.key ? b.key : a.key);
      const sym = SYMBOLS.find(s => s.key === pairKey);
      const mult = sym.payout > 0 ? Math.ceil(sym.payout * 0.3) : Math.ceil(sym.payout * 0.5);
      return { kind: "pair", sym, mult };
    }
    return { kind: "none", sym: null, mult: 0 };
  }

  async function spin() {
    if (state.spinning || state.tokens < state.bet) return;
    state.spinning = true;
    state.tokens -= state.bet;
    state.burn += state.bet;
    setMessage("Compiling vibes… streaming tokens…");
    renderHud();

    const results = [randSym(), randSym(), randSym()];
    await Promise.all(
      reels.map((r, i) => spinReel(r, results[i], SPIN_DURATION[i]))
    );

    const outcome = evaluate(results);
    if (outcome.kind === "triple" && outcome.mult > 0) {
      const winnings = state.bet * outcome.mult;
      state.tokens += winnings;
      reelsSection.classList.add("flash");
      setTimeout(() => reelsSection.classList.remove("flash"), 650);
      setMessage(
        `JACKPOT (${outcome.sym.key})! +${winnings} tokens. ${pick(WIN_QUOTES[outcome.sym.key] || ["Nice."])}`,
        "win"
      );
    } else if (outcome.kind === "triple" && outcome.mult < 0) {
      const loss = Math.min(state.tokens, state.bet * Math.abs(outcome.mult));
      state.tokens -= loss;
      state.burn += loss;
      reelsSection.classList.add("shake");
      setTimeout(() => reelsSection.classList.remove("shake"), 450);
      const quotes = LOSS_QUOTES[outcome.sym.key] || LOSS_QUOTES.MIXED;
      setMessage(`CATASTROPHIC ${outcome.sym.key}! −${loss} tokens. ${pick(quotes)}`, "crit");
    } else if (outcome.kind === "pair" && outcome.mult > 0) {
      const winnings = state.bet * outcome.mult;
      state.tokens += winnings;
      setMessage(
        `Pair of ${outcome.sym.key}. +${winnings} tokens. ${pick(WIN_QUOTES[outcome.sym.key] || ["Acceptable output."])}`,
        "win"
      );
    } else if (outcome.kind === "pair" && outcome.mult < 0) {
      const loss = Math.min(state.tokens, state.bet * Math.abs(outcome.mult));
      state.tokens -= loss;
      state.burn += loss;
      const quotes = LOSS_QUOTES[outcome.sym.key] || LOSS_QUOTES.MIXED;
      setMessage(`Pair of ${outcome.sym.key}. −${loss} tokens. ${pick(quotes)}`, "loss");
    } else {
      setMessage(pick(LOSS_QUOTES.MIXED), "loss");
    }

    state.spinning = false;
    if (state.tokens <= 0) {
      state.tokens = 0;
      setMessage(`${messageEl.textContent} — ${pick(BROKE_QUOTES)}`, "crit");
    }
    renderHud();
  }

  function changeBet(delta) {
    if (state.spinning) return;
    const next = Math.max(1, Math.min(25, state.bet + delta));
    state.bet = next;
    renderHud();
  }

  function maxHype() {
    if (state.spinning) return;
    state.bet = Math.min(25, Math.max(1, state.tokens >= 25 ? 25 : state.tokens));
    renderHud();
    spin();
  }

  function bailout() {
    state.tokens += 50;
    state.burn = 0;
    bailoutBtn.hidden = true;
    setMessage("An anonymous VC just wired 50 tokens. They expect a demo by Friday.", "win");
    renderHud();
  }

  function buildPaytable() {
    const list = $("paytable");
    SYMBOLS.forEach(s => {
      const li = document.createElement("li");
      const sign = s.payout > 0 ? "×" : "penalty ×";
      const cls = s.payout > 0 ? "" : "bad";
      li.innerHTML = `<span class="sym sym-${s.key}">${s.label} ${s.label !== s.key ? `(${s.key})` : ""}</span>
                      <span class="mult ${cls}">${sign}${Math.abs(s.payout)}</span>`;
      list.appendChild(li);
    });
  }

  function seedReels() {
    reels.forEach(r => buildStrip(r, randSym()));
    reels.forEach(r => {
      const strip = r.querySelector(".strip");
      const centerOffset = (r.clientHeight - CELL_HEIGHT) / 2;
      strip.style.transform = `translateY(${-((STRIP_LENGTH - 2) * CELL_HEIGHT - centerOffset)}px)`;
    });
  }

  spinBtn.addEventListener("click", spin);
  maxBtn.addEventListener("click", maxHype);
  bailoutBtn.addEventListener("click", bailout);
  $("bet-up").addEventListener("click", () => changeBet(1));
  $("bet-down").addEventListener("click", () => changeBet(-1));
  document.addEventListener("keydown", e => {
    if (e.code === "Space") { e.preventDefault(); spin(); }
    if (e.key === "ArrowUp") changeBet(1);
    if (e.key === "ArrowDown") changeBet(-1);
  });

  buildPaytable();
  seedReels();
  renderHud();
})();
