# NeuroLearn Pro

A premium, emotionally intelligent web app for neurodivergent students — ADHD, Dyslexia, and Autism modes.

---

## 🚀 Quick Start

### Frontend Only (no AI)
Just open `index.html` in any browser. All features work with local fallbacks.

### With Python Backend (enables real AI)

**Step 1 — Install Python 3.10+**
Download from https://python.org

**Step 2 — Add your OpenAI API key**
Edit `backend/.env`:
```
OPENAI_API_KEY=sk-your-key-here
```

**Step 3 — Start the backend**
Double-click `start_backend.bat`  
OR run manually:
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

**Step 4 — Open the app**
Open `index.html` in your browser.

---

## 📁 Project Structure

```
NeuroLearn/
├── index.html          ← Full frontend (all 3 modes + dashboard)
├── styles.css          ← Complete stylesheet (glassmorphism, animations)
├── app.js              ← All frontend logic + backend API calls
├── start_backend.bat   ← One-click backend starter (Windows)
└── backend/
    ├── app.py          ← FastAPI server (all AI endpoints)
    ├── requirements.txt
    └── .env            ← Your API keys (never commit this)
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/adhd/chunk-task` | AI task decomposition |
| POST | `/api/adhd/coach` | Coach Spark AI responses |
| POST | `/api/dyslexia/simplify` | Text simplification |
| POST | `/api/dyslexia/word-predict` | Word prediction |
| POST | `/api/autism/social-story` | Social story generation |
| POST | `/api/autism/conversation` | Conversation practice AI |
| POST | `/api/global/mood-insight` | Mood trend analysis |
| POST | `/api/global/weekly-summary` | Weekly progress summary |

All endpoints fall back to local logic if the backend is offline or AI key is missing.

---

## 🎨 Features

### ⚡ ADHD Mode
- Dynamic Pomodoro (adjusts based on XP/performance)
- AI Task Chunker (micro-steps)
- Hyperfocus Mode (distraction blocker)
- Distraction Tracker (tab-switch detection)
- 2-Minute Start button
- Urgency Mode countdown
- XP / Levels / Badges / Streaks
- Daily Quests
- Coach Spark AI
- Voice Reminders (Web Speech API)
- Mood tracking

### 📖 Dyslexia Mode
- OpenDyslexic font toggle
- Text-to-Speech with word boundary tracking
- Reading Ruler (follows mouse)
- Letter / Word / Line spacing sliders
- Font size control
- Color overlay filters (6 options)
- AI Text Simplifier
- Chunked paragraph view
- Word Prediction
- Visual Dictionary
- Audio Notes (recording simulation)
- Focus Reading Mode (fullscreen)

### 🌿 Autism Mode
- Visual Routine Builder (drag-and-drop timeline)
- Predictability Timeline ("what happens next")
- Social Story Generator (AI)
- Sensory Control Panel (sound, brightness, animations)
- Emotion Toolkit: Breathing, Grounding (5-4-3-2-1), Meltdown Support
- Visual Timer (animated SVG circle)
- Safe Mode (minimal UI, no transitions)
- One-Step-At-A-Time learning
- Conversation Simulator (AI practice partner)
- Routine AI suggestions

### 📊 Dashboard
- Mood chart (7-day history)
- XP, streak, words read stats
- Weekly progress bars
- Achievement system
- Quick access to all modes
- AI mood insights

---

## 🔮 Future Scaling

1. **Database** — Replace localStorage with PostgreSQL (user accounts, cross-device sync)
2. **Auth** — Add OAuth (Google/Apple sign-in)
3. **Mobile App** — Wrap with Capacitor or React Native
4. **Better AI** — Fine-tune a model on neurodivergent learning data
5. **Parent/Teacher Dashboard** — Progress reports, alerts
6. **Offline PWA** — Service worker for full offline support
7. **Accessibility Audit** — Full WCAG 2.1 AA compliance pass
8. **Localization** — Multi-language support

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (custom), Vanilla JS |
| Backend | Python 3.10+, FastAPI |
| AI | OpenAI GPT-3.5-turbo |
| TTS | Web Speech API (browser-native) |
| Storage | localStorage (simulated sync) |
| Fonts | Google Fonts (Sora, DM Sans) |
