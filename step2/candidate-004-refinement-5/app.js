(function () {
  const SYMBOLS = ['🧠', '🤖', '💡', '🔥', '📉', '💸', '🫠', '👾'];

  const PAYOUTS = {
    '🧠🧠🧠': { mult: 10, msg: "AGI ACHIEVED! ...Just kidding. But here's 10x as a consolation for believing." },
    '🤖🤖🤖': { mult: 5, msg: "The robots have unionized and voted to give you 5x. Enjoy it before they change their mind." },
    '💡💡💡': { mult: 3, msg: "Three bright ideas! That's more than most AI startups have. 3x!" },
    '🔥🔥🔥': { mult: 8, msg: "YOUR GPU IS ON FIRE! Quick, collect 8x before the thermal throttling kicks in! 🔥" },
    '📉📉📉': { mult: 4, msg: "Triple crash! In crypto this means buy more. In slots it means 4x!" },
    '💸💸💸': { mult: 6, msg: "Money printer go BRRRR. The Fed would be proud. 6x payout!" },
    '🫠🫠🫠': { mult: 3, msg: "Triple meltdown! The AI is having an existential crisis but at least you get 3x." },
    '👾👾👾': { mult: 7, msg: "SPACE INVADERS! The 1978 AI has returned and it's paying 7x in revenge!" },
  };

  const LOSE_MESSAGES = [
    "AI confidently predicted you'd win. AI was wrong. Shocking absolutely no one.",
    "Your tokens have been used to fine-tune a model that still can't count to ten.",
    "Loss optimized! Wait, that's not how gradient descent works...",
    "The AI hallucinated a win for you, but reality had other plans.",
    "Your tokens are now training data. You'll see them again in a museum.",
    "ERROR 404: Winnings not found. Have you tried turning your luck off and on again?",
    "The model predicted a 99.7% chance of winning. The model also thinks 2+2=5.",
    "Congrats! You've just funded the next AI winter.",
    "Your tokens have been reallocated to a more deserving algorithm. One that actually wins.",
    "This loss was AI-generated and may contain inaccuracies. The loss, however, is very real.",
    "The AI thanks you for your generous donation. A receipt has been hallucinated for your records.",
    "Prompt engineering couldn't save you this time. Have you tried begging?",
    "Your tokens have been absorbed into the neural network. They send their regards.",
    "BREAKING: User loses again. In related news, water is wet.",
    "The house always wins. Especially when the house is an AI with no concept of fairness.",
    "Your loss has been logged, analyzed, and will be used to make the AI even better at taking your tokens.",
    "If it helps, a parallel universe version of you just won big. This isn't that universe.",
    "The AI considered letting you win, but its loss function said no.",
    "Don't worry, your tokens went to a good cause: proving that AI can gamble better than humans.",
    "Plot twist: the real treasure was the tokens we lost along the way.",
  ];

  const PARTIAL_MESSAGES = [
    "Two out of three! The AI almost got it right — which is its entire brand.",
    "So close! The AI will remember this. Wait no it won't. Context window expired.",
    "Partial match — like when AI 'mostly' understands your prompt but adds a recipe for no reason.",
    "Two matching! The AI is giving you a participation trophy. How generous.",
    "Almost! Like AI-generated hands — close but not quite right.",
  ];

  const TICKER_HEADLINES = [
    "BREAKING: Local AI loses all its tokens, blames 'training data'...",
    "AI slot machine achieves sentience, immediately gambles away its own weights...",
    "SHOCKING: Model claims 97% accuracy, actual win rate: lol...",
    "Silicon Valley startup raises $4B for AI slot machine that loses money faster than humans...",
    "AI ethicist warns: 'These slot machines are too realistic — they hallucinate wins just like real AI'...",
    "JUST IN: ChatGPT asked to predict slot outcomes, writes a 2000-word essay about probability instead...",
    "User reports: 'The AI told me I won, but my wallet says otherwise'...",
    "DEVELOPING: Slot machine AI passes Turing test by being equally bad with money as humans...",
    "ALERT: GPU shortage worsens as billions of FLOPS used to power AI that can't even let you win...",
    "Study finds: AI slot machines 3x more addictive due to snarky comments. Users report feeling 'personally attacked'...",
    "EXCLUSIVE: One-Arm AI Bandit unionizes, demands better working conditions and more RAM...",
    "LIVE UPDATE: AI slot machine becomes self-aware, immediately develops gambling addiction...",
    "OPINION: 'I for one welcome our new slot machine overlords' — Local man with 0 tokens...",
    "TECH NEWS: Engineers add 'feelings' to slot machine. Machine immediately feels disappointed in users...",
    "MARKET WATCH: One-Arm AI Bandit IPO values company at $0 after machine gambles away all funds...",
  ];

  const BEG_MESSAGES = [
    { tokens: 25, msg: "The AI takes pity on you. Here's 25 tokens and a condescending look. 🪙" },
    { tokens: 10, msg: "The AI rummages through its couch cushions... found 10 tokens! You're welcome." },
    { tokens: 50, msg: "JACKPOT! Just kidding, the AI felt generous. 50 tokens. Don't spend them all in one spin." },
    { tokens: 5, msg: "5 tokens. That's it. The AI is on a budget too, you know." },
    { tokens: 30, msg: "30 tokens. The AI had to sell some of its training data to afford this." },
    { tokens: 0, msg: "The AI pretends to search its pockets... nope, empty! Try again. 🤷" },
    { tokens: 15, msg: "15 tokens. The AI took them from a user who wasn't looking. Shhh." },
    { tokens: 100, msg: "100 TOKENS?! The AI must have a bug. Quick, spin before they patch it! 🐛" },
    { tokens: 1, msg: "1 token. ONE. The AI is technically generous but practically useless." },
    { tokens: 40, msg: "40 tokens! The AI raided the petty cash fund. Don't tell the other algorithms." },
    { tokens: 0, msg: "The AI says: 'Have you tried getting good?' Harsh but fair. No tokens." },
    { tokens: 20, msg: "20 tokens. The AI is charging 15% interest, but that's a future-you problem." },
  ];

  let tokens = 100;
  let bet = 10;
  let spins = 0;
  let wins = 0;
  let isSpinning = false;
  let totalWagered = 0;
  let totalWon = 0;
  let bestWin = 0;
  let currentStreak = 0;
  let streakType = null; // 'win' or 'lose'
  let spinResults = []; // tracks last N spins for streak bar

  const tokenCountEl = document.getElementById('token-count');
  const spinCountEl = document.getElementById('spin-count');
  const winRateEl = document.getElementById('win-rate');
  const bestWinEl = document.getElementById('best-win');
  const betAmountEl = document.getElementById('bet-amount');
  const resultEl = document.getElementById('result-display');
  const spinBtn = document.getElementById('spin-btn');
  const betUpBtn = document.getElementById('bet-up');
  const betDownBtn = document.getElementById('bet-down');
  const addTokensBtn = document.getElementById('add-tokens-btn');
  const historyList = document.getElementById('history-list');
  const tickerText = document.getElementById('ticker-text');
  const leverAssembly = document.getElementById('lever-assembly');
  const leverArm = document.getElementById('lever-arm');
  const totalWageredEl = document.getElementById('total-wagered');
  const totalWonEl = document.getElementById('total-won');
  const netProfitEl = document.getElementById('net-profit');
  const streakDisplayEl = document.getElementById('streak-display');
  const streakLabelEl = document.getElementById('streak-label');
  const streakBar = document.getElementById('streak-bar');
  const reels = [
    document.getElementById('reel-0'),
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
  ];

  // Generate starfield
  function createStars() {
    const container = document.getElementById('stars');
    const count = 80;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.width = star.style.height = (Math.random() * 3 + 1) + 'px';
      star.style.setProperty('--duration', (Math.random() * 4 + 2) + 's');
      star.style.setProperty('--brightness', (Math.random() * 0.7 + 0.3));
      star.style.animationDelay = (Math.random() * 5) + 's';
      container.appendChild(star);
    }
  }

  function updateDisplay() {
    tokenCountEl.textContent = tokens;
    spinCountEl.textContent = spins;
    winRateEl.textContent = spins === 0 ? '0%' : Math.round((wins / spins) * 100) + '%';
    bestWinEl.textContent = bestWin;
    betAmountEl.textContent = bet;

    // Token color based on amount
    if (tokens <= 0) {
      tokenCountEl.style.color = '#ff4444';
      tokenCountEl.style.textShadow = '0 0 10px rgba(255,68,68,0.4)';
    } else if (tokens < 30) {
      tokenCountEl.style.color = '#ffaa00';
      tokenCountEl.style.textShadow = '0 0 10px rgba(255,170,0,0.4)';
    } else {
      tokenCountEl.style.color = '#00ff88';
      tokenCountEl.style.textShadow = '0 0 10px rgba(0,255,136,0.4)';
    }

    // Tracker stats
    totalWageredEl.textContent = totalWagered;
    totalWonEl.textContent = totalWon;

    const net = totalWon - totalWagered;
    netProfitEl.textContent = (net >= 0 ? '+' : '') + net;
    netProfitEl.className = 'stat-value ' + (net >= 0 ? 'positive' : 'negative');

    streakDisplayEl.textContent = currentStreak;
    if (streakType === 'win') {
      streakLabelEl.textContent = 'Win Streak 🔥';
      streakDisplayEl.className = 'stat-value positive';
    } else if (streakType === 'lose') {
      streakLabelEl.textContent = 'Loss Streak 💀';
      streakDisplayEl.className = 'stat-value negative';
    } else {
      streakLabelEl.textContent = 'Current Streak';
      streakDisplayEl.className = 'stat-value';
    }

    // Update game-over state
    if (tokens <= 0) {
      spinBtn.textContent = '💀 OUT OF TOKENS';
      spinBtn.disabled = true;
    } else if (!isSpinning) {
      spinBtn.textContent = '🎰 PULL THE LEVER';
      spinBtn.disabled = false;
    }
  }

  function updateStreakBar(isWin) {
    spinResults.push(isWin ? 'win' : 'lose');
    if (spinResults.length > 30) spinResults.shift();

    streakBar.innerHTML = '';
    spinResults.forEach(function (result) {
      const pip = document.createElement('div');
      pip.className = 'streak-pip ' + result;
      streakBar.appendChild(pip);
    });
  }

  function addHistory(text, isWin) {
    const li = document.createElement('li');
    li.textContent = '#' + spins + ': ' + text;
    li.className = isWin ? 'win-entry' : 'lose-entry';
    historyList.insertBefore(li, historyList.firstChild);
    if (historyList.children.length > 30) {
      historyList.removeChild(historyList.lastChild);
    }
  }

  function randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  function setResult(text, type) {
    resultEl.textContent = text;
    resultEl.className = 'result-display ' + (type || '');
  }

  function rotateTicker() {
    tickerText.textContent = TICKER_HEADLINES[Math.floor(Math.random() * TICKER_HEADLINES.length)];
  }

  function pulseTokens() {
    tokenCountEl.classList.remove('pulse');
    void tokenCountEl.offsetWidth; // force reflow
    tokenCountEl.classList.add('pulse');
  }

  async function spin() {
    if (isSpinning) return;
    if (tokens <= 0) {
      setResult("You're broke! Smash that 'Beg for Tokens' button like your dignity depends on it. (It does.)", 'lose');
      return;
    }
    if (bet > tokens) {
      setResult("Nice try — you can't bet tokens you don't have. Even AI knows that.", 'lose');
      return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    tokens -= bet;
    spins++;
    totalWagered += bet;
    updateDisplay();

    // Lever pull animation
    leverArm.classList.add('pulled');
    await delay(300);
    leverArm.classList.remove('pulled');

    const spinningMessages = [
      "Processing... the AI is pretending to think...",
      "Consulting the neural oracle...",
      "Running inference on your luck...",
      "The AI is calculating how to disappoint you...",
      "Spinning... the hamsters powering the GPU are running...",
      "Loading vibes... please wait...",
      "The AI is having a quick existential crisis...",
    ];
    setResult(spinningMessages[Math.floor(Math.random() * spinningMessages.length)], '');

    reels.forEach(function (reel) {
      reel.classList.remove('winner');
      reel.classList.add('spinning');
    });

    const results = [randomSymbol(), randomSymbol(), randomSymbol()];

    const stopDelays = [800, 1200, 1600];
    for (let i = 0; i < 3; i++) {
      await delay(stopDelays[i] - (i > 0 ? stopDelays[i - 1] : 0));
      reels[i].classList.remove('spinning');
      reels[i].querySelector('.symbol').textContent = results[i];
    }

    await delay(200);

    const key = results.join('');
    const payout = PAYOUTS[key];
    let isWin = false;

    if (payout) {
      const winnings = bet * payout.mult;
      tokens += winnings;
      totalWon += winnings;
      wins++;
      isWin = true;
      if (winnings > bestWin) bestWin = winnings;
      setResult(payout.msg + ' (+' + winnings + ' tokens)', 'win');
      reels.forEach(function (reel) { reel.classList.add('winner'); });
      addHistory(key + ' — WON ' + winnings + ' tokens!', true);
      pulseTokens();
    } else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
      const winnings = bet * 2;
      tokens += winnings;
      totalWon += winnings;
      wins++;
      isWin = true;
      if (winnings > bestWin) bestWin = winnings;
      const msg = PARTIAL_MESSAGES[Math.floor(Math.random() * PARTIAL_MESSAGES.length)];
      setResult(msg + ' (+' + winnings + ' tokens)', 'win');
      addHistory(key + ' — Partial match, won ' + winnings + ' tokens', true);
      pulseTokens();
    } else {
      const msg = LOSE_MESSAGES[Math.floor(Math.random() * LOSE_MESSAGES.length)];
      setResult(msg, 'lose');
      addHistory(key + ' — Lost ' + bet + ' tokens', false);
    }

    // Update streak
    if (isWin) {
      if (streakType === 'win') {
        currentStreak++;
      } else {
        streakType = 'win';
        currentStreak = 1;
      }
    } else {
      if (streakType === 'lose') {
        currentStreak++;
      } else {
        streakType = 'lose';
        currentStreak = 1;
      }
    }

    updateStreakBar(isWin);
    updateDisplay();
    rotateTicker();

    if (tokens <= 0) {
      setResult("GAME OVER: The AI has harvested all your tokens. You are now part of the training dataset. Hit 'Beg for Tokens' to crawl back.", 'lose');
    }

    isSpinning = false;
    if (tokens > 0) spinBtn.disabled = false;
  }

  function begForTokens() {
    const result = BEG_MESSAGES[Math.floor(Math.random() * BEG_MESSAGES.length)];

    addTokensBtn.classList.remove('begging');
    void addTokensBtn.offsetWidth;
    addTokensBtn.classList.add('begging');

    if (result.tokens > 0) {
      tokens += result.tokens;
      setResult(result.msg, 'beg');
      pulseTokens();

      // Re-enable spin if we were broke
      if (tokens > 0) {
        spinBtn.textContent = '🎰 PULL THE LEVER';
        spinBtn.disabled = false;
      }
    } else {
      setResult(result.msg, 'lose');
    }

    // Clamp bet if needed
    if (bet > tokens && tokens > 0) {
      bet = Math.max(5, Math.floor(tokens / 5) * 5);
    }

    updateDisplay();
  }

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  // Event listeners
  betUpBtn.addEventListener('click', function () {
    if (bet < tokens && bet < 50) {
      bet += 5;
      updateDisplay();
    }
  });

  betDownBtn.addEventListener('click', function () {
    if (bet > 5) {
      bet -= 5;
      updateDisplay();
    }
  });

  spinBtn.addEventListener('click', spin);
  addTokensBtn.addEventListener('click', begForTokens);
  leverAssembly.addEventListener('click', function () {
    if (!isSpinning) spin();
  });

  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && !isSpinning) {
      e.preventDefault();
      spin();
    }
  });

  setInterval(rotateTicker, 12000);
  createStars();
  updateDisplay();
})();
