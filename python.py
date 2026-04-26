euroLearn Pro - Python FastAPI Backend
Run: python app.py
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import random
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NeuroLearn Pro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    from openai import OpenAI
    _key = os.getenv("OPENAI_API_KEY", "")
    client = OpenAI(api_key=_key) if _key else None
    AI_AVAILABLE = bool(_key)
except Exception:
    client = None
    AI_AVAILABLE = False


# ── Models ──

class TaskRequest(BaseModel):
    task: str
    mode: Optional[str] = "adhd"

class SimplifyRequest(BaseModel):
    text: str
    level: Optional[str] = "simple"

class StoryRequest(BaseModel):
    situation: str
    custom_text: Optional[str] = ""

class CoachRequest(BaseModel):
    message: str
    xp: Optional[int] = 0
    streak: Optional[int] = 0

class ConvoRequest(BaseModel):
    user_message: str
    history: Optional[List] = []
    scenario: Optional[str] = "general"

class MoodRequest(BaseModel):
    mood_history: List


# ── Health ──

@app.get("/")
def root():
    return {"status": "NeuroLearn Pro running", "ai": AI_AVAILABLE}

@app.get("/health")
def health():
    return {"ok": True}


# ── ADHD ──

@app.post("/api/adhd/chunk-task")
def chunk_task(req: TaskRequest):
    if AI_AVAILABLE:
        try:
            res = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an ADHD coach. Break the task into 5-7 small actionable micro-steps. Each step takes 2-10 minutes. Start each with an emoji. Return ONLY a JSON array of strings."},
                    {"role": "user", "content": f"Task: {req.task}"}
                ],
                max_tokens=300,
                temperature=0.7,
            )
            steps = json.loads(res.choices[0].message.content.strip())
            return {"steps": steps, "source": "ai"}
        except Exception:
            pass
    return {"steps": local_chunk(req.task), "source": "local"}


@app.post("/api/adhd/coach")
def coach(req: CoachRequest):
    if AI_AVAILABLE:
        try:
            res = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": f"You are Coach Spark, an energetic ADHD focus coach. Student has {req.xp} XP and {req.streak}-day streak. Give 2-3 sentence motivating advice. Use emojis."},
                    {"role": "user", "content": req.message}
                ],
                max_tokens=150,
                temperature=0.85,
            )
            return {"reply": res.choices[0].message.content.strip(), "source": "ai"}
        except Exception:
            pass
    return {"reply": local_coach(req.message), "source": "local"}


# ── Dyslexia ──

@app.post("/api/dyslexia/simplify")
def simplify(req: SimplifyRequest):
    if AI_AVAILABLE:
        try:
            level = "Grade 3-4 level, very short sentences." if req.level == "very_simple" else "Grade 6-7 level, avoid jargon."
            res = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": f"Rewrite the text to be easier to read. {level} Keep the same meaning. Return only the rewritten text."},
                    {"role": "user", "content": req.text}
                ],
                max_tokens=500,
                temperature=0.4,
            )
            return {"simplified": res.choices[0].message.content.strip(), "source": "ai"}
        except Exception:
            pass
    return {"simplified": local_simplify(req.text), "source": "local"}


@app.post("/api/dyslexia/word-predict")
def word_predict(req: TaskRequest):
    word = req.task.strip().lower()
    return {"predictions": local_predict(word)}


# ── Autism ──

@app.post("/api/autism/social-story")
def social_story(req: StoryRequest):
    if AI_AVAILABLE:
        try:
            text = req.custom_text if req.situation == "custom" else req.situation
            res = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an autism support specialist. Write a social story with 5-6 short reassuring steps. Use first-person (I can...). End with encouragement. Return ONLY a JSON array of strings."},
                    {"role": "user", "content": f"Situation: {text}"}
                ],
                max_tokens=400,
                temperature=0.5,
            )
            steps = json.loads(res.choices[0].message.content.strip())
            return {"steps": steps, "source": "ai"}
        except Exception:
            pass
    return {"steps": local_story(req.situation), "source": "local"}


@app.post("/api/autism/conversation")
def conversation(req: ConvoRequest):
    if AI_AVAILABLE:
        try:
            messages = [{"role": "system", "content": f"You are a friendly conversation practice partner for someone with autism. Scenario: {req.scenario}. Keep responses short (1-2 sentences), warm and predictable. Ask one simple follow-up question."}]
            for h in req.history[-6:]:
                messages.append({"role": h["role"], "content": h["content"]})
            messages.append({"role": "user", "content": req.user_message})
            res = client.chat.completions.create(model="gpt-3.5-turbo", messages=messages, max_tokens=120, temperature=0.6)
            return {"reply": res.choices[0].message.content.strip(), "source": "ai"}
        except Exception:
            pass
    return {"reply": local_convo(req.user_message), "source": "local"}


# ── Global ──

@app.post("/api/global/mood-insight")
def mood_insight(req: MoodRequest):
    if not req.mood_history:
        return {"insight": "Start logging your mood to see patterns here!", "trend": "neutral", "average_score": 3.0}
    scores_map = {"amazing": 5, "good": 4, "okay": 3, "rough": 2, "overwhelmed": 1}
    scores = [scores_map.get(h.get("mood", "okay"), 3) for h in req.mood_history[-7:]]
    avg = sum(scores) / len(scores)
    if avg >= 4:
        trend, insight = "positive", "You have been feeling great lately! Keep it up!"
    elif avg >= 3:
        trend, insight = "neutral", "Your mood has been steady. Small wins add up!"
    elif avg >= 2:
        trend, insight = "low", "Things have been tough. It is okay to have hard days."
    else:
        trend, insight = "very_low", "You have been struggling. Please be gentle with yourself."
    return {"insight": insight, "trend": trend, "average_score": round(avg, 1)}


@app.post("/api/global/weekly-summary")
def weekly_summary(req: MoodRequest):
    scores_map = {"amazing": 5, "good": 4, "okay": 3, "rough": 2, "overwhelmed": 1}
    scores = [scores_map.get(h.get("mood", "okay"), 3) for h in req.mood_history[-7:]]
    avg = round(sum(scores) / len(scores), 1) if scores else 3.0
    return {"days_logged": len(scores), "average_mood": avg, "best_day": max(scores) if scores else 3, "summary": f"You logged {len(scores)} mood entries this week with an average score of {avg}/5."}


# ── Local Fallbacks ──

def local_chunk(task: str) -> list:
    t = task.lower()
    if any(w in t for w in ["essay", "write", "report"]):
        return ["Brainstorm 3 main ideas (5 min)", "Create a simple outline", "Write the introduction", "Write body paragraph 1", "Write body paragraph 2", "Write the conclusion", "Review and spell-check"]
    if any(w in t for w in ["math", "homework", "problem"]):
        return ["Read through all questions first", "Star the easiest questions", "Solve the starred questions", "Try the medium questions", "Review formulas for hard questions", "Double-check your answers"]
    if any(w in t for w in ["study", "learn", "read"]):
        return ["Gather all materials needed", "Skim headings and highlights first", "Read section 1 carefully", "Write 3 key takeaways", "Read section 2 carefully", "Review all notes"]
    words = " ".join(task.split()[:3])
    return [f"Clear your space for '{words}'", "Write down what done looks like", "Set a 10-min timer and START", "Complete the first small part", "Review progress and continue", "Finish and celebrate!"]


def local_coach(msg: str) -> str:
    m = msg.lower()
    if any(w in m for w in ["stuck", "cant", "cannot", "hard"]):
        return "Try the 2-Minute Start - just work for exactly 2 minutes. Momentum usually takes over!"
    if any(w in m for w in ["distract", "focus"]):
        return "Activate Hyperfocus Mode! Also try a quick walk - it resets the brain perfectly."
    if any(w in m for w in ["tired", "exhausted"]):
        return "Rest is part of the process! Take a 5-minute break right now. You have earned it!"
    return random.choice([
        "You are doing amazing! Done is better than perfect. One step at a time!",
        "Cross off something small first. The momentum will carry you!",
        "Your streak proves you keep showing up. That is everything!",
        "The first 2 minutes are the hardest - after that you will flow!",
    ])


def local_simplify(text: str) -> str:
    replacements = {
        "adenosine triphosphate": "ATP (energy molecule)",
        "phosphorylation": "energy production",
        "mitochondria": "the cell power station",
        "responsible for": "makes",
        "surrounded by": "wrapped in",
        "substantially": "a lot",
        "utilize": "use",
        "facilitate": "help",
        "demonstrate": "show",
        "approximately": "about",
        "consequently": "so",
        "furthermore": "also",
        "nevertheless": "but",
        "in order to": "to",
        "due to the fact that": "because",
    }
    result = text
    for old, new in replacements.items():
        result = result.replace(old, new)
    return result


def local_predict(word: str) -> list:
    db = {
        "th": ["the", "they", "their", "there", "then", "these", "think"],
        "be": ["because", "become", "before", "between", "behind"],
        "co": ["complete", "computer", "come", "common", "compare"],
        "st": ["strong", "structure", "strategy", "student", "study"],
        "un": ["understand", "under", "unique", "united", "until"],
        "le": ["learn", "lead", "leave", "level", "less"],
        "im": ["important", "improve", "impact", "imagine"],
        "pr": ["problem", "process", "provide", "project", "practice"],
        "in": ["information", "include", "instead", "individual"],
        "re": ["read", "really", "reason", "result", "remember"],
        "wh": ["when", "where", "what", "which", "while"],
        "an": ["and", "another", "answer", "any", "analysis"],
    }
    predictions = []
    for prefix, words in db.items():
        if len(word) >= 2 and (word.startswith(prefix) or prefix.startswith(word[:2])):
            predictions.extend([w for w in words if w.startswith(word)])
    commons = ["and", "the", "that", "this", "with", "from", "they", "have", "because", "when"]
    predictions.extend([w for w in commons if w.startswith(word)])
    return list(dict.fromkeys(predictions))[:6]


def local_story(situation: str) -> list:
    stories = {
        "meeting_new": [
            "When I meet someone new, they are also meeting me for the first time.",
            "It is normal to feel a little nervous. Most people feel this way.",
            "I can say Hi, I am [name]. What is your name?",
            "If there is silence, that is okay. I can ask what they like to do.",
            "After talking, I can say it was nice meeting you.",
            "I did something brave by talking to someone new. That is wonderful!"
        ],
        "classroom": [
            "In a classroom, there are other students and a teacher.",
            "The teacher will explain what we need to do. I can listen carefully.",
            "If I do not understand, I can raise my hand and ask.",
            "It is okay if it is noisy sometimes. I can focus on my work.",
            "If I need a break, I can ask the teacher quietly.",
            "I belong in this classroom. I am here to learn and grow."
        ],
        "disagreement": [
            "Sometimes people have different opinions. That is normal.",
            "When someone disagrees with me, I can take a deep breath first.",
            "I can say I see it differently. Can I share my view?",
            "I listen to their point without interrupting.",
            "It is okay if we still disagree.",
            "Having different opinions does not mean we cannot be kind to each other."
        ],
        "lunch": [
            "Lunchtime is when people eat and sometimes talk.",
            "I can sit at a table with others, or by myself if I prefer.",
            "If I want to join a group, I can say may I sit here?",
            "I do not have to talk if I do not want to.",
            "If someone talks to me, I can answer and ask them something back.",
            "Lunch is my time. I can use it however feels comfortable."
        ],
    }
    return stories.get(situation, [
        "This situation might feel new. That is okay.",
        "Take a moment to breathe and think about what you need.",
        "Do one small action at a time.",
        "If it feels too much, it is okay to step back.",
        "Every step forward is progress."
    ])


def local_convo(msg: str) -> str:
    m = msg.lower()
    if "school" in m:
        return "School can be interesting and challenging. What subject do you find most interesting?"
    if "friend" in m:
        return "Making friends takes time for everyone. What is one thing you enjoy?"
    if "family" in m:
        return "Family relationships are important. Is there something specific you would like to practice?"
    if len(msg) < 20:
        return "That makes sense! Can you tell me a bit more about that?"
    return "I hear you. That sounds like it means a lot to you. How does that make you feel?"


# ── Run ──
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

