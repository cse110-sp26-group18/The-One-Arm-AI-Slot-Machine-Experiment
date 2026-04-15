# 🧪 AI Slot Machine Experiment

## Evaluation Rubric

This rubric is used to evaluate each generated candidate across functionality, user experience, and code quality.  
All scoring is done on a **1–5 scale** unless otherwise noted.

---

## 📊 1. Metadata (Logging Only)

| Field | Description |
|------|------------|
| Run ID | Unique ID (e.g. candidate-014) |
| Timestamp | ISO 8601 format |
| Model + Version | Exact model string used |
| Input Tokens | As reported by tool |
| Output Tokens | As reported by tool |
| Total Tokens | Input + Output |
| Wall Time (s) | Measured manually |
| Tool Time (s) | If provided |
| Files Produced | Count |
| File Names | List of files |
| Total LOC | Total lines of code |
| Runs in Browser | yes / no / partial |

## 📋 2. Scoring Categories

| Category | Score (1–5) | Description |
|--------|------------|------------|
| Runs Successfully |  | App launches without errors |
| Core Functionality |  | Slot machine spins, tracks tokens |
| Feature Completeness |  | Includes win/loss logic, UI updates |
| Interactivity |  | Buttons and controls work properly |
| Stability |  | Handles edge cases, doesn’t crash |
| UI Design |  | Visual clarity and layout |
| Creativity / AI Satire |  | Incorporates humor or theme about AI |
| Feedback Clarity |  | Clear indication of results (win/loss/tokens) |
| Responsiveness |  | Smooth interactions, no lag |
| Enjoyability |  | Feels engaging and complete |
| Structure |  | Logical organization of files/code |
| Readability |  | Clear naming, comments |
| Modularity |  | Uses functions/components effectively |
| Correctness |  | Logic is sound, minimal bugs |
| Simplicity |  | Avoids unnecessary complexity |

## 📝 3. Qualitative Notes

| Category | Breakdown | Description |
|--------|------------|------------|
| Unique Features / Drift Notes |  | What makes this run different? |
| Missing Features / Bugs |  | What is broken or incomplete? |
| App Summary |  | 2–3 bullet summary of app behavior |
| Code Summary |  | 2–3 bullet summary of code quality |

---

## Selection and Refinement Process

We picked the following five based on each individual picking their favorite based on personal preference and artistic sense. After we narrowed it down, we started using the rubric to make our selections.

### Pre-refinement
#### Phase 3A (50 → 5)

- **034** — “See what you win” has a sound to it. Smooth rolling, the design is pretty good. Seems to be giving accurate results based on the emojis. Able to add tokens when you run out.
- **026** — Looks like a slot machine, more gamified than others. Smooth scroll, but doesn’t allow you to scroll to see the entire pay table. Unable to add more tokens.
- **047** — Shakes when you lose and makes a yellow flash when you win. Allows you to add tokens. Smooth scroll and still has a line.
- **021** — Wider than the others, weird sound, can’t bet with more money, but can get more tokens. Incorrect logic, but the result is mismatched with the pay table.
- **004** — LED outer shell, unable to add tokens, basic font.

### Selection process

In small groups, every group picked their favorite website out of the ~10 they had created. Because 50 candidates were a lot for everyone to individually go over and agree upon scores for the rubric, the smaller groups ranked their own candidates based on the user experience, aesthetic of the website, functionality of the slot machine, and the creativity of the model, including any extra features they might have included. This allowed for a natural way of narrowing down the first 50 candidates to the top 5 we wanted to refine further.

To refine the prompt, we came together as a group to discuss our favorite features we noticed, the gaps we encountered, and any personal ideas we thought might go well with the slot machine design.

### Refinement prompt

> “For the next stage, add the ability to track the different spins we have had, make sure that the user has the ability to add more tokens to their total tokens, add a more aesthetic background, add a more slot machine style with a slot hand on the side, and create a more humorous text and phrase.”

### Refinement 1

#### Phase 3B (5 → 5 refined → pick 3)

- **026** — Added accurate spin history, added an animation, allowed a scrollable pay table, the background changed, added a panel for tokens, adds a little animation when you win.
- **004** — Side lever is trippy (goes to the right instead of down), a little overwhelming, there is a sequence of lights that occur.
- **034** — Gets more narrow as you pull the lever (gets bigger when 1020 or above), liked the aesthetic and found it easier on the eyes.
- **021** — Still wide, doesn’t look as appealing compared to the other models that are more aesthetically pleasing.
- **047** — You have to buy tokens, the lights stand out, and net P/L is there, which is a nice addition to the information the user can use.

### Selection process

As a group, we all joined a Zoom call and screen-shared the 5 candidates and experienced them as users all together. This meant people were commenting on features they enjoyed from each website and also gaps they noticed. This allowed for a more interactive rating experience as a group. In order to clearly keep track of each website, we went back to all 5 candidates and filled out the agreed-upon rubric for each website. Specific scores can be analyzed in the `STEP2-RESULTS.md` file.

Based on the rubric scores, the following candidates were chosen: **026, 034, and 047**.

Similar to the last step, to refine the prompt, we came together as a group to discuss our favorite features we noticed, the gaps we encountered, and any personal ideas we thought might go well with the slot machine design.

### Refinement prompt

> “Make the decorations for the slot machine less chaotic while still keeping it vibrant, making it less text-heavy and more visual, make animations for the loss of tokens and the winnings of tokens, also make the width of the slot machine slim and consistent, when adding tokens to the total tokens allow the user to input their own amount of tokens they want, and make sure to add stats to the board.”

### Refinement 2

#### Phase 4 (3 → 3 refined → pick 2)

- **034** — Narrower panel, options to either pull the lever through a button or by clicking on the lever, customizable token betting, clear history, concise and not text-heavy, still has animation for wins and losses.
- **047** — Contains statistics, clear history, design looks similar to pre-refinement.

### Refinement prompt

> “Add gambling music, more casino vibe lights. In the HTML, JS, and CSS files, add descriptive and concise comments for documentation purposes.”

### Refinement 3

#### Phase 5 (2 → 2 refined → pick 1 → 1 refined)

- **034** — Has a music button that doesn’t work, added four LEDs to the corners, contains sound effects for wins and losses.
- **047** — Has a music button but it doesn’t work, added lights on the side and in the center, still has sound effects.

We chose **047**.

### Final refinement prompt

> “Fix the music, make the background more colorful and brighter, give the ultimate casino vibe. When it comes to the actual code files, produce an actual documentation file describing existing features and contain instructions on how to add new features and test them. Add more descriptive comments in the `.js` file.”

### Final observations on 047

- Background is lighter and cute.
- Music works, but it feels more like a constant sound effect and the volume is very low.
- The documentation is descriptive but very wordy.
- It is organized in a structured style, but the wordy text sounds AI-generated and would need to be humanized.
- Similarly, the inline comments are satisfactory, but would also need to be humanized.
- The documentation was inefficient because it added a lot more lines of comments while barely any new features were added.

---

## Conclusion

Despite the same prompt being run in clean sessions, we observed a wide range in variation and quality of the apps designed. During phase one, certain candidates did not have full visibility while others seemed to be more creative. For example, candidate 26 seemed to have more information at the bottom of the website, but the generative AI failed to implement a working scroll feature on this specific website, while some other candidates had functional scrolling ability. This prevented us from fully exploring its features.

During our first refinement, we noticed certain candidates now contained bugs within the code, implementations of everyday objects (for example, a pull lever going to the right instead of down upon action) were not accurate, and the addition of statistics was creative, but the lighting was a bit overwhelming for the team. A single refinement turn is able to add more UI design (such as the slot machine lever) and functionality (such as full view of the pay table), yet it is also capable of adding bugs (such as narrowing and widening of the app when the lever is pulled).

Simple prompting hits a ceiling for prototype work in that all the apps generally give the same UI design, but have certain distinctive features which allow us to rank preferences against a rubric.

Over the course of this project, we noticed that AI seems to have a general feel for the creative features it implements, but does not have a lot of variation in terms of unique design. In terms of bringing AI into conversation with our peers and leads, it’s important to remember that AI is capable of providing a basic framework for your needs, but it is most definitely not the end-all be-all of what one should do. Before using AI, we should have a clear understanding of what we want it to give us and be able to rank its output against what we determine to be our measures of success.
