#!/usr/bin/env python3
"""Generate daily-meditations.js — 365 original Aurora daily readings."""

import json
import textwrap

TITLES = [
    "Exactly Where You Are", "A Softer Voice", "Permission to Pause", "Small Courage",
    "The Next Right Thing", "Unhurried Healing", "Enough for Today", "Return to Breath",
    "Held and Human", "Trust the Pace", "Light Through Clouds", "Your Own Witness",
    "Gentle Boundaries", "Room to Feel", "Still Becoming", "Quiet Strength",
    "One Honest Step", "Compassion First", "Release the Weight", "Begin Again",
    "You Are Not Behind", "Steady Ground", "Open Hands", "Brave Enough",
    "Morning Mercy", "Evening Grace", "The Middle Matters", "Naming What Hurts",
    "Choosing Yourself", "Sisterhood Within", "Repair and Rest", "Hope Without Hurry",
    "Body as Ally", "Fear and Forward", "Sacred Ordinary", "Lessons in Letting Go",
    "Rooted, Not Rigid", "The Gift of No", "Seen and Supported", "Recovering Out Loud",
    "Patience with Process", "Kindness in Action", "Weather the Wave", "Gather Your Strength",
    "Truth Without Shame", "Space to Grow", "Listen Inward", "Carry One Line",
    "Whole, Not Perfect", "Belonging Here", "Today Counts",
]

OPENINGS = [
    "Recovery asks nothing of you except honesty about where you are right now — not where you think you should be.",
    "Some mornings arrive heavy before your feet touch the floor. That does not mean the day is already lost.",
    "You may have learned to measure worth by productivity, composure, or how little you needed from anyone. Today, consider a different measure: presence.",
    "Healing rarely announces itself with fireworks. More often it sounds like a quieter thought: maybe I can try again.",
    "There is no prize for carrying pain alone. Reaching out, resting, or simply naming what hurts are all forms of wisdom.",
    "Your story includes chapters you did not choose. They still belong to you — and so does every page you write from here.",
    "Anxiety often dresses itself as urgency. Before you rush to fix, fix, fix, pause long enough to ask what actually needs your attention.",
    "You are allowed to outgrow old survival strategies without condemning the younger self who needed them.",
    "Grief and gratitude can share the same hour. You do not have to simplify your inner world to make it acceptable.",
    "Recovery is not a straight line on a chart. It is a lived rhythm — some days wide open, some days barely a whisper.",
    "The voice that says you should be further along is rarely a voice of care. Notice it, and choose whether to believe it.",
    "Trauma taught many of us to scan for danger. Today, see if you can also scan for one small sign of safety.",
    "You do not have to earn rest by exhausting yourself first. Rest is part of repair, not a reward at the finish line.",
    "Comparison steals tenderness. Your path is shaped by your history, your body, your timing — none of it is a mistake.",
    "Sometimes the bravest thing is not pushing through — it is admitting, this is hard, and I need support.",
    "Shame thrives in secrecy. Bringing one honest sentence into the light — even only to yourself — can loosen its grip.",
    "You are not broken for having hard days after good ones. That pattern is human, not failure.",
    "Boundaries are not walls against love. They are the shape of self-respect that makes sustained connection possible.",
    "If all you manage today is showing up, breathing, and staying — that is not nothing. That is participation in your own life.",
    "Hope does not require certainty. It asks only for a willingness to stay open to the next kind moment.",
    "Your body keeps score, and it also keeps wisdom. What sensation or breath wants your gentle notice today?",
    "Forgiveness — when you are ready — is often less about excusing harm and more about refusing to live chained to it.",
    "You may be recovering from many things at once. You do not need a single label to deserve compassion.",
    "Loneliness can feel like evidence that you do not belong. It is often evidence that you are longing — and longing is alive.",
    "Anger can carry information about violated boundaries. You are allowed to listen without letting it drive unchecked.",
    "Joy after struggle can feel suspicious. You are allowed to receive good moments without paying for them in advance.",
    "The people who love you do not need you polished. They need you reachable.",
    "Perfectionism is sometimes fear in a tidy outfit. Today, practice one imperfect but honest step.",
    "You have survived every hardest day so far. That is not a guarantee of ease — it is proof of capacity.",
    "Stillness can feel unfamiliar if you were taught to stay in motion to stay safe. You can learn it slowly.",
    "Not every thought deserves a seat at the table. You can notice one and let it pass without debate.",
    "Recovery includes learning to trust yourself again — one kept promise to yourself at a time.",
    "There is dignity in needing help. There is also dignity in offering yourself patience while you learn how.",
    "You are not too much. You may have been in rooms that were too small.",
    "Change often begins as discomfort. That discomfort is not always a stop sign — sometimes it is growth moving.",
    "What if today is not about transformation — only about not abandoning yourself?",
    "Your worth was never conditional on being easy, cheerful, or unchanged.",
    "Sisterhood begins with how you speak to the woman you are when no one is watching.",
    "Some lessons repeat until we are ready to receive them. Repetition is not punishment — it is practice.",
    "You can hold accountability and tenderness in the same hand.",
    "Even a short walk, a glass of water, or five slow breaths can be an act of devotion to your future self.",
]

MIDDLES = [
    "Notice where you are tightening — jaw, shoulders, stomach — and see if exhale can soften you by one degree.",
    "If a feeling rises, try naming it without a story attached. Sad. Tired. Tender. Naming is often the first form of care.",
    "Write down one thing that is true and kind about you. It does not need to impress anyone.",
    "Reach toward one connection today: a text, a meeting, a therapist, a friend. Connection is medicine, not weakness.",
    "When the inner critic speaks, answer with a question: What would I say to someone I love in this exact moment?",
    "Choose one boundary — however small — that protects your energy. Keeping it is practice in self-trust.",
    "Look for evidence against the harshest story you tell about yourself. Evidence counts even when it is modest.",
    "Let today include pleasure without justification: sunlight, music, warmth, laughter — if only for a minute.",
    "If you used a coping behavior, meet yourself with curiosity first: What was I trying to soothe or survive?",
    "Recovery includes grieving who you needed people to be. Grief clears space for choices rooted in reality.",
    "You do not have to solve your entire life before dinner. One next step is sufficient.",
    "Practice saying no without a long apology. Your no can be quiet and still be complete.",
    "When shame visits, place a hand on your chest and remind your nervous system: I am here with you.",
    "Celebrate a micro-win: you asked for help, you ate, you slept, you stayed. Micro-wins accumulate.",
    "If you feel numb, that may be protection — not brokenness. Ask gently what would feel safe to feel.",
    "Remember a moment you were stronger than you expected. That memory is still in you.",
    "Let someone trustworthy know how you are — in plain language, without performing fine.",
    "Move your body in a way that feels supportive, not punishing. Motion can return you to yourself.",
    "Release one should that is not yours — inherited expectations, old roles, voices that no longer fit.",
    "Sit with a question: What do I need more of this week — rest, structure, play, honesty, community?",
    "If today triggers old pain, it does not mean you have undone your progress. It means something wants attention.",
    "Offer yourself the same patience you would offer a friend learning something difficult for the first time.",
    "Keep one appointment with your wellbeing — a walk, a meeting, a tool in this app, five minutes of quiet.",
    "When you notice comparison, return to your own metrics: Am I a little more honest, a little more cared for?",
    "Let gratitude be specific if it helps: one person, one comfort, one choice that leaned toward life.",
    "You are building a life where safety is not only external — it is also how you treat yourself internally.",
    "If fear says hide, let courage be small: send the email, open the door, stay in the room one minute longer.",
    "Your recovery is not a performance for anyone's approval. It is a private covenant with your own life.",
    "When you make a repair — with yourself or another — let it be complete without endless self-trial.",
    "Picture the woman you are becoming trusting you for one decision today. What would she choose?",
    "Allow today to have uneven hours. Not every hour must carry the same weight.",
    "If you are weary of starting over, consider: starting over is sometimes the most honest form of continuing.",
    "Listen for the difference between guilt (I did something wrong) and shame (I am wrong). Only one invites change.",
    "Keep something sacred for yourself — time, space, a ritual — that says you matter on ordinary days.",
    "When the world feels loud, reduce input: fewer tabs, fewer voices, one task, one breath.",
    "You can love people and still limit access when access costs you your peace.",
    "Trust that healing includes days when nothing visible shifts — roots grow in the dark.",
    "Ask: What am I carrying that is not mine to carry? Put down one item, even symbolically.",
    "Your emotions are not emergencies by default. Practice riding one wave without calling it catastrophe.",
    "If you feel alone in this, remember: many women are awake with similar hearts. You are in a wider we.",
]

CLOSINGS = [
    "Carry with you today: I can meet this moment without abandoning myself.",
    "One line worth keeping: My pace is allowed.",
    "Today’s gentle truth: I am still becoming, and that is not a flaw.",
    "Let this be enough for now: I showed up — and that counts.",
    "A phrase to return to: I deserve care on ordinary days.",
    "Hold lightly: I can be afraid and still choose what matters.",
    "Remember: asking for help is strength wearing a quiet voice.",
    "Take with you: I am not behind — I am on my path.",
    "Whisper if you need to: I am worthy of my own compassion.",
    "Keep close: Healing is not linear, and neither am I.",
    "For today: one breath, one step, one kind word toward myself.",
    "Let yourself hear: I am more than my hardest days.",
    "A small promise: I will not speak to myself in ways I would never speak to her.",
    "Today I practice: noticing without judging.",
    "Carry this: connection begins with how I treat myself.",
    "Enough said: I am allowed to begin again — gently.",
    "One truth: my feelings are information, not instructions.",
    "Return to: I can do hard things with tenderness.",
    "Note to self: rest is part of the work.",
    "Before you go on: I belong in my own life.",
]

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

def days_in_month(m, year=2025):
    if m == 2:
        return 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28
    return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]

def compose(day_index):
    title = TITLES[day_index % len(TITLES)]
    o = OPENINGS[day_index % len(OPENINGS)]
    m = MIDDLES[(day_index * 3 + 7) % len(MIDDLES)]
    c = CLOSINGS[(day_index * 5 + 11) % len(CLOSINGS)]
    return title, [o, m], c

def main():
    entries = []
    idx = 0
    for month in range(1, 13):
        dim = 28 if month == 2 else days_in_month(month)
        for day in range(1, dim + 1):
            title, paragraphs, carry = compose(idx)
            entries.append({
                "month": month,
                "day": day,
                "title": title,
                "paragraphs": paragraphs,
                "carry": carry,
            })
            idx += 1

    assert len(entries) == 365, len(entries)

    out = ["/* Aurora Companion — 365 daily meditations (original content). */", "window.AURORA_DAILY = " + json.dumps(entries, ensure_ascii=False, indent=2) + ";"]
    path = __file__.replace("scripts\\generate-daily-meditations.py", "daily-meditations.js").replace("scripts/generate-daily-meditations.py", "daily-meditations.js")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    print(f"Wrote {len(entries)} entries to {path}")

if __name__ == "__main__":
    main()
