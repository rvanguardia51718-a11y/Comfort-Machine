# Mini Project #2: Slot Machine Web App

- Name: Krisha Faith Pabillore | Student ID:02-2425-013252

## Project Title & Theme
Comfort Machine — a wholesome, puppy-themed slot machine.

Instead of chasing money, every spin gives the player a small comfort boost:
encouraging messages, Comfort Points, and rare Comfort Hearts that can be
redeemed for comforting rewards (a virtual hug, a heartfelt message, an
inspirational quote, and more). The theme is built around two animated
puppy companions who cheer the player on with every spin.

## How to Run the Project
1. Download/unzip the project folder.
2. Open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari) — no server or build step required.


### Project Structure
```
Comfort_Machine/
├── index.html      # page structure & markup
├── style.css        # all styling, animations, and responsive layout
├── script.js        # all game logic
├── assets/
│   ├── images/       # symbol icons used on the reels
│   ├── gifs/          # puppy companion animations
│   └── sounds/         # spin, win, and jackpot sound effects
└── README.md
```

## Features Implemented
- **Classic 3-reel, 3-column slot machine** built with pure HTML/CSS/JS — no frameworks.
- **Custom theme & symbols**: original puppy/comfort-themed icons instead of classic fruit symbols.
- **Spinning animation**: each reel spins independently and lands in sequence for a realistic, mechanical feel, with a tactile "landing bounce."
- **Adjustable bet sizes** (5 / 10 / 20 points), with rewards scaled to the chosen bet.
- **Randomized outcomes** using `Math.random()`, including:
  - A dedicated jackpot roll chance (checked *before* the reels are generated).
  - Weighted symbol selection from a per-category symbol pool.
  - A safeguard that prevents an accidental 3-of-a-kind from appearing on a non-jackpot spin.
- **Win detection logic** for three outcomes: **Jackpot** (all 3 match on a jackpot roll), **Big Win** / **Small Win** (2 matching symbols, tiered by symbol rarity), and **No Match**.
- **Comfort Points economy**: points are wagered on each spin and won back with a bet-scaled reward table.
- **Comfort Hearts — a rare secondary currency**: earned *only* on a jackpot, not on every win, making them feel special.
- **Comfort Rewards shop**: spend Comfort Hearts on repeatable, comforting rewards (Virtual Hug, Heartfelt Message, Inspirational Quote, Puppy Animation, Champion Badge), each with its own affordability state and progress bar toward the next reward.
- **Result popup modal**: shows win/no-win outcome and reward earned after every spin; a special quote-style celebration message is reserved for jackpots only.
- **Jackpot celebration overlay**: confetti, balloons, screen glow/shake, and a dedicated "Future You Bonus" message.
- **Non-repeating message pools**: comfort messages, jackpot messages, and reward messages cycle through large pools without repeating back-to-back.
- **Persistent state**: points, bet, Comfort Hearts, and redeemed rewards are saved with `localStorage` so progress carries over between sessions.
- **Sound effects & toggle**: spin, win, jackpot, and reward chimes, with a mute/unmute button.
- **Fully responsive design**: layout, reel/pup sizing, and popups adapt cleanly across desktops, laptops, tablets, and phones (including very small screens and landscape orientation), with no horizontal overflow at any size.


## Built With
- HTML5
- CSS3 (Flexbox, Grid, CSS variables, keyframe animations, media queries)
- Vanilla JavaScript (DOM manipulation, event handling, `localStorage`, `Math.random()`)
