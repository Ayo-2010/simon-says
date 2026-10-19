const pads = [...document.querySelectorAll('.pad')];
const startBtn = document.getElementById('startBtn');
const roundEl = document.getElementById('round');
const bestEl = document.getElementById('best');
const statusEl = document.getElementById('status');

const TONES = [329.63, 261.63, 220.0, 164.81];
const BEST_KEY = 'simonBest';

let sequence = [];
let round = 0;
let inputIndex = 0;
let accepting = false;
let audio = null;
let best = Number(localStorage.getItem(BEST_KEY) || 0);

bestEl.textContent = best;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function ensureAudio() {
  if (!audio) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audio = new AudioCtx();
  }
  if (audio.state === 'suspended') audio.resume();
}

function tone(frequency, length = 0.3, volume = 0.22) {
  try {
    ensureAudio();
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length);

    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + length + 0.02);
  } catch (error) {
    return;
  }
}

function flash(index, duration = 320) {
  const pad = pads[index];
  pad.classList.add('lit');
  tone(TONES[index]);
  setTimeout(() => pad.classList.remove('lit'), duration);
}

async function playSequence() {
  accepting = false;
  startBtn.disabled = true;
  statusEl.textContent = 'Watch closely.';

  await sleep(450);

  for (const step of sequence) {
    flash(step, 360);
    await sleep(430);
  }

  inputIndex = 0;
  accepting = true;
  startBtn.disabled = false;
  statusEl.textContent = 'Your turn. Repeat the pattern.';
}

function nextRound() {
  if (!sequence.length && round === 0) {
    round = 1;
  } else {
    round++;
  }

  roundEl.textContent = round;

  if (round > best) {
    best = round;
    bestEl.textContent = best;
    localStorage.setItem(BEST_KEY, String(best));
  }

  sequence.push(Math.floor(Math.random() * 4));
  playSequence();
}

function fail() {
  accepting = false;
  startBtn.disabled = false;
  startBtn.textContent = 'Play again';
  statusEl.textContent = `Wrong pad. You reached round ${round}.`;
  tone(110, 0.5, 0.18);
  setTimeout(() => tone(82, 0.6, 0.16), 120);
}

function press(index) {
  if (!accepting) return;

  flash(index, 260);

  if (index !== sequence[inputIndex]) {
    fail();
    return;
  }

  inputIndex++;

  if (inputIndex === sequence.length) {
    accepting = false;
    statusEl.textContent = 'Nice. Here comes the next one.';
    setTimeout(nextRound, 850);
  }
}

function startGame() {
  sequence = [];
  round = 0;
  inputIndex = 0;
  accepting = false;
  roundEl.textContent = '0';
  startBtn.textContent = 'Restart';
  startBtn.disabled = false;
  pads.forEach((pad) => pad.classList.remove('lit'));

  nextRound();
}

pads.forEach((pad, index) => {
  pad.addEventListener('click', () => press(index));
});

startBtn.addEventListener('click', startGame);

const helpTrigger = document.getElementById('helpBtn');
const helpOverlay = document.getElementById('helpModal');
const helpCloseBtn = document.getElementById('helpClose');

function openHelp() {
  helpOverlay.hidden = false;
  document.body.classList.add('help-open');
  helpCloseBtn.focus();
}

function closeHelp() {
  if (helpOverlay.hidden) return;

  helpOverlay.hidden = true;
  document.body.classList.remove('help-open');
  helpTrigger.focus();
}

helpTrigger.addEventListener('click', openHelp);
helpCloseBtn.addEventListener('click', closeHelp);
helpOverlay.querySelectorAll('[data-close]').forEach((element) => {
  element.addEventListener('click', closeHelp);
});

document.addEventListener('keydown', (event) => {
  if (helpOverlay.hidden) return;

  if (event.key === 'Escape') {
    closeHelp();
    event.stopImmediatePropagation();
    return;
  }

  if (event.key !== 'Tab') {
    event.preventDefault();
  }

  event.stopImmediatePropagation();
}, true);
