
const STORAGE_KEYS = {
  CATEGORY: "comfortMachine_category",
  POINTS: "comfortMachine_points",
  BET: "comfortMachine_bet",
  HEARTS: "comfortMachine_hearts",
  REDEEMED: "comfortMachine_redeemedRewards",
  SOUND: "comfortMachine_soundOn"
};


let audioCtx = null;
function getAudioCtx() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch (e) {
    return null;
  }
}

function isSoundOn() {
  const stored = localStorage.getItem(STORAGE_KEYS.SOUND);
  return stored === null ? true : stored === "true";
}

function setSoundOn(value) {
  localStorage.setItem(STORAGE_KEYS.SOUND, String(value));
}

/* Play a single tone. type: oscillator waveform. */
function playTone(freq, startOffset, duration, type, peakVolume) {
  const ctx = getAudioCtx();
  if (!ctx || !isSoundOn()) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || "sine";
  osc.frequency.value = freq;
  const startAt = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(peakVolume, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

/* A quick, light "tick-tick-tick" as the reels start spinning. */
function playSpinSound() {
  if (!isSoundOn()) return;
  for (let i = 0; i < 3; i++) {
    playTone(300 + i * 40, i * 0.09, 0.08, "square", 0.06);
  }
}

/* Small/Big win: one cheerful ding, or a two-note ascending chime. */
function playWinSound(tier) {
  if (!isSoundOn()) return;
  if (tier === "big") {
    playTone(659.25, 0, 0.22, "sine", 0.16); // E5
    playTone(987.77, 0.12, 0.3, "sine", 0.16); // B5
  } else {
    playTone(784, 0, 0.25, "sine", 0.15); // G5
  }
}

/* No match / loss: soft, gentle, and low-key on purpose — this
   is a comfort game, so a "miss" should never feel punishing. */
function playLoseSound() {
  if (!isSoundOn()) return;
  playTone(392, 0, 0.3, "sine", 0.08);   // G4
  playTone(329.63, 0.12, 0.35, "sine", 0.07); // E4
}


function playJackpotChime() {
  if (!isSoundOn()) return;
  const audio = new Audio("assets/sounds/yay.mp3");
  audio.volume = 0.8;
  audio.play().catch(() => {
    // Autoplay can be blocked in some browsers until a user
    // gesture has happened on the page — safe to ignore here since
    // Spin itself is already a user gesture.
  });
}


function playClickSound() {
  if (!isSoundOn()) return;
  playTone(520, 0, 0.06, "square", 0.07);
  playTone(300, 0.03, 0.08, "square", 0.05);
}


function playRewardChime() {
  if (!isSoundOn()) return;
  playTone(587.33, 0, 0.5, "sine", 0.09);   // D5
  playTone(880, 0.1, 0.6, "sine", 0.08);    // A5
  playTone(1174.66, 0.22, 0.7, "sine", 0.06); // D6
}


let spinLoopTimer = null;
function startSpinLoop() {
  if (!isSoundOn()) return;
  stopSpinLoop();
  let tick = 0;
  spinLoopTimer = setInterval(() => {
    playTone(300 + (tick % 3) * 18, 0, 0.09, "square", 0.045);
    tick++;
  }, 110);
}
function stopSpinLoop() {
  if (spinLoopTimer) {
    clearInterval(spinLoopTimer);
    spinLoopTimer = null;
  }
}


function primeAudioOnce() {
  getAudioCtx();
  startBgMusic();
  window.removeEventListener("pointerdown", primeAudioOnce);
  window.removeEventListener("keydown", primeAudioOnce);
}
window.addEventListener("pointerdown", primeAudioOnce, { once: true });
window.addEventListener("keydown", primeAudioOnce, { once: true });


let bgMusic = null;
function getBgMusic() {
  if (!bgMusic) {
    bgMusic = new Audio("assets/sounds/bg-music.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.35;
  }
  return bgMusic;
}
function startBgMusic() {
  if (!isSoundOn()) return;
  const music = getBgMusic();
  music.play().catch(() => {
    // If the browser still blocks it, it'll simply retry next gesture.
  });
}
function stopBgMusic() {
  if (bgMusic) bgMusic.pause();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const START_POINTS = 100;
const BET_OPTIONS = [5, 10, 20];
const DEFAULT_BET = 10;

/* Reward table: reward amounts scale with the chosen bet. */
const REWARD_TABLE = {
  5:  { small: 10, big: 25,  jackpot: 50 },
  10: { small: 20, big: 50,  jackpot: 100 },
  20: { small: 40, big: 100, jackpot: 200 }
};


const LOW_SYMBOLS = ["paw", "balloon", "bone", "rainbow"];
const HIGH_SYMBOLS = ["star", "bluepup", "orangepup"];
const ALL_SYMBOLS = LOW_SYMBOLS.concat(HIGH_SYMBOLS);


const HEARTS_PER_WIN = {
  jackpot: 5
};


const REWARDS = [
  {
    id: "hug",
    type: "hug",
    cost: 10,
    icon: "🤗",
    name: "Virtual Hug",
    gif: "assets/gifs/virtual-hug.gif"
  },
  {
    id: "message",
    type: "message",
    cost: 20,
    icon: "💌",
    name: "Heartfelt Comfort Message"
  },
  {
    id: "quote",
    type: "quote",
    cost: 30,
    icon: "🌸",
    name: "Inspirational Quote"
  },
  {
    id: "puppy",
    type: "puppy",
    cost: 50,
    icon: "🐶",
    name: "Cute Puppy Animation",
    gif: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3Vmdnk3bGM5OWdoYzhyaHdyaWk5ZjRoc20yaDBoeGY0cmxsdThubCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/V4ddir9HjkGA9YsZc7/giphy.gif"
  },
  {
    id: "champion",
    type: "badge",
    cost: 100,
    icon: "🏆",
    name: "Comfort Champion Badge"
  }
];


const HUG_MESSAGES = [
  "Consider yourself hugged — tightly, warmly, and without any rush to let go. You don't have to earn comfort to deserve it. You just do.",
  "Wherever you are right now, picture this as a hug that doesn't ask anything of you — just a quiet reminder that you're not carrying today alone.",
  "You're allowed to be held, even in a small digital way. Let this be one less thing your shoulders have to hold up by themselves.",
  "This hug comes with no conditions attached — not for what you did today, just for who you are.",
  "Some days all a person needs is to feel a little less alone. Consider this your reminder that you are seen, and you are cared for.",
  "Take a slow breath. Let your shoulders drop. This hug is here to remind you that softness is allowed, even now.",
  "You've been strong for a while now. Let this hug be a place where you don't have to be strong for a moment.",
  "However heavy today felt, you're still here, and that's worth a real, warm hug.",
  "This is a hug for the version of you that's still trying, even on the hard days. That version deserves comfort too.",
  "No matter what the day handed you, you're worthy of tenderness. Let this hug be proof of that."
];

const HEARTFELT_MESSAGES = [
  "Whatever today has been like, you made it this far, and that matters more than it feels like it does right now.",
  "You are allowed to move slowly and still be figuring things out. That doesn't make you behind — it makes you human.",
  "The fact that you keep showing up, even on the days it's hard, says more about your strength than any single outcome could.",
  "You don't have to have it all figured out to be doing okay. Uncertainty is part of growth, not proof that something's wrong with you.",
  "Healing and growth rarely look like a straight line. The fact that you're still here, still trying, is the progress that counts most.",
  "Somewhere along the way you learned to be hard on yourself. You're allowed to unlearn that, one gentle moment at a time.",
  "Your worth was never something you had to prove. It was true before today, and it will still be true tomorrow.",
  "It's okay to rest without guilt. Rest isn't the opposite of progress — it's part of how progress is made possible.",
  "You've gotten through every hard day so far. That track record means something, even on the days it's hard to remember.",
  "You don't owe anyone constant strength. Even the sturdiest things need moments to simply be soft.",
  "Being kind to yourself isn't indulgent — it's necessary. You deserve the same patience you'd offer someone you love.",
  "Every small step you've taken, even the ones nobody saw, has carried you somewhere. Keep going gently.",
  "You are not behind in your own life. There is no universal timeline you're failing to meet.",
  "The people who truly care about you would rather see you well than perfect. Let that be permission to ease up.",
  "You are allowed to take up space, to ask for help, and to need things. None of that makes you a burden."
];

const QUOTE_MESSAGES = [
  "Healing isn't a straight line — it's a garden you keep returning to, even on the days nothing seems to be growing yet.",
  "Courage doesn't always roar. Sometimes it's the quiet voice at the end of the day whispering, 'I'll try again tomorrow.'",
  "You are not required to set yourself on fire to keep other people warm.",
  "Every storm you've weathered has taught your roots to hold on a little tighter.",
  "Gratitude turns what we have into enough, and enough into more than we ever expected.",
  "The comeback is always stronger than the setback, even when it doesn't feel that way yet.",
  "Some of the strongest people are the ones who smile through things that would break others — and still choose kindness.",
  "You do not have to see the whole staircase to take the next step.",
  "What feels like the end of the road is often simply a bend in the path.",
  "Resilience is not about never falling. It's about how gently and how often you choose to rise again.",
  "Be patient with yourself. Nothing in nature blooms all year, and neither do we.",
  "Your value is not measured by your productivity, your mistakes, or your worst day.",
  "The world needs the specific kind of light only you can bring — even on the days you can't see it yourself.",
  "Perseverance is quietly deciding to try one more time, long after the applause has stopped.",
  "You are allowed to be both a work in progress and worthy of love at the very same time."
];

const PUPPY_MESSAGES = [
  "A little reminder just for you: rest is productive, softness is not weakness, and the people who care about you would rather see you okay than perfect.",
  "Let this little goofball remind you that joy doesn't need a reason — sometimes it just needs a wagging tail and a good day.",
  "Even on hard days, there's room for a little silliness. Let this be your permission to smile for no reason at all.",
  "This is your reminder that comfort can be simple — a warm nap, a familiar face, a moment of pure, uncomplicated happiness.",
  "May this small burst of joy remind you that good things can show up in the middle of an ordinary day.",
  "Some days call for deep reflection. Other days just call for a happy puppy. Today, let it be the second one.",
  "A reminder that play, rest, and silliness are just as important to your wellbeing as any task on your list.",
  "Let this be a tiny, joyful pause — proof that even small moments of delight are worth stopping for.",
  "Sometimes the best comfort is the simplest one. Enjoy this little moment of pure happiness.",
  "This puppy has zero worries right now, and for the next few seconds, maybe you can borrow a little of that peace too."
];

const CHAMPION_MESSAGES = [
  "🏆 COMFORT CHAMPION 🏆 — You've shown up for yourself again and again, one small win at a time. That kind of quiet persistence is its own kind of strength.",
  "🏆 COMFORT CHAMPION 🏆 — Whatever brought you here, whatever you're carrying: you are worthy of good things, exactly as you are, and stronger than this moment lets on.",
  "🏆 COMFORT CHAMPION 🏆 — Every time you chose to keep going instead of giving up, you built something in yourself that can't be taken away.",
  "🏆 COMFORT CHAMPION 🏆 — This badge isn't for being perfect. It's for showing up, again and again, even when it was hard.",
  "🏆 COMFORT CHAMPION 🏆 — You've proven, over and over, that persistence quietly outlasts doubt. Keep carrying that with you.",
  "🏆 COMFORT CHAMPION 🏆 — The effort you've put in, even on the days no one was watching, is exactly what real strength looks like.",
  "🏆 COMFORT CHAMPION 🏆 — You are becoming the kind of person who keeps their own promises to themselves. That's a rare and powerful thing.",
  "🏆 COMFORT CHAMPION 🏆 — However today went, remember: you've already survived every hard day that came before it. That's champion-level resilience."
];


const JACKPOT_MESSAGES = [
  "Today you won the jackpot, but remember that the greatest victories in life aren't always measured by luck. Every challenge you've overcome, every lesson you've learned, and every step you've taken forward is proof of your strength. Keep believing in yourself, because your greatest reward is becoming the person you are meant to be.",
  "This win feels great, and it's worth celebrating — but your real worth was never up to chance. It lives in the quiet effort you put in on ordinary days when nobody was keeping score.",
  "Luck brought you this moment, but it's your persistence that brought you this far. Carry that truth with you long after the confetti settles.",
  "Celebrate this — you've earned a moment of pure joy. But know that even without it, you would still be enough, exactly as you are.",
  "A jackpot is a nice surprise. But the real prize is everything you've already built in yourself: patience, resilience, and the courage to keep trying.",
  "Enjoy this win fully. And remember — on the days without a jackpot, your value doesn't change one bit.",
  "This moment of luck is a celebration, not a measurement. Your worth was never something a spin could decide.",
  "However today's numbers landed, the truest win is that you're still here, still showing up, still growing. That will always matter more than any jackpot.",
  "Today luck smiled upon you, but remember that the greatest victories are not won by chance. Every challenge you've overcome and every step you've taken forward is proof of your strength. Keep believing in yourself because your journey is your greatest achievement."
];

/* Messages shown when a spin doesn't match — written so a loss
   never reads as "you lost," just as an ordinary, expected part
   of playing. Used in the reward modal in place of "No match". */
const LOSE_MESSAGES = [
  "Not every spin brings a prize, but every new spin brings another chance.",
  "Some days are quieter than others, but tomorrow always brings new opportunities.",
  "The brightest stars don't shine every night. Keep going.",
  "This spin didn't line up, and that's okay — not every moment has to.",
  "No match this time, but you're still exactly where you need to be.",
  "A quiet spin isn't a setback. It's just part of the rhythm of trying.",
  "Nothing lined up this round, but showing up for it still counts for something.",
  "Some spins are just breathing room. The next one is still yours to take.",
  "This one didn't land, and that's alright — persistence rarely announces itself.",
  "Not this spin, but there's always another one waiting whenever you're ready."
];
const pickLoseMessage = createNoRepeatPicker(LOSE_MESSAGES.length ? LOSE_MESSAGES : ["Keep going."]);

/* Fisher–Yates "shuffle bag" so a pool cycles through every
   message before any message repeats — this is what keeps the
   reward shop from ever feeling like it shows "the same thing
   all the time." */
function createNoRepeatPicker(pool) {
  let bag = [];
  function refillBag() {
    bag = pool.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  return function pick() {
    if (bag.length === 0) refillBag();
    return bag.pop();
  };
}

const REWARD_MESSAGE_PICKERS = {
  hug: createNoRepeatPicker(HUG_MESSAGES),
  message: createNoRepeatPicker(HEARTFELT_MESSAGES),
  quote: createNoRepeatPicker(QUOTE_MESSAGES),
  puppy: createNoRepeatPicker(PUPPY_MESSAGES),
  badge: createNoRepeatPicker(CHAMPION_MESSAGES)
};

const pickJackpotMessage = createNoRepeatPicker(JACKPOT_MESSAGES);

function getHearts() {
  const stored = localStorage.getItem(STORAGE_KEYS.HEARTS);
  return stored === null ? 0 : parseInt(stored, 10) || 0;
}

function setHearts(value) {
  localStorage.setItem(STORAGE_KEYS.HEARTS, String(value));
}

/* Rewards are consumable, so this no longer stores a one-time
   "unlocked" flag — it stores how many times each reward has
   been redeemed, purely so the shop can show a friendly
   "Redeemed x3" style note. It never blocks a redemption. */
function getRedeemedRewards() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.REDEEMED));
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch (e) {
    return {};
  }
}

function setRedeemedRewards(counts) {
  localStorage.setItem(STORAGE_KEYS.REDEEMED, JSON.stringify(counts));
}

/* ---------- Category configuration ----------
   Each category changes more than copy: it tunes real odds
   (symbolPool, jackpotChance), a reward multiplier, and a
   guaranteed "comfort floor" so losing never feels empty. */
const CATEGORY_CONFIG = {
  motivation: {
    label: "Motivation",
    symbolPool: ALL_SYMBOLS,
    jackpotChance: 0.25,
    rewardBonusPct: 0.10,
    comfortFloor: 0,
    footnote: "Every spin, win or not, you're still moving forward.",
    jackpotMsg: "Future You is already proud of this moment."
  },
  comfort: {
    label: "Comfort",
    symbolPool: ALL_SYMBOLS,
    jackpotChance: 0.25,
    rewardBonusPct: 0,
    comfortFloor: 2,
    footnote: "Every spin, win or not, you're still showing up. That counts.",
    jackpotMsg: "Your future self is proud of you."
  },
  encouragement: {
    label: "Encouragement",
    symbolPool: ["paw", "balloon", "bone", "rainbow", "star"], // smaller pool = matches land more often
    jackpotChance: 0.25,
    rewardBonusPct: 0,
    comfortFloor: 0,
    footnote: "Every spin, win or not, you're doing better than you think.",
    jackpotMsg: "Look what showing up got you."
  },
  fun: {
    label: "Fun",
    symbolPool: ALL_SYMBOLS,
    jackpotChance: 0.25, // a little extra spontaneous luck
    rewardBonusPct: 0,
    comfortFloor: 0,
    footnote: "Every spin is a little adventure — enjoy the ride.",
    jackpotMsg: "Confetti says: nice spin!"
  }
};

const MESSAGES = {
  motivation: {
    blue: ["You've got this.", "One step at a time.", "Keep going.", "One task at a time.", "Progress is still progress."],
    orange: ["I'm cheering for you!", "You can do it!", "Let's try again!", "Small wins add up.", "Onward and upward!"]
  },
  comfort: {
    blue: ["It's okay to rest.", "Heavy days don't last forever.", "Take all the time you need.", "Breathe — you're doing fine.", "Soft days are allowed too."],
    orange: ["I'm right here with you.", "No rush at all.", "You don't have to be okay right now.", "Rest counts as progress too.", "Let's just be still for a moment."]
  },
  encouragement: {
    blue: ["You're stronger than you realize.", "The effort you're making matters.", "Look how far you've come.", "You keep showing up — that's brave.", "Believe in yourself a little more."],
    orange: ["I believe in you!", "You're doing better than you think.", "Every try counts.", "You've handled hard things before.", "Keep trusting yourself."]
  },
  fun: {
    blue: ["Adventure time!", "Today looks like a good day.", "Let's spin some sunshine!", "Ready for a fun surprise?", "Wheee, here we go!"],
    orange: ["Let's play!", "This is the best part of the day!", "Woohoo, spin it!", "Fun first, always!", "Let's make today silly!"]
  }
};

/* ---------- Helpers ---------- */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPoints() {
  const stored = localStorage.getItem(STORAGE_KEYS.POINTS);
  return stored === null ? START_POINTS : parseInt(stored, 10);
}

function setPoints(value) {
  localStorage.setItem(STORAGE_KEYS.POINTS, String(value));
}

function getCategory() {
  const stored = localStorage.getItem(STORAGE_KEYS.CATEGORY);
  return CATEGORY_CONFIG[stored] ? stored : "comfort";
}

function getCategoryConfig() {
  return CATEGORY_CONFIG[getCategory()];
}

/* Build the markup for a single reel symbol cell.
   Each symbol is now an <img> pointing at assets/images/<symbolKey>.png
   — swap in your own image files with these exact filenames and they'll
   show up on the reels automatically:
     assets/images/bluepup.png
     assets/images/orangepup.png
     assets/images/paw.png
     assets/images/balloon.png
     assets/images/bone.png
     assets/images/rainbow.png
     assets/images/star.png */
/* Set each symbol's file extension here to match whatever you saved
   it as — "jpg" or "png" — mix and match freely. */
const SYMBOL_EXTENSIONS = {
  bluepup: "png",
  orangepup: "png",
  paw: "png",
  balloon: "png",
  bone: "png",
  rainbow: "png",
  star: "png"
};

function symbolMarkup(symbolKey) {
  const ext = SYMBOL_EXTENSIONS[symbolKey] || "png";
  return '<img src="assets/images/' + symbolKey + '.' + ext + '" alt="' + symbolKey + '">';
}

/* =========================================================
   SLOT MACHINE (index.html)
   ========================================================= */
function initGamePage() {
  const spinBtn = document.getElementById("spinBtn");
  if (!spinBtn) return; // not on this page

  const pointsValueEl = document.getElementById("pointsValue");
  const betValueEl = document.getElementById("betValue");
  const comfortMessageEl = document.getElementById("comfortMessage");
  const schoolMessageEl = document.getElementById("schoolMessage");
  const footnoteEl = document.getElementById("footnote");
  const lever = document.getElementById("lever");
  const cabinet = document.querySelector(".cabinet");
  const cabinetTopper = document.getElementById("cabinetTopper");
  const bluePupEl = document.getElementById("bluePup");
  const orangePupEl = document.getElementById("orangePup");
  const spinCostEl = document.getElementById("spinCost");
  const betButtons = document.querySelectorAll(".bet-btn");

  const reelEls = [
    document.getElementById("reel1"),
    document.getElementById("reel2"),
    document.getElementById("reel3")
  ];
  const stripEls = reelEls.map((r) => r.querySelector(".reel-strip"));

  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalResult = document.getElementById("modalResult");
  const modalMessage = document.getElementById("modalMessage");
  const modalReward = document.getElementById("modalReward");
  const spinAgainBtn = document.getElementById("spinAgainBtn");
  const continueBtn = document.getElementById("continueBtn");

  const jackpotOverlay = document.getElementById("jackpotOverlay");
  const jackpotMsgEl = document.getElementById("jackpotMsg");
  const jackpotPointsEl = document.getElementById("jackpotPoints");
  const confettiLayer = document.getElementById("confettiLayer");
  const balloonLayer = document.getElementById("balloonLayer");
  const jackpotContinueBtn = document.getElementById("jackpotContinueBtn");

  /* ---- Comfort Hearts DOM refs ---- */
  const heartsValueEl = document.getElementById("heartsValue");
  const heartsPillEl = document.getElementById("heartsPill");
  const rewardsBtn = document.getElementById("rewardsBtn");
  const soundToggleBtn = document.getElementById("soundToggleBtn");
  const rewardsOverlay = document.getElementById("rewardsOverlay");
  const rewardsCloseBtn = document.getElementById("rewardsCloseBtn");
  const rewardsGrid = document.getElementById("rewardsGrid");
  const rewardsCurrentHeartsEl = document.getElementById("rewardsCurrentHearts");
  const rewardsNextLabelEl = document.getElementById("rewardsNextLabel");
  const rewardsProgressFillEl = document.getElementById("rewardsProgressFill");
  const rewardsProgressNoteEl = document.getElementById("rewardsProgressNote");
  const rewardsInsufficientMsgEl = document.getElementById("rewardsInsufficientMsg");
  const rewardReveal = document.getElementById("rewardReveal");
  const rewardRevealIcon = document.getElementById("rewardRevealIcon");
  const rewardRevealTitle = document.getElementById("rewardRevealTitle");
  const rewardRevealConfirm = document.getElementById("rewardRevealConfirm");
  const rewardRevealCost = document.getElementById("rewardRevealCost");
  const rewardRevealRemaining = document.getElementById("rewardRevealRemaining");
  const rewardRevealMessage = document.getElementById("rewardRevealMessage");
  const rewardRevealGif = document.getElementById("rewardRevealGif");
  const rewardRevealCloseBtn = document.getElementById("rewardRevealCloseBtn");

  let hearts = getHearts();
  let redeemedRewards = getRedeemedRewards();
  let currentJackpotMessage = "";

  let points = getPoints();
  let spinning = false;
  let currentBet = parseInt(localStorage.getItem(STORAGE_KEYS.BET), 10) || DEFAULT_BET;
  const category = getCategory();
  const config = CATEGORY_CONFIG[category];

  /* ---- Initial render ---- */
  function renderPoints() {
    pointsValueEl.textContent = points;
    pointsValueEl.classList.remove("flash");
    void pointsValueEl.offsetWidth;
    pointsValueEl.classList.add("flash");
  }

  function renderBet() {
    betValueEl.textContent = currentBet;
    spinCostEl.textContent = "Bet: " + currentBet + " pts";
    betButtons.forEach((b) => {
      b.classList.toggle("active", parseInt(b.getAttribute("data-bet"), 10) === currentBet);
    });
  }

  /* ---- Comfort Hearts: rendering & progression ---- */
  function renderHearts(didGain) {
    heartsValueEl.textContent = hearts;
    if (didGain) {
      heartsValueEl.classList.remove("flash");
      void heartsValueEl.offsetWidth;
      heartsValueEl.classList.add("flash");
    }
    updateRewardsUI();
  }

  /* Show a small floating "+N 💗" indicator next to the hearts pill. */
  function floatHeartGain(amount) {
    const el = document.createElement("span");
    el.className = "heart-gain-float";
    el.textContent = "+" + amount + " 💗";
    heartsPillEl.appendChild(el);
    setTimeout(() => el.remove(), 1150);
  }

  /* Award hearts for a win. type: "small" | "big" | "jackpot" */
  function awardHearts(type) {
    const amount = HEARTS_PER_WIN[type];
    if (!amount) return;
    hearts += amount;
    setHearts(hearts);
    renderHearts(true);
    floatHeartGain(amount);
  }

  /* Find the cheapest reward the player *can't* currently afford
     (used to drive the "saving up" progress bar). Returns null
     once every reward is affordable. */
  function getCheapestUnaffordableReward() {
    return REWARDS.reduce((cheapest, r) => {
      if (hearts >= r.cost) return cheapest;
      if (!cheapest || r.cost < cheapest.cost) return r;
      return cheapest;
    }, null);
  }

  function updateRewardsUI() {
    rewardsCurrentHeartsEl.textContent = "❤️ " + hearts + " Comfort Hearts";

    const next = getCheapestUnaffordableReward();
    if (next) {
      const pct = Math.max(0, Math.min(100, (hearts / next.cost) * 100));
      rewardsProgressFillEl.style.width = pct + "%";
      rewardsNextLabelEl.textContent = "Saving for: " + next.name + " (❤️" + next.cost + ")";
      const remaining = next.cost - hearts;
      rewardsProgressNoteEl.textContent = remaining + " more heart" + (remaining === 1 ? "" : "s") + " needed";
    } else {
      rewardsProgressFillEl.style.width = "100%";
      rewardsNextLabelEl.textContent = "You can afford every reward!";
      rewardsProgressNoteEl.textContent = "Spend your hearts on whatever comforts you most. 🏆";
    }

    renderRewardsGrid();
  }

  function renderRewardsGrid() {
    rewardsGrid.innerHTML = "";
    REWARDS.forEach((reward) => {
      const affordable = hearts >= reward.cost;
      const timesRedeemed = redeemedRewards[reward.id] || 0;

      const card = document.createElement("div");
      card.className = "reward-card " + (affordable ? "unlocked" : "locked") + (reward.justRedeemed ? " redeemed" : "");

      const icon = document.createElement("div");
      icon.className = "reward-card-icon";
      icon.textContent = reward.icon;

      const name = document.createElement("div");
      name.className = "reward-card-name";
      name.textContent = reward.name;

      const cost = document.createElement("div");
      cost.className = "reward-card-cost";
      cost.textContent = "❤️ " + reward.cost;

      const need = document.createElement("div");
      need.className = "reward-card-need";
      need.textContent = affordable
        ? (timesRedeemed > 0 ? "Redeemed x" + timesRedeemed : "Ready to redeem!")
        : "Need " + (reward.cost - hearts) + " more ❤️";

      const btn = document.createElement("button");
      btn.className = "reward-card-btn " + (affordable ? "claim" : "");
      btn.textContent = "Redeem";
      btn.disabled = !affordable;
      btn.addEventListener("click", () => redeemReward(reward));

      card.append(icon, name, cost, need, btn);
      rewardsGrid.appendChild(card);
    });
  }

  /* Briefly show "You don't have enough Comfort Hearts." — belt
     and suspenders alongside the disabled Redeem button, in case
     this is ever triggered another way. */
  let insufficientMsgTimer = null;
  function showInsufficientHeartsMessage() {
    if (!rewardsInsufficientMsgEl) return;
    rewardsInsufficientMsgEl.textContent = "You don't have enough Comfort Hearts.";
    rewardsInsufficientMsgEl.classList.add("visible");
    if (insufficientMsgTimer) clearTimeout(insufficientMsgTimer);
    insufficientMsgTimer = setTimeout(() => {
      rewardsInsufficientMsgEl.classList.remove("visible");
    }, 2600);
  }

  /* ---- Redeem a reward: spend Comfort Hearts, persist the new
     balance immediately, and show a redemption confirmation.
     Rewards are consumable, so this can be called again and
     again as long as the player can afford the cost. ---- */
  function redeemReward(reward) {
    if (hearts < reward.cost) {
      showInsufficientHeartsMessage();
      renderRewardsGrid();
      return;
    }

    hearts -= reward.cost;
    setHearts(hearts); // persist to localStorage immediately

    redeemedRewards[reward.id] = (redeemedRewards[reward.id] || 0) + 1;
    setRedeemedRewards(redeemedRewards);

    renderHearts(false); // updates the displayed balance + rewards UI right away

    reward.justRedeemed = true;
    renderRewardsGrid();
    setTimeout(() => { reward.justRedeemed = false; }, 1600);

    playRewardChime();
    showRewardReveal(reward);
  }

  /* Small heart-emoji burst to celebrate claiming a reward. */
  function launchHeartBurst() {
    const rect = rewardsOverlay.querySelector(".rewards-card").getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
      const piece = document.createElement("div");
      piece.className = "heart-burst-piece";
      piece.textContent = pickRandom(["💗", "💕", "✨", "🌸"]);
      piece.style.left = (rect.left + rect.width / 2 + (Math.random() * 200 - 100)) + "px";
      piece.style.top = (rect.top + rect.height * 0.6) + "px";
      piece.style.animationDelay = (Math.random() * 0.3) + "s";
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 1900);
    }
  }

  const REVEAL_TYPE_CLASSES = ["type-hug", "type-message", "type-quote", "type-puppy", "type-badge"];
  const REVEAL_PARTICLES = {
    hug: ["🤗", "❤️", "💕", "🤍"],
    message: ["✨", "💌", "🌟"],
    quote: ["✨", "🌙", "⭐"],
    puppy: ["🐾", "✨"],
    badge: ["✨", "🏆", "⭐", "🎉"]
  };

  /* Spawn a themed burst of floating particles over the reveal
     panel — different emoji set per reward type, so each reward
     reads as its own distinct moment rather than "just text". */
  function launchRevealParticles(type) {
    const emojis = REVEAL_PARTICLES[type] || ["✨"];
    const rect = rewardReveal.getBoundingClientRect();
    const count = type === "badge" ? 22 : 14;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.className = "heart-burst-piece reveal-particle";
      piece.textContent = pickRandom(emojis);
      piece.style.left = (rect.left + Math.random() * rect.width) + "px";
      piece.style.top = (rect.top + rect.height * (0.3 + Math.random() * 0.4)) + "px";
      piece.style.animationDelay = (Math.random() * 0.35) + "s";
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 1900);
    }
  }

  function showRewardReveal(reward) {
    const freshMessage = REWARD_MESSAGE_PICKERS[reward.type]
      ? REWARD_MESSAGE_PICKERS[reward.type]()
      : reward.name;

    rewardRevealTitle.textContent = reward.name;
    rewardRevealConfirm.textContent = "✓ Reward Redeemed!";
    rewardRevealCost.textContent = "-" + reward.cost + " ❤️ Comfort Hearts";
    rewardRevealRemaining.textContent = "Remaining Hearts: " + hearts + " ❤️";
    rewardRevealMessage.textContent = freshMessage;

    // Reset then apply this reward's visual theme (background,
    // typography, and icon animation all change per type).
    rewardReveal.classList.remove(...REVEAL_TYPE_CLASSES);
    rewardReveal.classList.add("type-" + reward.type);

    if (reward.gif) {
      // Rewards with a GIF (Virtual Hug, Cute Puppy) show the GIF
      // in place of the emoji icon — no emoji + GIF redundancy.
      rewardRevealIcon.style.display = "none";
      rewardRevealGif.src = reward.gif;
      rewardRevealGif.style.display = "block";
    } else {
      rewardRevealIcon.textContent = reward.icon;
      rewardRevealIcon.style.display = "";
      rewardRevealGif.style.display = "none";
      rewardRevealGif.removeAttribute("src");
    }

    rewardReveal.classList.remove("visible");
    void rewardReveal.offsetWidth; // restart the reveal's entrance animation every time
    rewardReveal.classList.add("visible");
    rewardReveal.scrollIntoView({ behavior: "smooth", block: "nearest" });
    launchRevealParticles(reward.type);
  }

  function hideRewardReveal() {
    rewardReveal.classList.remove("visible");
  }

  function openRewardsModal() {
    hideRewardReveal();
    updateRewardsUI();
    rewardsOverlay.classList.add("visible");
  }

  function closeRewardsModal() {
    rewardsOverlay.classList.remove("visible");
  }

  function refreshBubbles() {
    comfortMessageEl.textContent = pickRandom(MESSAGES[category].blue);
    schoolMessageEl.textContent = pickRandom(MESSAGES[category].orange);
    [document.getElementById("bluePupBubble"), document.getElementById("orangePupBubble")].forEach((b) => {
      b.classList.remove("refresh");
      void b.offsetWidth;
      b.classList.add("refresh");
    });
  }

  /* Show both side messages for exactly 10 seconds, then hide
     them again. Called after a spin (and a jackpot) finishes. */
  const MESSAGE_DISPLAY_MS = 10000;
  let bubbleHideTimer = null;
  function showBubblesTemporarily() {
    const bubbles = [document.getElementById("bluePupBubble"), document.getElementById("orangePupBubble")];
    bubbles.forEach((b) => b.classList.add("show"));
    if (bubbleHideTimer) clearTimeout(bubbleHideTimer);
    bubbleHideTimer = setTimeout(() => {
      bubbles.forEach((b) => b.classList.remove("show"));
    }, MESSAGE_DISPLAY_MS);
  }

  /* Build each reel with a long strip of random symbols (drawn
     from the category's symbol pool) so the spin animation has
     plenty of frames to scroll through, ending on a chosen symbol. */
  function buildReelStrip(stripEl, finalSymbol) {
    const REEL_LENGTH = 24;
    let html = "";
    for (let i = 0; i < REEL_LENGTH; i++) {
      html += '<div class="reel-symbol">' + symbolMarkup(pickRandom(config.symbolPool)) + "</div>";
    }
    html += '<div class="reel-symbol">' + symbolMarkup(finalSymbol) + "</div>";
    stripEl.innerHTML = html;
    stripEl.style.transition = "none";
    stripEl.style.transform = "translateY(0)";
    stripEl.classList.add("spinning");
  }

  function spinReelTo(stripEl, finalSymbol, duration, delay) {
    return new Promise((resolve) => {
      buildReelStrip(stripEl, finalSymbol);
      const symbolHeight = stripEl.parentElement.clientHeight; // matches .reel-symbol height via CSS
      const totalSymbols = stripEl.children.length;
      const targetOffset = (totalSymbols - 1) * symbolHeight;

      setTimeout(() => {
        stripEl.style.transition = `transform ${duration}ms cubic-bezier(.2,.8,.3,1)`;
        stripEl.style.transform = `translateY(-${targetOffset}px)`;

        setTimeout(() => {
          stripEl.classList.remove("spinning");
          // Bounce the reel's housing (not the strip itself) so the
          // just-landed symbol doesn't shift out of alignment.
          const reelEl = stripEl.parentElement;
          reelEl.classList.remove("reel-bounce");
          void reelEl.offsetWidth;
          reelEl.classList.add("reel-bounce");
          setTimeout(() => reelEl.classList.remove("reel-bounce"), 360);
          resolve();
        }, duration);
      }, delay);
    });
  }

  /* ---- Win detection ----
     type: "jackpot" | "big" | "small" | "none" */
  function detectWin(symbols, isJackpot) {
    const [a, b, c] = symbols;

    if (isJackpot) {
      return { type: "jackpot", reward: REWARD_TABLE[currentBet].jackpot };
    }
    if (a === b && b === c) {
      // Safety fallback — shouldn't normally happen outside jackpot rolls.
      return { type: "big", reward: applyBonus(REWARD_TABLE[currentBet].big) };
    }
    const matchSymbol = a === b ? a : (b === c ? b : (a === c ? a : null));
    if (matchSymbol) {
      const isHigh = HIGH_SYMBOLS.includes(matchSymbol);
      const reward = isHigh ? REWARD_TABLE[currentBet].big : REWARD_TABLE[currentBet].small;
      return { type: isHigh ? "big" : "small", reward: applyBonus(reward) };
    }
    return { type: "none", reward: config.comfortFloor };
  }

  function applyBonus(reward) {
    if (!config.rewardBonusPct) return reward;
    return Math.round(reward * (1 + config.rewardBonusPct));
  }

  /* ---- Confetti + balloons for jackpot celebration ---- */
  function launchConfetti() {
    const colors = ["#ff8fb1", "#ffc857", "#7fd9a3", "#5aa9e6", "#e8935a"];
    for (let i = 0; i < 46; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = pickRandom(colors);
      piece.style.animationDuration = 2 + Math.random() * 1.5 + "s";
      piece.style.animationDelay = Math.random() * 0.4 + "s";
      confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), 4000);
    }
  }

  function launchBalloons() {
    const colors = ["#ff8fb1", "#ffc857", "#7fd9a3", "#5aa9e6", "#e8935a"];
    for (let i = 0; i < 10; i++) {
      const balloon = document.createElement("div");
      balloon.className = "balloon-piece";
      balloon.style.left = Math.random() * 90 + "vw";
      balloon.style.background = pickRandom(colors);
      balloon.style.setProperty("--drift", (Math.random() * 60 - 30) + "px");
      balloon.style.animationDuration = 4 + Math.random() * 2 + "s";
      balloonLayer.appendChild(balloon);
      setTimeout(() => balloon.remove(), 6500);
    }
  }

  function showJackpotCelebration(reward) {
    currentJackpotMessage = pickJackpotMessage();
    jackpotMsgEl.textContent = currentJackpotMessage;
    jackpotPointsEl.textContent = "+" + reward + " Comfort Points";
    jackpotOverlay.classList.add("visible");
    cabinet.classList.add("jackpot-flash");
    cabinet.classList.add("jackpot-shake");
    setTimeout(() => cabinet.classList.remove("jackpot-shake"), 700);
    bluePupEl.classList.add("celebrate");
    orangePupEl.classList.add("celebrate");
    document.body.classList.add("jackpot-glow");
    launchConfetti();
    launchBalloons();
    playJackpotChime();
  }

  function hideJackpotCelebration() {
    jackpotOverlay.classList.remove("visible");
    cabinet.classList.remove("jackpot-flash");
    bluePupEl.classList.remove("celebrate");
    orangePupEl.classList.remove("celebrate");
    document.body.classList.remove("jackpot-glow");
  }

  /* ---- Modal control ---- */
  function openModal(resultType, reward) {
    const labels = { jackpot: "Jackpot!", big: "Big win", small: "Small win", none: "No match this time" };
    modalResult.textContent = labels[resultType];

    if (resultType === "jackpot") {
      modalTitle.textContent = "🎉 FUTURE YOU BONUS 🎉";
      modalMessage.textContent = '"' + currentJackpotMessage + '"';
      modalMessage.style.display = "";
    } else {
      // Small win, big win, or no match: keep the popup to just the
      // result + reward line. No quote/message here — that's reserved
      // for the jackpot celebration only.
      modalTitle.textContent = "COMFORT REWARD";
      modalMessage.textContent = "";
      modalMessage.style.display = "none";
    }
    modalReward.textContent =
      reward > 0 ? "Reward: +" + reward + " Comfort Points" : "That's okay — no points this time.";
    modalOverlay.classList.add("visible");
  }

  function closeModal() {
    modalOverlay.classList.remove("visible");
  }

  /* ---- Core spin flow ---- */
  async function spin() {
    if (spinning) return;
    if (points < currentBet) {
      comfortMessageEl.textContent = "Not enough points to spin — you're still doing great.";
      showBubblesTemporarily();
      return;
    }

    spinning = true;
    spinBtn.disabled = true;
    betButtons.forEach((b) => (b.disabled = true));
    lever.classList.add("pulled");
    playClickSound();
    startSpinLoop();

    // Deduct the bet immediately
    points -= currentBet;
    setPoints(points);
    renderPoints();

    // Decide jackpot BEFORE rolling symbols
    const isJackpot = Math.random() < config.jackpotChance;

    let finalSymbols;
    if (isJackpot) {
      const jackpotSymbol = pickRandom(config.symbolPool);
      finalSymbols = [jackpotSymbol, jackpotSymbol, jackpotSymbol];
    } else {
      finalSymbols = [pickRandom(config.symbolPool), pickRandom(config.symbolPool), pickRandom(config.symbolPool)];
      // Avoid an accidental jackpot look when not actually a jackpot roll
      if (finalSymbols[0] === finalSymbols[1] && finalSymbols[1] === finalSymbols[2]) {
        const pool = config.symbolPool.filter((s) => s !== finalSymbols[0]);
        finalSymbols[2] = pool.length ? pickRandom(pool) : finalSymbols[2];
      }
    }

    // Spin reels one by one, stopping in sequence for a realistic feel
    await Promise.all([
      spinReelTo(stripEls[0], finalSymbols[0], 1100, 0),
      spinReelTo(stripEls[1], finalSymbols[1], 1500, 150),
      spinReelTo(stripEls[2], finalSymbols[2], 1900, 300)
    ]);

    stopSpinLoop();
    lever.classList.remove("pulled");
    lever.classList.add("lever-bounce");
    setTimeout(() => lever.classList.remove("lever-bounce"), 420);

    // Refresh the encouragement bubbles for this round and reveal
    // them for 10 seconds (they stay hidden the rest of the time)
    refreshBubbles();
    showBubblesTemporarily();

    const result = detectWin(finalSymbols, isJackpot);
    if (result.reward > 0) {
      points += result.reward;
      setPoints(points);
      renderPoints();
    }

    // Comfort Hearts are a rare, non-spendable collectible —
    // earned only on a jackpot, not on small/big wins.
    if (result.type === "jackpot") {
      awardHearts(result.type);
    }

    if (result.type === "small" || result.type === "big") {
      playWinSound(result.type);
    } else if (result.type === "none") {
      playLoseSound();
    }

    // Give the player a clear beat to actually see all 3 landed
    // symbols before a popup covers the reels.
    await wait(1100);

    if (result.type === "jackpot") {
      showJackpotCelebration(result.reward);
      showBubblesTemporarily();
      jackpotContinueBtn.onclick = () => {
        hideJackpotCelebration();
        openModal("jackpot", result.reward);
        spinning = false;
        spinBtn.disabled = false;
        betButtons.forEach((b) => (b.disabled = false));
      };
      return;
    }

    openModal(result.type, result.reward);
    spinning = false;
    spinBtn.disabled = false;
    betButtons.forEach((b) => (b.disabled = false));
  }

  /* ---- Bet selection ---- */
  betButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (spinning) return;
      currentBet = parseInt(btn.getAttribute("data-bet"), 10);
      localStorage.setItem(STORAGE_KEYS.BET, String(currentBet));
      renderBet();
    });
  });

  /* ---- Event wiring ---- */
  spinBtn.addEventListener("click", spin);
  spinAgainBtn.addEventListener("click", () => {
    closeModal();
    spin();
  });
  continueBtn.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  /* ---- Comfort Rewards modal wiring ---- */
  rewardsBtn.addEventListener("click", openRewardsModal);
  rewardsCloseBtn.addEventListener("click", closeRewardsModal);
  rewardRevealCloseBtn.addEventListener("click", hideRewardReveal);
  rewardsOverlay.addEventListener("click", (e) => {
    if (e.target === rewardsOverlay) closeRewardsModal();
  });

  /* ---- Sound toggle ---- */
  function renderSoundToggle() {
    const on = isSoundOn();
    soundToggleBtn.textContent = on ? "🔊" : "🔇";
    soundToggleBtn.setAttribute("aria-label", on ? "Mute sound" : "Unmute sound");
    soundToggleBtn.classList.toggle("muted", !on);
  }
  soundToggleBtn.addEventListener("click", () => {
    const nowOn = !isSoundOn();
    setSoundOn(nowOn);
    renderSoundToggle();
    if (nowOn) {
      playWinSound("small"); // quick audible confirmation it's back on
      startBgMusic();
    } else {
      stopBgMusic();
    }
  });

  /* ---- Initial paint ---- */
  footnoteEl.textContent = config.footnote;
  renderPoints();
  renderBet();
  refreshBubbles();
  renderHearts(false);
  renderSoundToggle();

  // Seed reels with a resting symbol on load (no animation)
  const restingSymbols = [pickRandom(config.symbolPool), pickRandom(config.symbolPool), pickRandom(config.symbolPool)];
  stripEls.forEach((strip, i) => {
    strip.innerHTML = '<div class="reel-symbol">' + symbolMarkup(restingSymbols[i]) + "</div>";
  });

}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initGamePage();
});