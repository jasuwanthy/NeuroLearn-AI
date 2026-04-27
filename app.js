
// ══════════════════════════════════════════
// NeuroLearn Pro — Complete Application JS
// All features, all modes
// ══════════════════════════════════════════

// ── STATE ──
const state = {
  // ADHD
  xp: parseInt(localStorage.getItem('xp') || '175'),
  level: parseInt(localStorage.getItem('level') || '3'),
  streak: parseInt(localStorage.getItem('streak') || '3'),
  missionsDone: 0,
  pomodoroRunning: false,
  pomodoroInterval: null,
  pomodoroSeconds: 25 * 60,
  pomodoroTotal: 25 * 60,
  pomodoroSession: 1,
  pomodoroBreak: false,
  hyperfocusActive: false,
  urgencyInterval: null,
  urgencyTotal: 0,
  reminders: [],
  // Dyslexia
  ttsActive: false,
  ttsUtterance: null,
  rulerActive: true,
  dyslexicFont: false,
  chunks: [],
  currentChunk: 0,
  wordsRead: 0,
  audioRecording: false,
  audioNotes: [],
  // Autism
  vtimerRunning: false,
  vtimerInterval: null,
  vtimerSeconds: 5 * 60,
  vtimerTotal: 5 * 60,
  currentStep: 0,
  safeModeActive: false,
  animationsReduced: false,
  breatheInterval: null,
  breathPattern: { in: 4, hold: 4, out: 4, pause: 4, name: 'Box' },
  groundingStep: 0,
  routineItems: [],
  // Global
  currentMode: null,
  currentMood: null,
};

// Levels
const levels = [
  { xp: 0,   name: 'Spark',         lv: 1 },
  { xp: 100, name: 'Igniter',       lv: 2 },
  { xp: 250, name: 'Focus Warrior', lv: 3 },
  { xp: 500, name: 'Flow Master',   lv: 4 },
  { xp: 800, name: 'Hyper Hero',    lv: 5 },
  { xp: 1200,name: 'Cosmos Mind',   lv: 6 },
];

// ══════════════ NAVIGATION ══════════════

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id === 'landing' ? 'landing' : id + '-mode');
  if (page) page.classList.add('active');
  state.currentMode = id;
}

function enterMode(mode) {
  showPage(mode);
  if (mode === 'adhd') initADHD();
  if (mode === 'dyslexia') initDyslexia();
  if (mode === 'autism') initAutism();
}

// ══════════════ ADHD MODE ══════════════

function initADHD() {
  updateXPDisplay();
  updateFocusRing(85);
  drawMoodChart();
}

// ── Pomodoro ──
function togglePomodoro() {
  if (state.pomodoroRunning) {
    clearInterval(state.pomodoroInterval);
    state.pomodoroRunning = false;
    document.getElementById('pomodoro-btn').textContent = '▶ Start';
  } else {
    state.pomodoroRunning = true;
    document.getElementById('pomodoro-btn').textContent = '⏸ Pause';
    state.pomodoroInterval = setInterval(tickPomodoro, 1000);
  }
}

function tickPomodoro() {
  state.pomodoroSeconds--;
  if (state.pomodoroSeconds < 0) {
    completePomodoro();
    return;
  }
  const m = Math.floor(state.pomodoroSeconds / 60).toString().padStart(2, '0');
  const s = (state.pomodoroSeconds % 60).toString().padStart(2, '0');
  document.getElementById('pomodoro-display').textContent = `${m}:${s}`;
  const pct = (state.pomodoroSeconds / state.pomodoroTotal) * 100;
  document.getElementById('pomodoro-bar').style.width = pct + '%';
}

function completePomodoro() {
  clearInterval(state.pomodoroInterval);
  state.pomodoroRunning = false;
  document.getElementById('pomodoro-btn').textContent = '▶ Start';

  if (!state.pomodoroBreak) {
    // Completed focus session
    addXP(50);
    showToast('🎉 Focus session done! +50 XP!');
    state.pomodoroSession++;
    document.getElementById('session-num').textContent = state.pomodoroSession;
    // Switch to break
    state.pomodoroBreak = true;
    const breakTime = state.pomodoroSession % 4 === 0 ? 15 * 60 : 5 * 60;
    state.pomodoroSeconds = breakTime;
    state.pomodoroTotal = breakTime;
    document.getElementById('pomodoro-type').textContent = 'BREAK';
    document.getElementById('session-mode-label').textContent = 'Take a breather!';
  } else {
    // Completed break
    state.pomodoroBreak = false;
    // Dynamic adjustment: adjust based on performance
    const dynamicTime = Math.min(50, 25 + Math.floor(state.xp / 200)) * 60;
    state.pomodoroSeconds = dynamicTime;
    state.pomodoroTotal = dynamicTime;
    document.getElementById('pomodoro-type').textContent = 'FOCUS';
    document.getElementById('session-mode-label').textContent = 'Focus time!';
    showToast('Break over! Ready to focus? ⚡');
  }
  updatePomodoroDisplay();
  speakText(state.pomodoroBreak ? 'Great job! Take a short break.' : 'Break time is over. Let\'s focus!');
}

function resetPomodoro() {
  clearInterval(state.pomodoroInterval);
  state.pomodoroRunning = false;
  state.pomodoroBreak = false;
  state.pomodoroSeconds = 25 * 60;
  state.pomodoroTotal = 25 * 60;
  document.getElementById('pomodoro-btn').textContent = '▶ Start';
  document.getElementById('pomodoro-type').textContent = 'FOCUS';
  updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
  const m = Math.floor(state.pomodoroSeconds / 60).toString().padStart(2, '0');
  const s = (state.pomodoroSeconds % 60).toString().padStart(2, '0');
  document.getElementById('pomodoro-display').textContent = `${m}:${s}`;
  document.getElementById('pomodoro-bar').style.width = '100%';
}

// ── Hyperfocus ──
function toggleHyperfocus() {
  state.hyperfocusActive = !state.hyperfocusActive;
  const bar = document.getElementById('hyperfocus-bar');
  if (state.hyperfocusActive) {
    bar.classList.add('active');
    document.body.style.overflow = 'hidden';
    showToast('🎯 Hyperfocus Mode ON — Stay in the zone!');
    logDistraction('Hyperfocus activated');
  } else {
    bar.classList.remove('active');
    document.body.style.overflow = '';
    showToast('Hyperfocus Mode off');
  }
}

// ── Task Chunker ──
function chunkTask() {
  const input = document.getElementById('task-input');
  const task = input.value.trim();
  if (!task) { showToast('Enter a task first!'); return; }

  const chunks = generateChunks(task);
  const container = document.getElementById('task-chunks');
  container.innerHTML = '';

  chunks.forEach((chunk, i) => {
    const div = document.createElement('div');
    div.className = 'chunk-item';
    div.innerHTML = `
      <div class="chunk-num">${i + 1}</div>
      <div class="chunk-text">${chunk}</div>
      <div class="chunk-check" onclick="toggleChunk(this)"></div>
    `;
    container.appendChild(div);
    setTimeout(() => div.style.opacity = '1', i * 100);
  });

  input.value = '';
  addXP(10);
  showToast('✂️ Task chunked into micro-steps! +10 XP');
}

function generateChunks(task) {
  // AI-like task decomposition patterns
  const t = task.toLowerCase();
  if (t.includes('essay') || t.includes('write')) {
    return [
      '📌 Brainstorm 3 main ideas (5 min)',
      '📋 Create a simple outline',
      '✍️ Write the introduction paragraph',
      '📝 Write body paragraph 1',
      '📝 Write body paragraph 2',
      '🔚 Write the conclusion',
      '✅ Review and spell-check'
    ];
  }
  if (t.includes('math') || t.includes('homework')) {
    return [
      '📖 Read through all questions first',
      '⭐ Star the easiest questions',
      '✏️ Solve the starred questions',
      '🔍 Try the medium difficulty questions',
      '💡 Review formulas for hard questions',
      '✅ Double-check your answers'
    ];
  }
  if (t.includes('study') || t.includes('learn') || t.includes('read')) {
    return [
      '📚 Gather all materials needed',
      '👀 Skim headings and highlights first',
      '📖 Read section 1 carefully',
      '📝 Write 3 key takeaways',
      '📖 Read section 2 carefully',
      '📝 Write 3 more key takeaways',
      '🔁 Review all notes'
    ];
  }
  if (t.includes('project') || t.includes('present')) {
    return [
      '🎯 Define the goal in one sentence',
      '📋 List all required components',
      '🔍 Research / gather information',
      '📐 Create a rough draft / outline',
      '🛠 Build the first version',
      '🔄 Review and improve',
      '✅ Final check and submit'
    ];
  }
  // Generic task breakdown
  const words = task.split(' ').slice(0, 3).join(' ');
  return [
    `🧹 Clear your space for "${words}"`,
    `📋 Write down what "done" looks like`,
    `⏱ Set a 10-min timer and just START`,
    `✅ Complete the first small part`,
    `🔄 Review progress and continue`,
    `🎉 Finish and celebrate!`
  ];
}

function toggleChunk(el) {
  el.classList.toggle('done');
  if (el.classList.contains('done')) {
    el.textContent = '✓';
    addXP(5);
    showToast('+5 XP — micro-step done! 🎯');
    checkMissions();
  } else {
    el.textContent = '';
  }
}

// ── 2-Minute Start ──
function startTwoMin() {
  showToast('⚡ 2-Minute Start — Just open your notebook NOW!');
  speakText('Okay, just start! Open your notebook right now. You can do this!');
  // Trigger urgency mode for 2 min
  startUrgencyMode(2, 'Get started — just 2 minutes!');
}

// ── Urgency Mode ──
function startUrgencyMode(minutes, label) {
  const card = document.getElementById('urgency-card');
  card.style.display = 'block';
  document.getElementById('urgency-task-label').textContent = label || 'Complete your task!';

  let seconds = minutes * 60;
  state.urgencyTotal = seconds;

  clearInterval(state.urgencyInterval);
  state.urgencyInterval = setInterval(() => {
    seconds--;
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('urgency-countdown').textContent = `${m}:${s}`;
    const pct = (seconds / state.urgencyTotal) * 100;
    document.getElementById('urgency-fill').style.width = pct + '%';
    if (seconds <= 0) {
      clearInterval(state.urgencyInterval);
      card.style.display = 'none';
      showToast('⏰ Time\'s up! Did you start?');
    }
  }, 1000);
}

// ── XP System ──
function addXP(amount) {
  state.xp += amount;
  localStorage.setItem('xp', state.xp);
  updateXPDisplay();
  showXPPop(amount);
  checkLevelUp();
}

function updateXPDisplay() {
  document.getElementById('adhd-xp').textContent = state.xp + ' XP';
  document.getElementById('xp-current').textContent = state.xp;
  document.getElementById('user-level').textContent = state.level;
  document.getElementById('adhd-streak').textContent = state.streak + ' 🔥';

  const currentLevel = levels.filter(l => l.xp <= state.xp).pop();
  const nextLevel = levels.find(l => l.xp > state.xp);
  document.getElementById('level-name').textContent = currentLevel?.name || 'Spark';

  const progress = nextLevel
    ? ((state.xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100
    : 100;
  document.getElementById('xp-bar').style.width = progress + '%';
}

function checkLevelUp() {
  const newLevel = levels.filter(l => l.xp <= state.xp).pop();
  if (newLevel && newLevel.lv > state.level) {
    state.level = newLevel.lv;
    localStorage.setItem('level', state.level);
    showToast(`🎉 LEVEL UP! You're now Level ${state.level} — ${newLevel.name}!`);
    speakText(`Congratulations! You leveled up to ${newLevel.name}!`);
  }
}

function showXPPop(amount) {
  const pop = document.createElement('div');
  pop.className = 'xp-pop';
  pop.textContent = `+${amount} XP`;
  pop.style.left = '50%';
  pop.style.top = '30%';
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 800);
}

// ── Missions ──
function checkMissions() {
  // Check and update missions
  const items = document.querySelectorAll('.mission-item');
  let done = 0;
  items.forEach(item => { if (item.classList.contains('completed')) done++; });
  document.getElementById('missions-done').textContent = `${done}/3`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.mission-item').forEach(item => {
    item.addEventListener('click', function() {
      if (!this.classList.contains('completed')) {
        this.classList.add('completed');
        this.querySelector('.mission-status').textContent = '✓';
        const reward = parseInt(this.querySelector('.mission-reward').textContent.match(/\d+/)[0]);
        addXP(reward);
        state.missionsDone++;
        document.getElementById('missions-done').textContent = `${state.missionsDone}/3`;
        showToast(`Quest complete! +${reward} XP 🎉`);
      }
    });
  });
});

// ── Focus Ring ──
function updateFocusRing(percent) {
  const circumference = 251;
  const offset = circumference - (percent / 100) * circumference;
  const fill = document.getElementById('focus-ring-fill');
  if (fill) fill.style.strokeDashoffset = offset;
  const score = document.getElementById('focus-score');
  if (score) score.textContent = percent;
}

function logDistraction(reason) {
  const log = document.getElementById('distraction-log');
  if (!log) return;
  const item = document.createElement('div');
  item.style.cssText = 'font-size:0.78rem;padding:4px 0;color:var(--text-muted);border-bottom:1px solid rgba(255,255,255,0.05)';
  item.textContent = `${new Date().toLocaleTimeString()} — ${reason}`;
  log.innerHTML = '';
  log.appendChild(item);
}

// Detect visibility changes (distraction tracking)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.currentMode === 'adhd') {
    logDistraction('Tab switched / left focus');
    const score = Math.max(40, parseInt(document.getElementById('focus-score')?.textContent || 85) - 5);
    updateFocusRing(score);
  }
});

// ── Coach ──
const coachAdvice = [
  "You're doing amazing! Remember: done is better than perfect. Take one step at a time! 🚀",
  "Feeling stuck? Try the 2-Minute Start — just open your notebook, nothing else. ⚡",
  "Your brain is wired for big ideas! Break your task into the tiniest possible step. 🧩",
  "Dopamine boost tip: Cross off something small first. The momentum will carry you! ✅",
  "It's okay to switch tasks if you're truly stuck — come back with fresh eyes! 🔄",
  "You've got this! Your streak proves you keep showing up. That's everything. 🔥",
];

let coachIdx = 0;
function getCoachAdvice() {
  document.getElementById('coach-modal').classList.add('active');
  const msgs = document.getElementById('coach-messages');
  const msg = document.createElement('div');
  msg.className = 'convo-msg ai-msg';
  msg.textContent = coachAdvice[coachIdx % coachAdvice.length];
  coachIdx++;
  msgs.appendChild(msg);
  msgs.scrollTop = msgs.scrollHeight;
}

function sendCoachMessage() {
  const input = document.getElementById('coach-input');
  const text = input.value.trim();
  if (!text) return;

  const msgs = document.getElementById('coach-messages');
  const userMsg = document.createElement('div');
  userMsg.className = 'convo-msg user-msg';
  userMsg.textContent = text;
  msgs.appendChild(userMsg);

  input.value = '';

  setTimeout(() => {
    const aiMsg = document.createElement('div');
    aiMsg.className = 'convo-msg ai-msg';
    aiMsg.textContent = generateCoachResponse(text);
    msgs.appendChild(aiMsg);
    msgs.scrollTop = msgs.scrollHeight;
  }, 800);
}

function generateCoachResponse(msg) {
  const m = msg.toLowerCase();
  if (m.includes('stuck') || m.includes('can\'t')) return "I hear you! Try the 2-Minute Start technique — just tell yourself you'll work for exactly 2 minutes. That's it. Usually momentum takes over! ⚡";
  if (m.includes('distract') || m.includes('focus')) return "Activate Hyperfocus Mode! It'll lock everything else out. Also try moving — sometimes a quick walk resets the brain perfectly. 🎯";
  if (m.includes('tired') || m.includes('tired')) return "Rest is part of the process! Take a 5-minute break — set the timer right now. You've earned it, and you'll come back sharper! 😴";
  if (m.includes('help') || m.includes('overwhelm')) return "Let's break it down! What's the ONE smallest thing you could do right now? Just one. Tell me what your task is and I'll help you chunk it! 🧩";
  return coachAdvice[Math.floor(Math.random() * coachAdvice.length)];
}

// ── Voice Reminders ──
function speakText(text) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}

function setVoiceReminder() {
  const text = document.getElementById('reminder-text').value.trim();
  if (!text) { showToast('Enter a reminder first!'); return; }

  state.reminders.push(text);
  const list = document.getElementById('reminders-list');
  const item = document.createElement('div');
  item.className = 'reminder-item';
  item.innerHTML = `<span>🔔</span><span style="flex:1">${text}</span><span style="cursor:pointer;color:var(--text-muted)" onclick="this.parentElement.remove()">✕</span>`;
  list.appendChild(item);

  document.getElementById('reminder-text').value = '';
  showToast('🔔 Reminder set!');
  speakText('Reminder saved: ' + text);
}

// ── Moods ──
function setMood(mood, emoji) {
  state.currentMood = mood;
  const storage = JSON.parse(localStorage.getItem('moodHistory') || '[]');
  storage.push({ mood, emoji, time: Date.now() });
  localStorage.setItem('moodHistory', JSON.stringify(storage.slice(-14)));
  showToast(`Mood logged: ${emoji}`);
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  event.target.classList.add('selected');
}

function drawMoodChart() {
  const canvas = document.getElementById('mood-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const history = JSON.parse(localStorage.getItem('moodHistory') || '[]').slice(-7);
  const moodScore = { amazing: 5, good: 4, okay: 3, rough: 2, overwhelmed: 1 };
  const scores = history.map(h => moodScore[h.mood] || 3);
  if (scores.length < 2) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, '#FF6B35');
  gradient.addColorStop(1, '#FFB347');

  ctx.beginPath();
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  scores.forEach((score, i) => {
    const x = (i / (scores.length - 1)) * canvas.width;
    const y = canvas.height - (score / 5) * canvas.height;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// ── Themes ──
function setTheme(mode, theme) {
  document.querySelectorAll('.theme-chip').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  showToast(`Theme: ${theme} applied! 🎨`);
}

// ══════════════ DYSLEXIA MODE ══════════════

function initDyslexia() {
  toggleRuler(true);
}

// ── Font ──
function setDyslexiaFont(type) {
  document.getElementById('font-normal').classList.toggle('active', type === 'normal');
  document.getElementById('font-dyslexic').classList.toggle('active', type === 'dyslexic');
  document.body.classList.toggle('font-dyslexic', type === 'dyslexic');
  state.dyslexicFont = type === 'dyslexic';
  showToast(type === 'dyslexic' ? '📖 OpenDyslexic font enabled!' : 'Standard font enabled');
}

// ── Spacing ──
function updateSpacing() {
  const ls = document.getElementById('letter-spacing').value;
  const ws = document.getElementById('word-spacing').value;
  const lh = document.getElementById('line-height').value;
  const fs = document.getElementById('font-size-slider').value;

  document.getElementById('letter-val').textContent = ls + 'px';
  document.getElementById('word-val').textContent = ws + 'px';
  document.getElementById('line-val').textContent = (lh / 10).toFixed(1);
  document.getElementById('size-val').textContent = fs + 'px';

  const txt = document.getElementById('tts-content');
  if (txt) {
    txt.style.letterSpacing = ls + 'px';
    txt.style.wordSpacing = ws + 'px';
    txt.style.lineHeight = lh / 10;
    txt.style.fontSize = fs + 'px';
  }
}

// ── Color Overlay ──
function setOverlay(color) {
  const page = document.getElementById('dyslexia-mode');
  if (color === 'none') {
    page.style.background = '';
  } else {
    page.style.background = `linear-gradient(${color}, ${color})`;
  }
}

// ── Reading Ruler ──
function toggleRuler(on) {
  state.rulerActive = on;
  document.getElementById('ruler-off').classList.toggle('active', !on);
  document.getElementById('ruler-on').classList.toggle('active', on);
  const ruler = document.getElementById('reading-ruler');
  ruler.style.display = on ? 'block' : 'none';
}

function moveRuler(e) {
  if (!state.rulerActive) return;
  const ruler = document.getElementById('reading-ruler');
  const rect = e.currentTarget.getBoundingClientRect();
  ruler.style.top = (e.clientY - rect.top - 14) + 'px';
}

// ── TTS ──
function toggleTTS() {
  if (state.ttsActive) {
    stopTTS();
  } else {
    startTTS();
  }
}

function startTTS() {
  if (!window.speechSynthesis) { showToast('TTS not supported in this browser'); return; }
  const text = document.getElementById('tts-content')?.innerText || '';
  if (!text.trim()) { showToast('No text to read!'); return; }

  state.ttsActive = true;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1;
  state.ttsUtterance = utterance;

  utterance.onboundary = (e) => {
    if (e.name === 'word') highlightWord(text, e.charIndex);
    state.wordsRead++;
    document.getElementById('words-read').textContent = state.wordsRead;
  };

  utterance.onend = () => {
    state.ttsActive = false;
    document.getElementById('tts-play-btn').textContent = '🔊 Read Aloud';
  };

  window.speechSynthesis.speak(utterance);
  document.getElementById('tts-play-btn').textContent = '⏸ Pause';
  showToast('🔊 Reading aloud...');
}

function stopTTS() {
  window.speechSynthesis.cancel();
  state.ttsActive = false;
  const btn = document.getElementById('tts-play-btn');
  if (btn) btn.textContent = '🔊 Read Aloud';
}

function highlightWord(text, charIndex) {
  // Visual word highlight in TTS content
  // Simplified implementation — full implementation would use spans
}

// ── Focus Reading ──
function toggleFocusReading() {
  const overlay = document.getElementById('focus-reading-overlay');
  const text = document.getElementById('tts-content')?.innerText || '';
  document.getElementById('focus-text').textContent = text;
  overlay.classList.add('active');
}

function closeFocusReading() {
  document.getElementById('focus-reading-overlay').classList.remove('active');
}

// ── Text Simplification ──
function aiSimplify() {
  const input = document.getElementById('simplify-input').value.trim();
  if (!input) { showToast('Paste some text to simplify!'); return; }

  const output = document.getElementById('simplified-output');
  output.innerHTML = '<div class="loading-shimmer" style="height:60px;border-radius:8px"></div>';

  setTimeout(() => {
    const simplified = simplifyTextLocal(input);
    output.innerHTML = `<strong style="color:var(--dyslexia-secondary);font-size:0.78rem;display:block;margin-bottom:8px">✨ Simplified Version</strong>${simplified}`;
  }, 1200);
}

function simplifyTextLocal(text) {
  // Local text simplification (in a real app, this calls the AI API)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const simplified = sentences.map(s => {
    return s.trim()
      .replace(/\badenosine triphosphate\b/gi, 'ATP (energy)')
      .replace(/\bphosphorylation\b/gi, 'energy making')
      .replace(/\bmitochondria\b/gi, 'powerhouse part of the cell')
      .replace(/\bresponsible for\b/gi, 'makes')
      .replace(/\bsurrounded by\b/gi, 'wrapped in')
      .replace(/\bsubstantially\b/gi, 'a lot')
      .replace(/\butilize\b/gi, 'use')
      .replace(/\bfacilitate\b/gi, 'help')
      .replace(/\bdemonstrate\b/gi, 'show');
  }).join('. ') + '.';

  return `<span style="font-family:var(--font-body);font-size:0.95rem;line-height:1.8">${simplified}</span>`;
}

// ── Chunked View ──
function showChunked() {
  const text = document.getElementById('tts-content')?.innerText || '';
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  const chunkSize = 2;
  state.chunks = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    state.chunks.push(sentences.slice(i, i + chunkSize).join(' '));
  }
  state.currentChunk = 0;

  document.getElementById('chunk-view-card').style.display = 'block';
  updateChunkDisplay();
}

function updateChunkDisplay() {
  const display = document.getElementById('chunk-display');
  const counter = document.getElementById('chunk-counter');
  if (state.chunks.length === 0) return;
  display.textContent = state.chunks[state.currentChunk];
  counter.textContent = `${state.currentChunk + 1} / ${state.chunks.length}`;
}

function nextChunk() {
  if (state.currentChunk < state.chunks.length - 1) {
    state.currentChunk++;
    updateChunkDisplay();
  }
}

function prevChunk() {
  if (state.currentChunk > 0) {
    state.currentChunk--;
    updateChunkDisplay();
  }
}

// ── Word Prediction ──
const wordDatabase = {
  'the': ['the', 'they', 'their', 'there', 'then', 'these'],
  'bec': ['because', 'become', 'began', 'before'],
  'com': ['complete', 'computer', 'come', 'common', 'compare'],
  'str': ['strong', 'structure', 'strategy', 'stretch', 'stream'],
  'und': ['understand', 'under', 'unique', 'united'],
  'stu': ['study', 'student', 'stuck', 'stumble'],
  'lea': ['learn', 'lead', 'leave', 'leap', 'least'],
  'im': ['important', 'improve', 'impact', 'imagine', 'imply'],
  'pro': ['problem', 'process', 'provide', 'project', 'produce'],
  'in': ['information', 'include', 'instead', 'individual', 'increase'],
};

function predictWords(val) {
  const container = document.getElementById('word-suggestions');
  if (!val || val.length < 2) { container.innerHTML = ''; return; }

  const lower = val.toLowerCase();
  let predictions = [];
  for (const [key, words] of Object.entries(wordDatabase)) {
    if (key.startsWith(lower) || lower.startsWith(key)) {
      predictions.push(...words.filter(w => w.startsWith(lower)));
    }
  }

  // Fallback common words
  const commons = ['and', 'the', 'that', 'this', 'with', 'from', 'they', 'have', 'because', 'when', 'where', 'what'];
  predictions.push(...commons.filter(w => w.startsWith(lower)));

  const unique = [...new Set(predictions)].slice(0, 5);
  container.innerHTML = unique.map(w =>
    `<button class="word-sug-btn" onclick="insertWord('${w}')">${w}</button>`
  ).join('');
}

function insertWord(word) {
  const input = document.getElementById('word-predict-input');
  input.value = word + ' ';
  input.focus();
  document.getElementById('word-suggestions').innerHTML = '';
}

// ── Visual Dictionary ──
const dictionary = {
  'cell': { type: 'noun', def: 'The smallest unit of life. All living things are made of cells. Think of it like a tiny room inside your body!', emoji: '🔬' },
  'mitochondria': { type: 'noun', def: 'The "power station" of the cell. It creates energy your body needs to move, think, and grow.', emoji: '⚡' },
  'photosynthesis': { type: 'noun', def: 'How plants make food using sunlight, water, and air. Like a solar panel for plants!', emoji: '🌱' },
  'gravity': { type: 'noun', def: 'An invisible force that pulls things down toward Earth. It\'s why we don\'t float away!', emoji: '🌍' },
  'democracy': { type: 'noun', def: 'A way of running a country where people get to vote for their leaders.', emoji: '🗳️' },
  'metaphor': { type: 'noun', def: 'Describing something by saying it IS something else. Example: "Life is a journey."', emoji: '📝' },
};

function lookupWord() {
  const word = document.getElementById('dict-word').value.trim().toLowerCase();
  const result = document.getElementById('dict-result');

  const entry = dictionary[word] || {
    type: 'word',
    def: `"${word}" — This word means something specific in context. Try looking it up with context for the best understanding!`,
    emoji: '📖'
  };

  result.innerHTML = `
    <div class="dict-word-title">${word.charAt(0).toUpperCase() + word.slice(1)} ${entry.emoji}</div>
    <div class="dict-word-type">${entry.type}</div>
    <div class="dict-word-def">${entry.def}</div>
  `;
}

// ── Sample Text ──
function loadSampleText() {
  document.getElementById('tts-content').innerText = `The water cycle is how water moves around Earth. First, the sun heats water in oceans and lakes. This water turns into water vapor and rises up into the air. When water vapor cools down high in the sky, it turns back into tiny water drops. These drops form clouds. When enough drops come together, they fall as rain or snow. This water flows into rivers and oceans, and the cycle begins again. The water cycle is important because it gives us fresh water to drink and helps plants grow.`;
}

// ── Audio Notes ──
function toggleAudioNote() {
  if (!state.audioRecording) {
    state.audioRecording = true;
    document.getElementById('audio-note-btn').textContent = '⏹ Stop Recording';
    document.getElementById('audio-note-btn').style.color = 'var(--dyslexia-secondary)';
    showToast('🎙 Recording... (speak your note)');
    setTimeout(() => {
      if (state.audioRecording) stopAudioNote();
    }, 30000);
  } else {
    stopAudioNote();
  }
}

function stopAudioNote() {
  state.audioRecording = false;
  document.getElementById('audio-note-btn').textContent = '● Start Recording';
  document.getElementById('audio-note-btn').style.color = '';

  const note = { id: Date.now(), label: `Note ${state.audioNotes.length + 1}`, time: new Date().toLocaleTimeString() };
  state.audioNotes.push(note);

  const list = document.getElementById('audio-notes-list');
  const item = document.createElement('div');
  item.className = 'audio-note-item';
  item.innerHTML = `<span>🎙</span><span style="flex:1">${note.label} · ${note.time}</span><button class="btn-ghost small" onclick="speakText('Replaying audio note ${note.id}')">▶</button>`;
  list.appendChild(item);
  showToast('🎙 Audio note saved!');
}

// ══════════════ AUTISM MODE ══════════════

function initAutism() {
  setupVTimer();
}

// ── Sensory Panel ──
function updateSensory() {
  const sound = document.getElementById('sound-slider').value;
  const bright = document.getElementById('brightness-slider').value;

  const soundLabels = { 0: 'Silent', 25: 'Very Low', 50: 'Medium', 75: 'High', 100: 'Full' };
  document.getElementById('sound-val').textContent = soundLabels[Math.round(sound / 25) * 25] || 'Custom';
  document.getElementById('bright-val').textContent = bright + '%';

  // Apply brightness to autism mode
  document.getElementById('autism-mode').style.filter = `brightness(${bright}%)`;
}

function toggleAnimations() {
  state.animationsReduced = !state.animationsReduced;
  const toggle = document.getElementById('anim-toggle');
  toggle.classList.toggle('on', state.animationsReduced);

  if (state.animationsReduced) {
    document.documentElement.style.setProperty('--transition', 'none');
    showToast('✅ Animations reduced');
  } else {
    document.documentElement.style.setProperty('--transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
    showToast('Animations restored');
  }
}

function setAutismTheme(color) {
  document.querySelectorAll('.a-theme').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  const colors = {
    green: '#2D9C7F', blue: '#7EC8E3', lavender: '#C8B6E2', warm: '#F8C8A0'
  };
  document.documentElement.style.setProperty('--autism-primary', colors[color]);
  showToast(`Theme: ${color} 🎨`);
}

// ── Visual Timer ──
function setupVTimer() {
  updateVTimerDisplay();
}

function setVTimer(minutes) {
  state.vtimerSeconds = minutes * 60;
  state.vtimerTotal = minutes * 60;
  clearInterval(state.vtimerInterval);
  state.vtimerRunning = false;
  document.getElementById('vtimer-btn').textContent = '▶ Start';
  updateVTimerDisplay();
}

function toggleVTimer() {
  if (state.vtimerRunning) {
    clearInterval(state.vtimerInterval);
    state.vtimerRunning = false;
    document.getElementById('vtimer-btn').textContent = '▶ Resume';
  } else {
    state.vtimerRunning = true;
    document.getElementById('vtimer-btn').textContent = '⏸ Pause';
    state.vtimerInterval = setInterval(tickVTimer, 1000);
  }
}

function tickVTimer() {
  state.vtimerSeconds--;
  if (state.vtimerSeconds < 0) {
    clearInterval(state.vtimerInterval);
    state.vtimerRunning = false;
    document.getElementById('vtimer-btn').textContent = '▶ Start';
    document.getElementById('vtimer-label').textContent = 'Done! ✓';
    showToast('⏱ Timer complete!');
    speakText('Timer finished. Great job!');
    return;
  }
  updateVTimerDisplay();
}

function updateVTimerDisplay() {
  const m = Math.floor(state.vtimerSeconds / 60).toString().padStart(2, '0');
  const s = (state.vtimerSeconds % 60).toString().padStart(2, '0');
  document.getElementById('vtimer-display').textContent = `${m}:${s}`;

  const circumference = 339.29;
  const pct = state.vtimerTotal > 0 ? state.vtimerSeconds / state.vtimerTotal : 1;
  const offset = circumference - pct * circumference;
  const circle = document.getElementById('vtimer-circle');
  if (circle) circle.style.strokeDashoffset = offset;

  const remaining = state.vtimerSeconds;
  if (remaining > 60) document.getElementById('vtimer-label').textContent = 'Focus!';
  else if (remaining > 0) document.getElementById('vtimer-label').textContent = '⚠️ Almost!';
}

function resetVTimer() {
  clearInterval(state.vtimerInterval);
  state.vtimerRunning = false;
  state.vtimerSeconds = state.vtimerTotal;
  document.getElementById('vtimer-btn').textContent = '▶ Start';
  document.getElementById('vtimer-label').textContent = 'Ready';
  updateVTimerDisplay();
}

// ── Steps ──
const steps = [
  { instruction: 'Open your notebook and write today\'s date at the top.', emoji: '📓' },
  { instruction: 'Write the topic or subject at the top of the page.', emoji: '✏️' },
  { instruction: 'Read the first paragraph or section slowly.', emoji: '📖' },
  { instruction: 'Write 2 things you learned in your own words.', emoji: '💡' },
  { instruction: 'Ask yourself: "Do I understand this?" If yes, move on. If no, re-read.', emoji: '🤔' },
];

function nextStep() {
  if (state.currentStep < steps.length - 1) {
    state.currentStep++;
    updateStepDisplay();
  } else {
    showToast('🎉 All steps complete! Amazing work!');
    addXP && addXP(25);
  }
}

function prevStep() {
  if (state.currentStep > 0) {
    state.currentStep--;
    updateStepDisplay();
  }
}

function updateStepDisplay() {
  const step = steps[state.currentStep];
  document.getElementById('step-instruction').textContent = step.instruction;
  document.querySelector('.step-visual').textContent = step.emoji;
  document.querySelector('.step-number').textContent = `Step ${state.currentStep + 1}`;
  document.getElementById('step-progress-label').textContent = `Step ${state.currentStep + 1} of ${steps.length}`;
  document.getElementById('prev-step-btn').disabled = state.currentStep === 0;

  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === state.currentStep);
  });
}

// ── Safe Mode ──
function toggleSafeMode() {
  state.safeModeActive = !state.safeModeActive;
  const layout = document.getElementById('autism-layout');
  const btn = document.getElementById('safe-mode-btn');

  layout.classList.toggle('safe-mode-active', state.safeModeActive);
  btn.classList.toggle('active', state.safeModeActive);
  btn.textContent = state.safeModeActive ? '🛡 Safe Mode ON' : '🛡 Safe Mode';

  if (state.safeModeActive) {
    showToast('🛡 Safe Mode: Simplified view enabled');
    document.documentElement.style.setProperty('--transition', 'none');
  } else {
    document.documentElement.style.setProperty('--transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
  }
}

// ── Social Story Generator ──
const socialStories = {
  meeting_new: [
    'When I meet someone new, they are also meeting me for the first time.',
    'It\'s normal to feel a little nervous. Most people feel this way.',
    'I can say "Hi, I\'m [name]. What\'s your name?"',
    'If there is silence, that\'s okay. I can ask "What do you like to do?"',
    'After talking, I can say "It was nice meeting you!"',
    'I did something brave by talking to someone new. That\'s wonderful! 🌟'
  ],
  classroom: [
    'In a classroom, there are other students and a teacher.',
    'The teacher will explain what we need to do. I can listen carefully.',
    'If I don\'t understand something, I can raise my hand and ask.',
    'It\'s okay if it\'s noisy sometimes. I can focus on my work.',
    'If I need a break, I can ask the teacher quietly.',
    'I belong in this classroom. I am here to learn and grow. 💚'
  ],
  disagreement: [
    'Sometimes people have different opinions. That\'s normal.',
    'When someone disagrees with me, I can take a deep breath first.',
    'I can say "I see it differently. Can I share my view?"',
    'I listen to their point without interrupting.',
    'It\'s okay if we still disagree — we can both be right in different ways.',
    'Having different opinions doesn\'t mean we can\'t be kind to each other. 🤝'
  ],
  lunch: [
    'Lunchtime is when people eat and sometimes talk.',
    'I can sit at a table with other people, or by myself if I prefer.',
    'If I want to join a group, I can say "May I sit here?"',
    'I don\'t have to talk if I don\'t want to. Eating quietly is okay.',
    'If someone talks to me, I can answer and ask them something back.',
    'Lunch is my time. I can use it however feels comfortable. 🌿'
  ]
};

function generateStory() {
  const select = document.getElementById('situation-select');
  const val = select.value;
  const output = document.getElementById('story-output');

  if (!val) { showToast('Choose a situation first!'); return; }

  if (val === 'custom') {
    const custom = document.getElementById('custom-situation').value.trim();
    if (!custom) { showToast('Describe your situation!'); return; }
    output.innerHTML = `<div class="loading-shimmer" style="height:80px;border-radius:8px"></div>`;
    setTimeout(() => {
      output.innerHTML = `
        <div class="story-step"><div class="story-step-num">1</div>This situation might feel new or uncertain at first. That's okay.</div>
        <div class="story-step"><div class="story-step-num">2</div>Take a moment to breathe and think: "What do I need right now?"</div>
        <div class="story-step"><div class="story-step-num">3</div>Do one small action at a time. You don't need to do everything at once.</div>
        <div class="story-step"><div class="story-step-num">4</div>If it feels too much, it's okay to step back and try again later.</div>
        <div class="story-step"><div class="story-step-num">5</div>You handled this. Every step forward is progress. 💚</div>
      `;
    }, 1000);
    return;
  }

  const story = socialStories[val];
  if (!story) return;

  output.innerHTML = story.map((step, i) =>
    `<div class="story-step" style="animation-delay:${i * 0.1}s">
      <div class="story-step-num">${i + 1}</div>
      <div>${step}</div>
    </div>`
  ).join('');
}

document.getElementById('situation-select')?.addEventListener('change', function() {
  document.getElementById('custom-situation').style.display =
    this.value === 'custom' ? 'block' : 'none';
});

// ── Conversation Simulator ──
const convoResponses = {
  'Yes, I just started here. My name is [Name].': [
    'Oh nice! Welcome! I hope you\'re settling in okay. What do you think of it so far?',
    'That\'s great to meet you! Have you found your way around yet?',
  ],
  'I prefer not to say.': [
    'That\'s totally fine! No pressure at all. How are you finding things here?',
    'Sure thing! I just wanted to say hi. Feel free to come by if you ever need anything.',
  ],
  "Hi! I've been here a while.": [
    'Oh really? I\'m surprised we haven\'t met before! What\'s your name?',
    'How funny! We\'ve probably been in the same place many times. I\'m Alex!',
  ]
};

function sendConvoResponse(response) {
  const msgs = document.getElementById('convo-messages');
  const opts = document.getElementById('convo-options');

  const userMsg = document.createElement('div');
  userMsg.className = 'convo-msg user-msg';
  userMsg.textContent = response;
  msgs.appendChild(userMsg);

  opts.innerHTML = '';
  msgs.scrollTop = msgs.scrollHeight;

  setTimeout(() => {
    const replies = convoResponses[response] || ['Great response! You handled that really well. 💚'];
    const aiMsg = document.createElement('div');
    aiMsg.className = 'convo-msg ai-msg';
    aiMsg.textContent = replies[Math.floor(Math.random() * replies.length)];
    msgs.appendChild(aiMsg);
    msgs.scrollTop = msgs.scrollHeight;

    setTimeout(() => {
      opts.innerHTML = `
        <button class="convo-opt" onclick="sendConvoResponse('I\'m doing well, thank you for asking!')">I\'m doing well, thanks!</button>
        <button class="convo-opt" onclick="sendConvoResponse('It\'s been okay. A bit overwhelming.')">It\'s been a bit overwhelming.</button>
        <button class="convo-opt" onclick="endConvo()">End conversation</button>
      `;
    }, 500);
  }, 1000);
}

function endConvo() {
  const msgs = document.getElementById('convo-messages');
  const opts = document.getElementById('convo-options');
  const feedback = document.createElement('div');
  feedback.className = 'convo-msg ai-msg';
  feedback.style.borderColor = 'var(--autism-primary)';
  feedback.innerHTML = '✅ <strong>Practice complete!</strong> You did a great job with that conversation. Remember: it\'s okay to take your time when responding in real life too. 💚';
  msgs.appendChild(feedback);
  opts.innerHTML = '';
}

// ── Breathing ──
function startBreathing() {
  document.getElementById('breathing-modal').classList.add('active');
}

function setBreathPattern(inSec, holdSec, outSec, pauseSec, name) {
  state.breathPattern = { in: inSec, hold: holdSec, out: outSec, pause: pauseSec, name };
  document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

function startBreathingAnim() {
  const circle = document.getElementById('breathing-circle');
  const text = document.getElementById('breathing-text');
  const sub = document.getElementById('breathing-sub');
  const btn = document.getElementById('breath-start-btn');

  btn.textContent = 'Stop';
  btn.onclick = () => {
    clearInterval(state.breatheInterval);
    text.textContent = 'Done';
    sub.textContent = 'Great job! 💚';
    btn.textContent = 'Begin';
    btn.onclick = startBreathingAnim;
    circle.classList.remove('inhale', 'exhale');
  };

  let phase = 0;
  const phases = [
    { label: 'Breathe In', sub: `${state.breathPattern.in} seconds`, class: 'inhale', dur: state.breathPattern.in },
    { label: 'Hold', sub: `${state.breathPattern.hold} seconds`, class: '', dur: state.breathPattern.hold },
    { label: 'Breathe Out', sub: `${state.breathPattern.out} seconds`, class: 'exhale', dur: state.breathPattern.out },
    { label: 'Pause', sub: `${state.breathPattern.pause} seconds`, class: '', dur: state.breathPattern.pause },
  ].filter(p => p.dur > 0);

  function runPhase() {
    const p = phases[phase % phases.length];
    text.textContent = p.label;
    sub.textContent = p.sub;
    circle.className = 'breathing-circle ' + p.class;
    phase++;
  }

  runPhase();
  const cycleDur = phases.reduce((sum, p) => sum + p.dur, 0) * 1000;

  const runCycle = () => {
    let phaseIdx = 0;
    phases.forEach((p, i) => {
      setTimeout(() => {
        text.textContent = p.label;
        sub.textContent = p.sub;
        circle.className = 'breathing-circle ' + p.class;
      }, phases.slice(0, i).reduce((sum, pp) => sum + pp.dur * 1000, 0));
    });
  };

  runCycle();
  state.breatheInterval = setInterval(runCycle, cycleDur);
}

// ── Grounding ──
const groundingSteps = [
  { num: 5, sense: 'Things you can SEE', desc: 'Look around and name 5 things you can see right now.', inputs: 5 },
  { num: 4, sense: 'Things you can TOUCH', desc: 'Name 4 things you can physically feel right now.', inputs: 4 },
  { num: 3, sense: 'Things you can HEAR', desc: 'Listen carefully. What 3 sounds can you hear?', inputs: 3 },
  { num: 2, sense: 'Things you can SMELL', desc: 'Notice 2 things you can smell in this moment.', inputs: 2 },
  { num: 1, sense: 'Thing you can TASTE', desc: 'What is 1 thing you can taste right now?', inputs: 1 },
];

function startGrounding() {
  state.groundingStep = 0;
  document.getElementById('grounding-modal').classList.add('active');
  updateGroundingDisplay();
}

function updateGroundingDisplay() {
  const step = groundingSteps[state.groundingStep];
  document.getElementById('ground-num').textContent = step.num;
  document.getElementById('ground-sense').textContent = step.sense;
  document.getElementById('ground-desc').textContent = step.desc;

  const inputs = document.getElementById('grounding-inputs');
  inputs.innerHTML = '';
  for (let i = 0; i < step.inputs; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-input';
    input.placeholder = `${i + 1}.`;
    inputs.appendChild(input);
  }
}

function nextGrounding() {
  if (state.groundingStep < groundingSteps.length - 1) {
    state.groundingStep++;
    updateGroundingDisplay();
  } else {
    closeModal('grounding-modal');
    showToast('🌍 Grounding complete. You\'re present and safe. 💚');
    speakText('Great job. You are grounded, present, and safe.');
  }
}

// ── Meltdown Support ──
function startMeltdownSupport() {
  document.getElementById('meltdown-modal').classList.add('active');
  speakText('You are safe. Take one breath at a time. I am here with you.');
}

// ── Routine Builder ──
function showRoutineBuilder() {
  document.getElementById('routine-modal').classList.add('active');
}

function addRoutineItem() {
  const time = document.getElementById('routine-time').value;
  const task = document.getElementById('routine-task-input').value.trim();
  const emoji = document.getElementById('routine-emoji').value;

  if (!task) { showToast('Enter an activity!'); return; }

  const item = { time: time || '09:00', task, emoji };
  state.routineItems.push(item);
  renderRoutineItems();

  document.getElementById('routine-task-input').value = '';
}

function renderRoutineItems() {
  const container = document.getElementById('routine-items');
  container.innerHTML = state.routineItems.map((item, i) =>
    `<div class="routine-item">
      <span>${item.emoji}</span>
      <span style="font-size:0.75rem;color:var(--text-muted)">${item.time}</span>
      <span style="flex:1">${item.task}</span>
      <span style="cursor:pointer;color:var(--text-muted)" onclick="removeRoutineItem(${i})">✕</span>
    </div>`
  ).join('');
}

function removeRoutineItem(i) {
  state.routineItems.splice(i, 1);
  renderRoutineItems();
}

function saveRoutine() {
  localStorage.setItem('routine', JSON.stringify(state.routineItems));
  closeModal('routine-modal');
  showToast('🗓 Routine saved! It will appear in your timeline.');
  updateTimeline();
}

function updateTimeline() {
  if (state.routineItems.length === 0) return;
  const timeline = document.getElementById('routine-timeline');
  timeline.innerHTML = state.routineItems.map((item, i) =>
    `<div class="timeline-item ${i === 0 ? 'current' : ''}">
      <div class="timeline-dot ${i === 0 ? 'current-dot' : ''}"></div>
      <div class="timeline-content">
        <div class="timeline-time">${item.time}</div>
        <div class="timeline-task">${item.emoji} ${item.task}</div>
        ${i === 0 ? '<div class="timeline-bar"><div class="timeline-progress" style="width:30%"></div></div>' : ''}
      </div>
    </div>`
  ).join('');
}

function adoptRoutine() {
  showToast('✅ Routine adopted! Your schedule is set for today.');
}

// ── Social Simulator ──
function openSocialSim() {
  document.getElementById('social-modal').classList.add('active');
  const msgs = document.getElementById('sim-messages');
  msgs.innerHTML = '<div class="convo-msg ai-msg">Hello! I\'m your practice partner. Choose a topic: school, friends, or family?</div>';
}

function sendSimMessage() {
  const input = document.getElementById('sim-input');
  const text = input.value.trim();
  if (!text) return;

  const msgs = document.getElementById('sim-messages');
  const userMsg = document.createElement('div');
  userMsg.className = 'convo-msg user-msg';
  userMsg.textContent = text;
  msgs.appendChild(userMsg);
  input.value = '';

  setTimeout(() => {
    const aiMsg = document.createElement('div');
    aiMsg.className = 'convo-msg ai-msg';
    aiMsg.textContent = getSimResponse(text);
    msgs.appendChild(aiMsg);
    msgs.scrollTop = msgs.scrollHeight;
  }, 800);
}

function getSimResponse(msg) {
  const m = msg.toLowerCase();
  if (m.includes('school')) return "School can be interesting and sometimes challenging. What subject do you find most interesting?";
  if (m.includes('friend')) return "Making friends takes time for everyone. What's one thing you enjoy that you might share with others?";
  if (m.includes('family')) return "Family relationships are important. Is there something specific about family interactions you'd like to practice?";
  if (m.includes('yes') || m.includes('no') || m.length < 20) return "That makes sense! Can you tell me a bit more about that?";
  return "I hear you. That sounds like it means a lot to you. How does that make you feel?";
}

// ══════════════ GLOBAL UTILITIES ══════════════

// ── Modal Control ──
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Close on backdrop click
document.querySelectorAll('.modal-overlay').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal.id);
  });
});

// ── Toast ──
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Keyboard Navigation ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    closeFocusReading();
  }
  // ADHD shortcuts
  if (e.ctrlKey && e.key === 'p') { e.preventDefault(); togglePomodoro(); }
  if (e.ctrlKey && e.key === 'h') { e.preventDefault(); toggleHyperfocus(); }
  // Dyslexia
  if (e.ctrlKey && e.key === 'r') { e.preventDefault(); toggleTTS(); }
});

// ── Urgency Mode shortcut ──
window.startUrgency = function(min = 5, label = 'Complete your task!') {
  startUrgencyMode(min, label);
};

// ── Init on DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved state
  const savedRoutine = localStorage.getItem('routine');
  if (savedRoutine) {
    state.routineItems = JSON.parse(savedRoutine);
  }

  // Floating orb color changes with mode
  const landing = document.getElementById('landing');
  if (landing) {
    // Animate orbs on landing
    document.querySelectorAll('.orb').forEach((orb, i) => {
      orb.style.animationDelay = `-${i * 3}s`;
    });
  }

  // Preload fonts
  document.fonts.ready.then(() => {
    console.log('NeuroLearn Pro ready ⬡');
  });
});

// ── Backend Integration Points ──
// These functions are designed to call the Python backend when deployed
// For now they use local fallbacks

async function callAIAPI(prompt, context = '') {
  // In production, this calls the Python FastAPI backend
  // POST /api/ai/process { prompt, context, mode: state.currentMode }
  console.log('[AI API Call]', prompt);
  return null; // Falls through to local fallbacks
}

// ── PWA-like local sync ──
function syncToLocal() {
  const data = {
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    routineItems: state.routineItems,
    syncTime: Date.now()
  };
  localStorage.setItem('neurolearn_state', JSON.stringify(data));
}

// Sync every 30 seconds
setInterval(syncToLocal, 30000);

// ── Startup ──
(function init() {
  const saved = localStorage.getItem('neurolearn_state');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      state.xp = data.xp || 175;
      state.level = data.level || 3;
      state.streak = data.streak || 3;
      if (data.routineItems) state.routineItems = data.routineItems;
    } catch(e) {}
  }
})();

// ══════════════════════════════════════════
// NeuroLearn Pro — Backend API Integration
// ══════════════════════════════════════════

const API_BASE = 'http://localhost:8000';

// ── Generic API caller with local fallback ──
async function callAPI(endpoint, body) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return null; // Caller handles null → local fallback
  }
}

// ── Override chunkTask to use backend ──
async function chunkTask() {
  const input = document.getElementById('task-input');
  const task = input.value.trim();
  if (!task) { showToast('Enter a task first!'); return; }

  const container = document.getElementById('task-chunks');
  container.innerHTML = '<div class="loading-shimmer" style="height:40px;border-radius:8px;margin-bottom:6px"></div>'.repeat(3);

  const data = await callAPI('/api/adhd/chunk-task', { task });
  const steps = data?.steps || generateChunks(task);

  container.innerHTML = '';
  steps.forEach((chunk, i) => {
    const div = document.createElement('div');
    div.className = 'chunk-item';
    div.style.opacity = '0';
    div.innerHTML = `
      <div class="chunk-num">${i + 1}</div>
      <div class="chunk-text">${chunk}</div>
      <div class="chunk-check" onclick="toggleChunk(this)"></div>
    `;
    container.appendChild(div);
    setTimeout(() => { div.style.opacity = '1'; div.style.transition = 'opacity 0.3s'; }, i * 80);
  });

  input.value = '';
  addXP(10);
  showToast(`✂️ Task chunked! +10 XP ${data?.source === 'ai' ? '(AI)' : ''}`);
}

// ── Override sendCoachMessage to use backend ──
async function sendCoachMessage() {
  const input = document.getElementById('coach-input');
  const text = input.value.trim();
  if (!text) return;

  const msgs = document.getElementById('coach-messages');
  const userMsg = document.createElement('div');
  userMsg.className = 'convo-msg user-msg';
  userMsg.textContent = text;
  msgs.appendChild(userMsg);
  input.value = '';

  const typing = document.createElement('div');
  typing.className = 'convo-msg ai-msg';
  typing.textContent = '...';
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;

  const data = await callAPI('/api/adhd/coach', { message: text, xp: state.xp, streak: state.streak });
  const reply = data?.reply || generateCoachResponse(text);

  typing.textContent = reply;
  msgs.scrollTop = msgs.scrollHeight;
}

// ── Override aiSimplify to use backend ──
async function aiSimplify() {
  const input = document.getElementById('simplify-input').value.trim();
  if (!input) { showToast('Paste some text to simplify!'); return; }

  const output = document.getElementById('simplified-output');
  output.innerHTML = '<div class="loading-shimmer" style="height:60px;border-radius:8px"></div>';

  const data = await callAPI('/api/dyslexia/simplify', { text: input });
  const simplified = data?.simplified || simplifyTextLocal(input);

  output.innerHTML = `<strong style="color:var(--dyslexia-secondary);font-size:0.78rem;display:block;margin-bottom:8px">✨ Simplified ${data?.source === 'ai' ? '(AI)' : '(Local)'}</strong><span style="font-family:var(--font-body);font-size:0.95rem;line-height:1.8">${simplified}</span>`;
}

// ── Override generateStory to use backend ──
async function generateStory() {
  const select = document.getElementById('situation-select');
  const val = select.value;
  const output = document.getElementById('story-output');

  if (!val) { showToast('Choose a situation first!'); return; }

  const customText = val === 'custom' ? document.getElementById('custom-situation').value.trim() : '';
  if (val === 'custom' && !customText) { showToast('Describe your situation!'); return; }

  output.innerHTML = '<div class="loading-shimmer" style="height:80px;border-radius:8px"></div>';

  const data = await callAPI('/api/autism/social-story', { situation: val, custom_text: customText });
  const steps = data?.steps || _getFallbackStory(val);

  output.innerHTML = steps.map((step, i) =>
    `<div class="story-step" style="animation-delay:${i * 0.1}s">
      <div class="story-step-num">${i + 1}</div>
      <div>${step}</div>
    </div>`
  ).join('');
}

function _getFallbackStory(val) {
  const stories = {
    meeting_new: ["When I meet someone new, they are also meeting me for the first time.", "It's normal to feel a little nervous.", "I can say 'Hi, I'm [name]. What's your name?'", "If there is silence, that's okay.", "After talking, I can say 'It was nice meeting you!'", "I did something brave. That's wonderful! 🌟"],
    classroom: ["In a classroom, there are other students and a teacher.", "The teacher will explain what we need to do.", "If I don't understand, I can raise my hand.", "It's okay if it's noisy sometimes.", "I belong in this classroom. 💚"],
    disagreement: ["Sometimes people have different opinions.", "I can take a deep breath first.", "I can say 'I see it differently.'", "It's okay if we still disagree.", "We can still be kind to each other. 🤝"],
    lunch: ["Lunchtime is when people eat and sometimes talk.", "I can sit wherever feels comfortable.", "I don't have to talk if I don't want to.", "Lunch is my time. 🌿"],
  };
  return stories[val] || ["This situation might feel new. That's okay.", "Take a moment to breathe.", "Do one small action at a time.", "Every step forward is progress. 💚"];
}

// ── Override predictWords to use backend ──
async function predictWords(val) {
  const container = document.getElementById('word-suggestions');
  if (!val || val.length < 2) { container.innerHTML = ''; return; }

  const lower = val.toLowerCase().split(' ').pop(); // last word being typed
  if (!lower) { container.innerHTML = ''; return; }

  const data = await callAPI('/api/dyslexia/word-predict', { task: lower });
  let predictions = data?.predictions || [];

  // Local fallback
  if (!predictions.length) {
    const commons = ['and', 'the', 'that', 'this', 'with', 'from', 'they', 'have', 'because', 'when', 'where', 'what'];
    predictions = commons.filter(w => w.startsWith(lower)).slice(0, 5);
  }

  container.innerHTML = predictions.map(w =>
    `<button class="word-sug-btn" onclick="insertWord('${w}')">${w}</button>`
  ).join('');
}

// ── Dashboard Init ──
function initDashboard() {
  // Greeting
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning! ☀️' : hour < 17 ? 'Good afternoon! 🌤' : 'Good evening! 🌙';
  const el = document.getElementById('dash-greeting');
  if (el) el.textContent = greet;

  // Stats from state
  const xpEl = document.getElementById('dash-xp');
  if (xpEl) xpEl.textContent = state.xp;
  const streakEl = document.getElementById('dash-streak-num');
  if (streakEl) streakEl.textContent = state.streak;
  const wordsEl = document.getElementById('dash-words');
  if (wordsEl) wordsEl.textContent = state.wordsRead || 0;

  drawDashMoodChart();
  loadMoodInsight();
}

function drawDashMoodChart() {
  const canvas = document.getElementById('dash-mood-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const history = JSON.parse(localStorage.getItem('moodHistory') || '[]').slice(-7);
  const moodScore = { amazing: 5, good: 4, okay: 3, rough: 2, overwhelmed: 1 };
  const scores = history.length >= 2 ? history.map(h => moodScore[h.mood] || 3) : [3, 4, 3, 4, 5, 3, 4];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padL = 30, padR = 10, padT = 10, padB = 24;
  const w = canvas.width - padL - padR;
  const h = canvas.height - padT - padB;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = padT + (h / 4) * i;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + w, y); ctx.stroke();
  }

  // Gradient fill
  const grad = ctx.createLinearGradient(0, padT, 0, padT + h);
  grad.addColorStop(0, 'rgba(124,92,191,0.3)');
  grad.addColorStop(1, 'rgba(124,92,191,0)');

  ctx.beginPath();
  scores.forEach((score, i) => {
    const x = padL + (i / (scores.length - 1)) * w;
    const y = padT + h - ((score - 1) / 4) * h;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(padL + w, padT + h);
  ctx.lineTo(padL, padT + h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  const lineGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  lineGrad.addColorStop(0, '#FF6B35');
  lineGrad.addColorStop(0.5, '#7C5CBF');
  lineGrad.addColorStop(1, '#2D9C7F');

  ctx.beginPath();
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  scores.forEach((score, i) => {
    const x = padL + (i / (scores.length - 1)) * w;
    const y = padT + h - ((score - 1) / 4) * h;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  scores.forEach((score, i) => {
    const x = padL + (i / (scores.length - 1)) * w;
    const y = padT + h - ((score - 1) / 4) * h;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#7C5CBF';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Day labels
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '10px Sora, sans-serif';
  ctx.textAlign = 'center';
  scores.forEach((_, i) => {
    const x = padL + (i / (scores.length - 1)) * w;
    ctx.fillText(days[i] || '', x, canvas.height - 4);
  });
}

async function loadMoodInsight() {
  const history = JSON.parse(localStorage.getItem('moodHistory') || '[]');
  const el = document.getElementById('mood-insight-text');
  if (!el) return;

  const data = await callAPI('/api/global/mood-insight', { mood_history: history });
  if (data?.insight) {
    el.textContent = data.insight;
    const avgEl = document.getElementById('dash-mood-avg');
    if (avgEl) avgEl.textContent = data.average_score ? `${data.average_score}/5` : '—';
  } else {
    el.textContent = 'Log your mood to see insights!';
  }
}

// ── Override showPage to init dashboard ──
const _origShowPage = showPage;
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  let pageId;
  if (id === 'landing') pageId = 'landing';
  else if (id === 'dashboard') pageId = 'dashboard';
  else pageId = id + '-mode';
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
  state.currentMode = id;
  if (id === 'dashboard') initDashboard();
}

// ── Mood logging also refreshes dashboard chart ──
const _origSetMood = setMood;
function setMood(mood, emoji) {
  state.currentMood = mood;
  const storage = JSON.parse(localStorage.getItem('moodHistory') || '[]');
  storage.push({ mood, emoji, time: Date.now() });
  localStorage.setItem('moodHistory', JSON.stringify(storage.slice(-14)));
  showToast(`Mood logged: ${emoji}`);
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  if (event?.target) event.target.classList.add('selected');
  drawMoodChart();
  drawDashMoodChart();
}
