# The One-Arm AI — Slot Machine

A self-contained, single-page slot machine built with plain HTML, CSS, and
vanilla JavaScript. No build step, no dependencies, no audio assets — every
sound and the looping music track are synthesised live with the Web Audio API.

This document describes every feature shipped in this folder and walks
through the most common ways to extend and test it.

---

## 1. Project layout

```
candidate-047-refinement-1/
├── index.html         # Static markup for the entire UI.
├── styles.css         # All visual styling, animations, and the
│                      # animated colourful casino backdrop.
├── app.js             # Game logic, sound, music, particles — everything.
└── DOCUMENTATION.md   # This file.
```

There is no bundler, no package.json, no test runner. Open `index.html` in a
browser and the game runs.

---

## 2. Existing features

### 2.1 Core gameplay
- **Three-reel weighted spin.** Each reel picks a symbol independently using
  the weight table in `SYMBOLS` (see [app.js](app.js) section 3). Heavier
  weights mean the symbol shows up more often.
- **Payout calculation.** Three of a kind pays the multiplier in `PAYOUTS`.
  Two of a kind pays a small consolation `PARTIAL_MATCH_MULT`. Three robots
  fires the special **JACKPOT** path.
- **Bet controls.** Plus/minus buttons adjust the bet in steps of `BET_STEP`,
  bounded by `MIN_BET` and the player's current balance.
- **Three ways to spin:** the SPIN button, clicking the side lever, or
  pressing **Space**.
- **Pity rescue.** If the player hits zero tokens after a losing spin, the
  game waits a beat and silently grants 50 tokens so play can continue.

### 2.2 Tokens & balance
- Starting balance of **100 tokens**.
- **Add Tokens modal** — opens from the gold "+ Add" button. Accepts a custom
  number (1–99999) or one of four preset amounts (50/100/250/500).
- **Floating +/− animations** above the reels show wins, losses, jackpots,
  and added tokens, each with their own colour.

### 2.3 Visual polish
- **Animated colourful casino backdrop** — multi-radial-gradient body
  background that slowly shifts through pink/gold/teal/purple, plus a
  conic-gradient spotlight ring rotating behind the machine.
- **Floating emoji particle field** rendered on a full-screen `<canvas>`,
  drifting upward with sinusoidal wobble.
- **Side and corner casino lights** with staggered chase animations.
- **Marquee chase lights** along the top and bottom of the machine header.
- **Win / jackpot flashes** on the reel frame border.
- **Machine shake** on losing spins.
- **Pull-lever animation** that snaps down on click and springs back up.
- **Reel motion blur** while spinning.

### 2.4 Audio
- **One-shot SFX** (entirely synthesised, no files):
  lever pull, reel start whirr, reel landing thud (per reel), regular win
  arpeggio, jackpot fanfare, lose tone, broke rumble, bet-change blip,
  add-tokens cascade.
- **Looping background music.** A four-bar I–vi–IV–V chord progression
  (C → Am → F → G) in C major, with a sawtooth bass line, triangle lead
  melody, and a tiny "ding" on each downbeat. Built with an audio-clock
  scheduler so it stays in time and toggling off doesn't pre-buffer a
  long tail. **Toggled with the Music button** below the SPIN button.

### 2.5 Stats & history
- **Live session stats** below the controls: spins, wins, losses, win rate,
  net profit/loss.
- **Collapsible spin history** showing the last 50 spins with symbol icons,
  result label, and signed payout. Newest first.

### 2.6 Accessibility & responsiveness
- ARIA labels on every icon-only button.
- Keyboard support: **Space** triggers spin, **Enter** confirms the custom
  add-tokens input.
- Mobile-first responsive layout below 440 px viewport width: side lights
  hide, paytable collapses to one column, reels shrink, controls stack.

---

## 3. Code architecture

`app.js` is a single IIFE that wraps everything. The major subsystems are
delimited by banner comments and ordered top-to-bottom as follows:

| # | Section | Responsibility |
|---|---------|----------------|
| 1 | `SFX` | Lazy AudioContext, oscillator/noise helpers, one-shot effects. |
| 2 | `Music` | Looping background-music scheduler. |
| 3 | Symbols / payouts / state | Game-tunable constants and mutable state. |
| — | Flavour text pools | Random message arrays. |
| — | DOM refs | Single cache of all `getElementById` lookups. |
| 4 | Background particles | Canvas animation loop. |
| 5 | Reel rendering | `renderStrip`, `animateReel`. |
| — | Result calculation | `calculateResult`. |
| 6 | UI updates | Token / bet / message / stat / history writers. |
| — | Lever helpers | `pullLever` / `releaseLever`. |
| 7 | `spin()` | The main async game loop. |
| 8 | Event wiring | Buttons, modal, keyboard, music toggle. |
| 9 | Init | Final bootstrap. |

Read [app.js](app.js) top-to-bottom and the in-file comments will walk you
through each section in detail.

---

## 4. How to add new features

Below are step-by-step recipes for the most common kinds of extension. Every
recipe ends with a **Test it** block so you have a clear loop to verify the
change.

### 4.1 Add a new symbol (or rebalance existing ones)

1. Open [app.js](app.js) and find the `SYMBOLS` array (section 3).
2. Add a new entry: `{ emoji: "🎲", name: "Dice", weight: 7 }`.
   Higher weight = more frequent.
3. Add it to the `PAYOUTS` map: `"🎲": 12,`.
4. Optionally add a row to the paytable in [index.html](index.html#L154-L163):
   ```html
   <div class="pay-row"><span class="pay-symbols">🎲🎲🎲</span><span class="pay-mult">x12</span></div>
   ```
5. **Test it:**
   - Reload `index.html` and spin until the new symbol appears (try 20–30
     spins; bump the weight temporarily if needed).
   - Spin until you see three of them — the message should reference the
     new payout and the balance should grow by `bet × 12`.
   - Open the history panel and verify the row shows the new emoji.

### 4.2 Add a new sound effect

1. In [app.js](app.js) inside the `SFX` IIFE, add a new method that uses
   `playTone` and/or `noise`. Example:
   ```js
   levelUp() {
     [440, 660, 880, 1320].forEach((f, i) =>
       setTimeout(() => playTone(f, "square", 0.15, 0.1), i * 60));
   },
   ```
2. Call it from wherever the new event happens, e.g. `SFX.levelUp()`.
3. **Test it:**
   - Trigger the event in the browser. The first call after a fresh load
     requires a user gesture (anywhere on the page) before audio plays —
     this is enforced by browsers, not by our code.

### 4.3 Modify the background music

The looping music lives in the `Music` IIFE, section 2 of [app.js](app.js).

- **Change tempo:** edit `BPM`.
- **Change the progression:** edit the `PROGRESSION` array. Each bar has
  `bass` and `lead` arrays of `[frequency, beatOffset, durationInBeats]`
  triples. Frequencies use the `N` lookup table at the top of the module.
- **Change the instrument timbres:** in `scheduleBar`, swap the `"sawtooth"`
  / `"triangle"` oscillator types for `"sine"` or `"square"`.
- **Change overall volume:** edit `masterGain.gain.value` in `getCtx()`.
- **Add a new layer (e.g. drums):** add another array of notes inside
  `PROGRESSION` bars and schedule it in `scheduleBar` with a third call
  pattern. Use `"square"` for percussive blips or filtered noise for hats.

**Test it:**
- Reload, click the Music button, and listen for one full loop (~8s).
- Toggle off and on a few times — you should hear no clicks at the
  boundaries and the loop should restart cleanly.

### 4.4 Add a new visual flash / animation

1. Add a CSS class with a keyframe animation in [styles.css](styles.css).
   Look at `.win-flash` / `.jackpot-flash` for the pattern.
2. In [app.js](app.js), add/remove the class on `reelsFrame` or `machine`
   from inside `spin()` at the appropriate point.
3. Wipe it at the top of the next spin (see the existing
   `reelsFrame.classList.remove("win-flash", "jackpot-flash")` line).
4. **Test it:** trigger the event repeatedly to confirm the animation
   replays each time (CSS animations only re-fire when the class is
   removed and re-added).

### 4.5 Add a new stat

1. Add a `<div class="stat">` block to the `.stats-bar` in
   [index.html](index.html#L108-L129) with a unique id.
2. Cache the element in the DOM-refs section of [app.js](app.js).
3. Declare a state variable next to `totalSpins`/`totalWins`/etc.
4. Update it in `spin()` and write it in `updateStats()`.
5. **Test it:** spin enough times that the stat becomes non-trivial and
   verify the number matches what you expect.

### 4.6 Persist game state across reloads

Currently nothing is persisted. To add `localStorage`:

1. After every state mutation in `spin()` and `addTokens()`, call a new
   `save()` helper that JSON-stringifies `{tokens, totalSpins, totalWins,
   totalLosses, netProfitLoss}` to `localStorage`.
2. At init time, read the same key and apply it before calling
   `updateTokenDisplay()` / `updateStats()`.
3. **Test it:** spin a few times, refresh the page, confirm the balance
   and stats survive. Clear localStorage to confirm defaults still load.

---

## 5. Manual test plan

There is no automated test suite. Use this checklist before merging changes.

### Smoke test (under one minute)
1. Open `index.html` in any modern browser.
2. The colourful animated background should be visible behind the slot
   machine, with floating emoji particles drifting upward.
3. Hit **Space** (or click SPIN) — the reels should spin and stop in
   sequence with sound, the bet should be deducted, and a result message
   should appear.

### Audio test
- Click anywhere first to satisfy autoplay rules.
- Spin and listen for: lever clunk → rising whirr → three reel thuds →
  result tone (cheer, fanfare, or sad sweep).
- Adjust the bet — you should hear a soft blip per click.
- Click **+ Add** → enter 100 → confirm. You should hear the coin cascade.
- Click the **Music** button. Within ~0.5 s a looping melody should start.
  Click again — the music should stop within a second with no clicks.

### Game logic test
- Set the bet to the **minimum** (5) and spin until you see a partial match.
  Balance should change by `+5` (10 winnings − 5 bet).
- Set the bet **higher than your balance**: the bet up arrow should refuse,
  and an attempt to spin while broke should shake the machine and show a
  "broke" message.
- Run yourself to **zero** intentionally. After the losing spin, you should
  receive 50 pity tokens automatically.
- Open the **History** panel — newest entry should be at the top, capped at
  50 entries after a long session.

### Visual / animation test
- Win flash and jackpot flash both trigger their respective border pulses.
- Losing spins shake the machine.
- Adding tokens scales the token counter briefly.
- Floating tokens appear above the reels on every spin.
- Resize the window down to ~380 px wide — layout should reflow, side
  lights should disappear, paytable should become single-column.

### Accessibility test
- **Tab** through the page — focus should land on every interactive control
  in a sensible order.
- **Space** triggers a spin from anywhere on the page.
- The custom token input accepts **Enter** to confirm.

---

## 6. Browser support

Targets evergreen Chromium, Firefox, and Safari. Requirements:

- **Web Audio API** with `OscillatorNode`, `BiquadFilterNode`, and
  `AudioBufferSourceNode`. All supported since 2014+ across all major
  browsers.
- **CSS** features in use: custom properties, `inset` shorthand,
  `backdrop-filter`, conic gradients, multi-background-position animation.
  Edge cases on very old Safari may degrade the spotlight ring but the
  game itself remains playable.

---

## 7. Tuning quick reference

| What you want to change          | Where to look in `app.js`                          |
|----------------------------------|----------------------------------------------------|
| Symbol frequencies               | `SYMBOLS` weights                                  |
| Payout multipliers               | `PAYOUTS` map                                      |
| Two-of-a-kind payout             | `PARTIAL_MATCH_MULT`                               |
| Starting balance                 | `let tokens = 100;`                                |
| Bet step / minimum               | `BET_STEP`, `MIN_BET`                              |
| Reel spin durations              | `durations` array inside `spin()`                  |
| Strip lengths (suspense length)  | `stripCounts` array inside `spin()`                |
| Particle count / size / opacity  | `PARTICLE_COUNT`, `createParticle()`               |
| Music tempo                      | `BPM` in the `Music` module                        |
| Music chord progression          | `PROGRESSION` in the `Music` module                |
| Music overall volume             | `masterGain.gain.value` in `Music.getCtx()`        |
| Win / lose / jackpot copy        | `WIN_MESSAGES`, `LOSE_MESSAGES`, `JACKPOT_MESSAGES`|
