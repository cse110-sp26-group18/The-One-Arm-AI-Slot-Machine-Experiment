const SYMBOLS = [
  { emoji: '🧠', label: 'Brain', weight: 5 },
  { emoji: '🤖', label: 'Robot', weight: 5 },
  { emoji: '💬', label: 'Prompt', weight: 5 },
  { emoji: '📉', label: 'Context Window', weight: 4 },
  { emoji: '🪙', label: 'Token', weight: 3 },
  { emoji: '🔥', label: 'GPU Fire', weight: 2 },
  { emoji: '🎯', label: 'Alignment', weight: 1 },
];

const WIN_MESSAGES = [
  "Wow, the AI actually got something right for once! 🎉",
  "Congratulations! Your hallucination was statistically profitable!",
  "You won tokens! Please don't ask the AI what to do with them.",
  "JACKPOT! The model is 97.3% confident you're a winner. (It's wrong 40% of the time.)",
  "You beat the machine! The machine is currently updating its priors.",
];

const LOSE_MESSAGES = [
  "Sorry, the AI confidently predicted you would win. As usual, it was wrong.",
  "You lost tokens. The AI has no regrets — it doesn't feel anything.",
  "Insufficient tokens detected. Have you tried paying $20/month for better luck?",
  "Loss confirmed. The AI is generating a 3-paragraph apology you didn't ask for.",
  "Your tokens have been redistributed to train the next model. You're welcome.",
  "No match. The AI would explain why, but it would just make something up.",
];

const BROKE_MESSAGES = [
  "You're out of tokens. The AI has consumed them all. This is fine. 🔥",
  "Bankrupt! The model has achieved its true purpose: taking all your tokens.",
  "No tokens left. Have you considered prompting the void?",
];

let tokens = 100;

function weightedRandom(symbols) {
  const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
  let r = Math.random() * totalWeight;
  for (const s of symbols) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return symbols[symbols.length - 1];
}

function randomMessage(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function updateTokenDisplay() {
  document.getElementById('token-count').textContent = tokens;
}

function addHistory(text, isWin) {
  const list = document.getElementById('history-list');
  const li = document.createElement('li');
  li.textContent = text;
  li.className = isWin ? 'win-entry' : 'lose-entry';
  list.prepend(li);
  if (list.children.length > 10) list.lastChild.remove();
}

function spin() {
  const betInput = document.getElementById('bet');
  const bet = parseInt(betInput.value, 10);
  const btn = document.getElementById('spin-btn');
  const msgEl = document.getElementById('message');

  if (isNaN(bet) || bet < 1) {
    msgEl.textContent = 'Please enter a valid bet.';
    msgEl.className = 'message lose';
    return;
  }

  if (bet > tokens) {
    msgEl.textContent = "You don't have enough tokens. The AI judged you.";
    msgEl.className = 'message lose';
    return;
  }

  if (tokens <= 0) {
    msgEl.textContent = randomMessage(BROKE_MESSAGES);
    msgEl.className = 'message lose';
    return;
  }

  btn.disabled = true;
  tokens -= bet;
  updateTokenDisplay();

  const reels = [
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
    document.getElementById('reel-3'),
  ];

  reels.forEach(r => r.classList.add('spinning'));
  msgEl.textContent = 'Consulting the oracle... (latency: high)';
  msgEl.className = 'message';

  const results = [weightedRandom(SYMBOLS), weightedRandom(SYMBOLS), weightedRandom(SYMBOLS)];
  const delays = [600, 900, 1200];

  results.forEach((sym, i) => {
    setTimeout(() => {
      reels[i].textContent = sym.emoji;
      reels[i].classList.remove('spinning');
    }, delays[i]);
  });

  setTimeout(() => {
    const [a, b, c] = results;
    const isJackpot = a.label === b.label && b.label === c.label;
    const isPartial = a.label === b.label || b.label === c.label || a.label === c.label;

    let winAmount = 0;
    let historyText = '';

    if (isJackpot) {
      winAmount = bet * 5;
      tokens += winAmount;
      msgEl.textContent = `JACKPOT! ${a.emoji}${b.emoji}${c.emoji} — ${randomMessage(WIN_MESSAGES)} (+${winAmount} tokens)`;
      msgEl.className = 'message win';
      historyText = `JACKPOT! ${a.emoji}${b.emoji}${c.emoji} +${winAmount}`;
      addHistory(historyText, true);
    } else if (isPartial) {
      winAmount = bet * 2;
      tokens += winAmount;
      msgEl.textContent = `Partial match! ${a.emoji}${b.emoji}${c.emoji} — ${randomMessage(WIN_MESSAGES)} (+${winAmount} tokens)`;
      msgEl.className = 'message win';
      historyText = `Match! ${a.emoji}${b.emoji}${c.emoji} +${winAmount}`;
      addHistory(historyText, true);
    } else {
      msgEl.textContent = `${a.emoji}${b.emoji}${c.emoji} — ${randomMessage(LOSE_MESSAGES)} (-${bet} tokens)`;
      msgEl.className = 'message lose';
      historyText = `Loss ${a.emoji}${b.emoji}${c.emoji} -${bet}`;
      addHistory(historyText, false);
    }

    updateTokenDisplay();

    if (tokens <= 0) {
      tokens = 0;
      updateTokenDisplay();
      msgEl.textContent = randomMessage(BROKE_MESSAGES);
      msgEl.className = 'message lose';
      btn.disabled = true;
    } else {
      btn.disabled = false;
    }
  }, 1400);
}
