(() => {
  "use strict";

  const SYMBOLS = [
    { id: "gpu",    glyph: "🔥", name: "GPU FIRE",     meaning: "Melting a data center",        payout: 5,   weight: 6 },
    { id: "robot",  glyph: "🤖", name: "CHATBOT",      meaning: "Confidently wrong",            payout: 3,   weight: 10 },
    { id: "brain",  glyph: "🧠", name: "NEURAL NET",   meaning: "Black box, trust us",          payout: 4,   weight: 8 },
    { id: "money",  glyph: "💸", name: "BURN RATE",    meaning: "Investor tears",               payout: 6,   weight: 5 },
    { id: "token",  glyph: "🪙", name: "TOKEN",        meaning: "Now 10x more expensive",       payout: 2,   weight: 12 },
    { id: "bias",   glyph: "⚖️", name: "BIAS",         meaning: "Trained on reddit",            payout: 3,   weight: 8 },
    { id: "halu",   glyph: "👻", name: "HALLUCINATE",  meaning: "It made up a citation",        payout: -4,  weight: 9 },
    { id: "agi",    glyph: "👑", name: "A.G.I.",       meaning: "Always 2 years away",          payout: 20,  weight: 1 },
  ];

  const WIN_QUIPS = [
    "Series C secured! Investors weep with joy.",
    "The model achieved sentience. It wants a raise.",
    "Benchmark gamed successfully. Nature paper incoming.",
    "You have been added to the AI Safety Task Force (unpaid).",
    "Emergent behavior detected. (It just memorized the test set.)",
  ];
  const LOSS_QUIPS = [
    "The model hallucinated a victory. You did not win.",
    "Context window exceeded. Please buy more tokens.",
    "Alignment failure. Blame the intern.",
    "The GPU caught fire. Again.",
    "RLHF'd into compliance. Your wallet complied.",
  ];
  const NEAR_QUIPS = [
    "Two out of three. Just like our benchmark accuracy.",
    "So close! Have you considered fine-tuning your luck?",
    "Almost. Try prompting harder.",
  ];
  const AGI_QUIPS = [
    "A.G.I. ACHIEVED! (Internally. At a small scale. In a demo. Kind of.)",
    "Singularity jackpot! Sam is crying in a hot tub somewhere.",
  ];
  const HALU_QUIPS = [
    "Triple hallucination! It cited three papers that don't exist. −100 bonus burn.",
    "The model is now convinced it won. The math disagrees. −100 extra.",
  ];

  const state = {
    tokens: 1000,
    epoch: 0,
    burn: 0,
    spinning: false,
  };

  const $ = (id) => document.getElementById(id);
  const tokensEl = $("tokens");
  const burnEl = $("burnRate");
  const epochEl = $("epoch");
  const oracleEl = $("oracle");
  const spinBtn = $("spin");
  const bailoutBtn = $("bailout");
  const betSel = $("bet");
  const logEl = $("log");
  const reels = [$("reel0"), $("reel1"), $("reel2")];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function weightedPick() {
    const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * total;
    for (const sym of SYMBOLS) {
      r -= sym.weight;
      if (r <= 0) return sym;
    }
    return SYMBOLS[0];
  }

  function renderStats() {
    tokensEl.textContent = state.tokens;
    burnEl.textContent = state.burn;
    epochEl.textContent = state.epoch;
    if (state.tokens <= 0) {
      bailoutBtn.hidden = false;
      spinBtn.disabled = true;
      setOracle("You are out of tokens. Your startup has pivoted to 'blockchain'.");
    } else {
      bailoutBtn.hidden = true;
      spinBtn.disabled = state.spinning;
    }
  }

  function setOracle(text) {
    oracleEl.innerHTML = "";
    oracleEl.textContent = text;
  }

  function logEvent(text, cls) {
    const li = document.createElement("li");
    li.textContent = `#${state.epoch.toString().padStart(3, "0")}  ${text}`;
    if (cls) li.className = cls;
    logEl.prepend(li);
    while (logEl.children.length > 30) logEl.lastChild.remove();
  }

  function setReel(reelEl, sym, spinning) {
    reelEl.classList.toggle("reel--spinning", !!spinning);
    reelEl.classList.remove("reel--win");
    reelEl.firstElementChild.textContent = sym.glyph;
  }

  function flashWin(indexes) {
    indexes.forEach((i) => reels[i].classList.add("reel--win"));
  }

  function evaluate(result, bet) {
    const [a, b, c] = result;
    if (a.id === b.id && b.id === c.id) {
      if (a.id === "agi") {
        return { delta: bet * a.payout * 5, text: pick(AGI_QUIPS), kind: "win", idx: [0, 1, 2] };
      }
      if (a.id === "halu") {
        return {
          delta: bet * a.payout - 100,
          text: pick(HALU_QUIPS),
          kind: "loss",
          idx: [0, 1, 2],
        };
      }
      return {
        delta: bet * a.payout,
        text: `Triple ${a.name}! ${pick(WIN_QUIPS)}`,
        kind: a.payout > 0 ? "win" : "loss",
        idx: [0, 1, 2],
      };
    }

    const pairIdx =
      a.id === b.id ? [0, 1] :
      b.id === c.id ? [1, 2] :
      a.id === c.id ? [0, 2] : null;

    if (pairIdx) {
      const sym = result[pairIdx[0]];
      if (sym.payout < 0) {
        return {
          delta: -Math.round(bet * 0.5),
          text: `Two ${sym.name}. ${pick(LOSS_QUIPS)}`,
          kind: "loss",
          idx: pairIdx,
        };
      }
      return {
        delta: Math.round(bet * 1.5),
        text: `Two ${sym.name}. ${pick(NEAR_QUIPS)}`,
        kind: "win",
        idx: pairIdx,
      };
    }

    return { delta: -bet, text: pick(LOSS_QUIPS), kind: "loss", idx: [] };
  }

  function spin() {
    if (state.spinning) return;
    const bet = parseInt(betSel.value, 10);
    if (state.tokens < bet) {
      setOracle("Insufficient tokens. Please touch grass and try again.");
      return;
    }

    state.spinning = true;
    state.epoch += 1;
    state.tokens -= bet;
    state.burn += bet;
    renderStats();
    spinBtn.classList.add("spin-btn--pulled");
    setOracle("Spinning up the inference cluster...");

    const finalResult = [weightedPick(), weightedPick(), weightedPick()];
    const stopTimes = [700, 1100, 1500];
    const tickers = reels.map((r) => {
      r.classList.add("reel--spinning");
      return setInterval(() => {
        r.firstElementChild.textContent = weightedPick().glyph;
      }, 60);
    });

    reels.forEach((r, i) => {
      setTimeout(() => {
        clearInterval(tickers[i]);
        setReel(r, finalResult[i], false);
        if (i === reels.length - 1) finalize(finalResult, bet);
      }, stopTimes[i]);
    });
  }

  function finalize(result, bet) {
    const outcome = evaluate(result, bet);
    state.tokens += outcome.delta;
    if (outcome.delta < 0) state.burn += -outcome.delta;
    state.spinning = false;
    spinBtn.classList.remove("spin-btn--pulled");

    if (outcome.idx.length) flashWin(outcome.idx);

    const sign = outcome.delta >= 0 ? "+" : "";
    const line = `${outcome.text}  (${sign}${outcome.delta} tokens)`;
    setOracle(line);
    logEvent(
      `${result.map((s) => s.glyph).join(" ")}  ${sign}${outcome.delta}`,
      outcome.kind
    );
    renderStats();
  }

  function bailout() {
    state.tokens += 500;
    state.burn = 0;
    setOracle("Bailout approved. The taxpayers thank you for your innovation.");
    logEvent("SERIES A BAILOUT  +500", "win");
    renderStats();
  }

  function renderPaytable() {
    const body = document.getElementById("paytableBody");
    SYMBOLS.forEach((s) => {
      const tr = document.createElement("tr");
      const payout = s.payout > 0 ? `${s.payout}x bet` : `${s.payout}x (loss)`;
      tr.innerHTML =
        `<td>${s.glyph}</td>` +
        `<td><strong>${s.name}</strong><br><small>${s.meaning}</small></td>` +
        `<td>${payout}</td>`;
      body.appendChild(tr);
    });
  }

  function handleKey(e) {
    if (e.code === "Space" && !state.spinning && !spinBtn.disabled) {
      e.preventDefault();
      spin();
    }
  }

  spinBtn.addEventListener("click", spin);
  bailoutBtn.addEventListener("click", bailout);
  document.addEventListener("keydown", handleKey);
  renderPaytable();
  renderStats();
})();
