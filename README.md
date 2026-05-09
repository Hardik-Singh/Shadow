# Shadow
**clone irreplaceable human judgment at scale**

---

## what it is

Shadow watches you work -- your screen, your voice, documents you drop in -- and builds a live behavioral model of how you think. it runs silently in the corner of your screen, predicts what you need next, and surfaces clickable actions to do the work for you.

not a chatbot. not a summarizer. a judgment clone that gets sharper every hour.

---

## the demo problem + fix

shadow needs behavioral history to be impressive. you don't have any at 9am.

**solution: pre-seed with synthetic history before the event.**

create and feed in before you start:
- 5-6 past memos you "wrote" (mix of pass/invest, in your voice)
- voice notes you "left yourself" while evaluating companies
- 2-3 sourcing sheets in your style
- 1 investment thesis doc -- what you care about, 1 page

shadow treats it as real history. demo feels like it's been watching you for weeks.

---

## the core loop

```
you read a document
→ shadow watches your screen + listens to your voice
→ shadow figures out what you're looking at
→ shadow predicts what you want to do next
→ clickable suggestion appears in the HUD
→ you click it → shadow does the work
→ you ignore it → shadow learns you didn't want that
→ model gets sharper
```

---

## three main parts

---

### part 1: the capture

shadow runs silently in the background capturing three streams:

**screen**
takes a screenshot every few seconds. vision model reads it and figures out what you're looking at. not just "a pdf" -- specifically "team slide, Series A deck, reading about the CTO."

tracks dwell time. 30 seconds on the team slide is a signal. 3 seconds on the market size slide and scrolling past is a different signal.

**voice**
mic is always on. transcribes everything you say out loud while working:
- "hmm this TAM feels made up"
- "i wonder if they've talked to stripe"
- "short cofounder relationship, flag that"

these are the richest signals. what you mutter is what you actually think.

**file drop**
drag any file onto shadow -- pitch deck, one pager, CIM, earnings call transcript. shadow ingests it, chunks it, adds it to the current context.

every signal gets timestamped and stored:
```
{ type: "screen", content: "team slide, CTO is ex-Google", dwell_ms: 34000 }
{ type: "voice", content: "i don't trust this CAC number" }
{ type: "file", content: "Series A deck, Acme Inc, $8M ask" }
```

---

### part 2: the HUD

floating overlay, bottom right corner of your screen. always visible, never in the way. this is what judges watch during the demo -- they see shadow learning you in real time.

```
┌─────────────────────────────────┐
│  ◈ SHADOW              ● live  │
├─────────────────────────────────┤
│  👁  team slide · Series A      │
│  🎙  "i don't trust this CAC"   │
│  ⚡  signal captured            │
├─────────────────────────────────┤
│  YOUR PROFILE                   │
│  ████████░░  technical founders │
│  ███████░░░  B2B infrastructure │
│  ██░░░░░░░░  consumer plays     │
│                                 │
│  confidence: 74% ↑              │
│  signals today: 147             │
├─────────────────────────────────┤
│  SHADOW THINKS YOU WANT TO:     │
│                                 │
│  [ look up CTO on github →  ]   │
│  [ check TAM comparables →  ]   │
│  [ generate sourcing sheet →]   │
├─────────────────────────────────┤
│  TODAY'S ARTIFACTS              │
│  📄 Acme Inc · IC memo          │
│  📊 B2B SaaS · comp table       │
│  🏷  Flagged: short cofounder   │
└─────────────────────────────────┘
```

**how the HUD behaves:**
- what you're reading updates every few seconds
- last thing you said shows in real time
- confidence score ticks up visibly as signals stack up
- suggestions refresh every time shadow reads a new screen state
- clicking a suggestion fires the action immediately
- ignoring a suggestion is logged as a negative signal
- artifacts accumulate below as you work

---

### part 3: the actions (what you can click)

when shadow surfaces a suggestion you click it and it does the actual work. every output is a structured artifact card, not a wall of text.

---

**suggestion: look up founder / CTO**
shadow opens their github, linkedin, past companies. surfaces a card:
```
┌─────────────────────────────────────┐
│  FOUNDER PROFILE · JAMES CHEN       │
├─────────────────────────────────────┤
│  prev: Stripe (eng lead, 4yr)       │
│  github: 340 commits last 90 days   │
│  2 prev startups: 1 acq, 1 shutdown │
│                                     │
│  shadow: strong technical signal    │
│  you usually like this profile      │
└─────────────────────────────────────┘
```

---

**suggestion: generate sourcing sheet**
full background file on the company. everything you'd want before a first call.
```
┌─────────────────────────────────────┐
│  SOURCING SHEET · ACME INC          │
├─────────────────────────────────────┤
│  founded: 2023 · SF · 8 employees   │
│  ask: $8M Series A                  │
│  product: B2B infra for agents      │
│                                     │
│  team: ...                          │
│  market: ...                        │
│  competitors: ...                   │
│  recent news: ...                   │
│  what you'd want to dig on: ...     │
└─────────────────────────────────────┘
```

---

**suggestion: generate IC memo**
investment committee memo written in your voice with your specific conviction level and skepticisms baked in.
```
┌─────────────────────────────────────┐
│  IC MEMO · ACME INC                 │
│  generated by shadow                │
├─────────────────────────────────────┤
│  RECOMMENDATION: INVEST             │
│  conviction: medium-high            │
│                                     │
│  why i like it:                     │
│  ...                                │
│                                     │
│  what would kill this deal:         │
│  ...                                │
│                                     │
│  questions before IC:               │
│  ...                                │
├─────────────────────────────────────┤
│  [ copy ]  [ edit ]  [ flag ]       │
└─────────────────────────────────────┘
```

---

**suggestion: check TAM / market comps**
shadow checks the TAM claim against comparable companies and recent deals.
```
┌─────────────────────────────────────┐
│  MARKET CHECK · AI INFRA            │
├─────────────────────────────────────┤
│  claimed TAM: $40B                  │
│  shadow assessment: plausible       │
│                                     │
│  comparable exits:                  │
│  · Datadog IPO: $38B                │
│  · Honeycomb acq: ~$200M            │
│                                     │
│  you flagged TAM skepticism:        │
│  "made up" said 3x today            │
└─────────────────────────────────────┘
```

---

**suggestion: flag this deal**
one click to add a deal to your watchlist with shadow's read attached.
```
┌─────────────────────────────────────┐
│  DEAL FLAGGED · ACME INC            │
├─────────────────────────────────────┤
│  shadow verdict: investigate        │
│  your likely take: cautious yes     │
│                                     │
│  key signals:                       │
│  ★ strong technical founder         │
│  ⚠  TAM claim unverified            │
│  ⚠  cofounders met 8 months ago     │
│                                     │
│  [ generate full memo ]             │
│  [ schedule follow-up ]             │
│  [ pass                ]            │
└─────────────────────────────────────┘
```

---

## what shadow learns over time

every click and ignore updates the behavioral model:

- clicked "look up CTO github" 8 out of 10 times → technical founder signal weighted high
- always ignored "check consumer comps" → consumer plays not your thing
- said "feels expensive" three times before passing → valuation sensitivity flag
- spent 40+ mins on B2B infra decks, under 5 on consumer → preference locked in

the model compounds. day 30 shadow is dramatically smarter about you than day 1.

---

## finance domains

same engine everywhere. only the artifact templates change.

| domain | what you read | what shadow creates |
|--------|--------------|-------------------|
| venture capital | pitch decks, one pagers | sourcing sheet, IC memo, deal card |
| hedge fund | 10-K, earnings calls, news | position thesis, trade note, risk flags |
| private equity | CIM, financials, mgmt decks | due diligence summary, LBO notes |
| investment banking | comps, precedents, models | pitchbook sections, comp table |

demo skin: VC. same codebase for all of them.

---

## demo script (3 mins)

> "shadow has been watching me since 9am. i haven't told it anything."

*show HUD. confidence 74%. 147 signals.*

> "it's been building a model of how i think."

*show profile weights. technical founders high. consumer low.*

> "new company just landed. never seen it."

*drag pitch deck onto screen live.*

*HUD updates. three suggestion buttons appear.*

> "shadow already knows what i want."

*click "look up CTO" -- founder card appears.*
*click "generate sourcing sheet" -- sheet builds in 20 seconds.*
*click "generate IC memo" -- memo appears in your voice.*

> "i didn't write a rule. i didn't write a prompt. i just worked."

---

## rubric

| criterion | weight | how shadow scores |
|-----------|--------|------------------|
| cross-source synthesis | 30% | screen + voice + files + live web all synthesized through your behavioral model |
| real work not just answers | 25% | every artifact is something you'd actually send -- memo, sourcing sheet, deal card |
| hyperspell integration | 25% | behavioral model lives in hyperspell, removing it kills the product entirely |
| demo + presentation | 10% | live on stage, judges watch it work, HUD is visually alive |
| judge's personal rating | 10% | "what if your best judgment didn't leave when you did" |

---

## the one line

**"shadow is what you get when you stop asking AI to answer questions and start letting it watch you work."**
