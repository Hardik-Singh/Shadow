# Demo Script — Shadow sourcing Nozomio (3 min)

## Context

You need a deterministic ~3-minute demo for Shadow with a real live case: a VC sourcing **Nozomio** (YC S25), founder **Arlan Rakhmetzhanov**. Goal of the demo is to show three things in order:

1. **Live behavioral capture** — Shadow watching you read Arlan's YC profile, surfacing a *unique* insight that feels like a smart associate did it (not generic summarization).
2. **One-click analyst work** — sourcing sheet → founder breakdown, with auto-attached Slack threads + a teammate's prior memo on the same space.
3. **Firm brain** — other partners' shadows (with distinct behavioral tendencies) reviewing the deal and disagreeing in-character.

The README already has a generic 3-act demo. This plan rewrites it around Nozomio specifically and lists every piece of canned data you need to pre-seed before stage. Hardcoded for now; we can soft-code later.

---

## The real-world facts to anchor on

These are public and verifiable — use them verbatim so an audience member googling along gets the same data:

- **Company**: Nozomio · YC S25 · SF · ~3 employees · founded 2025
- **Product**: Nia — search/index API giving AI coding agents live context (docs, research papers, datasets, private repos) so they don't rely on stale training data
- **Round**: $6.2M seed · CRV led · BoxGroup, LocalGlobe, + angels incl. Paul Graham, Thomas Wolf (HuggingFace)
- **Founder**: Arlan Rakhmetzhanov · 18 · solo founder · Kazakhstan immigrant · dropped out 11th grade · prior Stanford research (Caltech prof) on *Cobra*, a static-analysis tool for source-code defects · Forbes 30u30 · prior startup at 15 hit 20k users
- **Sourceable signals**: GitHub `arlanrakh`, personal site arlanrakh.com, recent YouTube interview, recent press in startupsunion / digitrendz / Yahoo Finance pitch-deck roundup

---

## Pre-seeded data you need (the "specifics" you asked for)

Hardcode these into `web/src/mock/data.ts` (or a new `mock/demo-nozomio.ts`) and into the Electron HUD's signal stream.

### 1. Behavioral prior on "you" (the partner running this demo)

Pre-seed memory so Shadow already "knows" you when the demo starts. Your profile is a **conviction-led technical investor** — you back young, obsessed founders. You will say YES on Arlan. The critiques (solo founder, hot round, no GTM) come from *other* partners' shadows — that's the demo's productive tension.

- weight: **strong technical-founder bias** (+heavy on shipping history)
- weight: **rewards conviction-driven young founders** — you've backed teen / college-age technical founders before
- weight: likes **dev-tools / infra / AI-infra** category
- weight: tolerates solo founders if they're shipping (you don't share the firm's solo-skepticism)
- flag-pattern: always asks "why now" on infra timing
- flag-pattern: checks whether the founder personally shipped vs. managed
- 3 prior memos in your voice (brief) on adjacent infra deals — used to make the thesis sound like you

### 2. **THE HEADLINE — an existing sourcing sheet from another analyst**

The moment you load Arlan's YC page, Shadow recognizes the company and surfaces a link to a **sourcing sheet that Analyst D already created two weeks ago**. This is the "our firm has already done some of this work" moment, and it reuses the existing sourcing-sheet component — no new artifact type to build.

The card looks like an existing-artifact chip in the HUD: `[ ◐ existing sourcing sheet · Analyst D · 2 wks ago → ]`

Clicking it opens the full sourcing sheet (same layout as the one we generate later) with Analyst D's avatar and timestamp on it. They've covered the basics: company, round, team, public news. They have **not** done the firm-memory cross-references, the personalized verdict, or the IC-style thesis. That's the gap your shadow will fill.

This sets up the contrast in Act 2: analyst sheet = facts; your shadow = *judgment in your voice*.

### 3. The "unique insight" Shadow surfaces when you open the YC page

Not a news summary. Something an associate would dig up — appears as a separate pill alongside the email-thread surface:

- **Hook**: "Arlan's Stanford research project (Cobra) was a code-analysis tool — Nozomio is a commercial generalization of his own undergrad research. This isn't a pivot, it's 4 years of consistent obsession."
- Shows up as a HUD pill: `[ insight: Cobra → Nia lineage → ]`

### 4. Auto-attached Slack threads (2)

- Thread #1: 3 weeks old, channel `#sourcing`, partner A pasted the TechCrunch Nia launch link with comment *"this is the thing I was talking about re: agent context"*
- Thread #2: 1 week old, channel `#deals-q2`, partner C asked *"anyone met arlan? heard PG re-upped"*
- Both surface inline on the sourcing sheet with click-through

### 5. Firm verdicts — five teammate shadows vote on your thesis

Five shadows, distinct behavioral tendencies, all vote the moment you submit your investment thesis + personalized verdict. The headline outcome: **3 against, 2 for.** This is the punchline — your firm just held an instant IC without anybody being in a room.

| Shadow | Behavioral tendency | Vote | One-line reasoning |
|---|---|---|---|
| **Partner A** (operator-first) | weights GTM execution, distrusts research-y founders | AGAINST | "academic origins worry me, no enterprise GTM signal yet" |
| **Partner B** (thesis-driven, infra) | bullish on dev-tools infra category | FOR | "this is the wedge — research moat + bottom-up dev distribution" |
| **Partner C** (founder-pattern matcher) | weights repeat-founder track record | AGAINST | "solo, 18, no prior infra ship — doesn't match our winners" |
| **Partner D** (price-sensitive) | hates entry valuations >$50M post for unproven GTM | AGAINST | "round is hot. PG + Wolf-driven. we'd be buying the hype, not the company" |
| **Partner E** (contrarian, early-bet) | rewards conviction in young founders | FOR | "Cobra→Nia is real conviction. ignore the round noise." |

Consensus: **3 against / 2 for** → punchline: *"five partners just held an IC in two seconds. would have been a 90-minute meeting."*

### 6. The artifacts to pre-render (or generate on click with canned content)

All of these need to look polished even if the click is fake:

- **Existing sourcing sheet by Analyst D** (Nozomio basics, real public facts, Analyst D's avatar/timestamp)
- **Investment thesis — Nozomio** in your voice, **bullish**: 3 paragraphs — (1) why now in dev-infra context layer, (2) why Arlan specifically (Cobra→Nia 4-year obsession, shipped Cobra, prior 20k-user startup), (3) why the obvious objections (solo, age, hot round) don't kill it for you
- **Personalized deal verdict** in your voice: **INVEST** · conviction high · suggested check $2M · top 3 reasons for, brief acknowledgment of risks but framed as monitorable — not blockers
- **Firm vote card** — 5 avatars, FOR/AGAINST chips, expandable to per-shadow reasoning

---

## The 3-minute script

Format: `[what you say] / (what's on screen)`.

### Beat 0 · Open (5s)

> "I'm pretending to be a VC. I'm about to look at a real YC company — Nozomio — and Shadow is going to watch me work."

(HUD visible bottom-right, idle. Browser open.)

### Act 1 · Recognition + existing analyst sheet (45s)

**0:05** — Open `ycombinator.com/companies/nozomio`.

**0:08** — HUD writes appear:
```
💾 recognized: Arlan Rakhmetzhanov · Nozomio · YC S25
💾 cross-ref: firm has prior work on this company
💾 updating: AI-infra category weight +4%
```

**0:15** — Two pills appear:
```
[ ◐ existing sourcing sheet · Analyst D · 2 wks ago → ]
[ ◆ insight: Cobra → Nia lineage → ]
```

> "Shadow recognizes this founder, and it's telling me one of our analysts already started a sourcing sheet on him."

**0:22** — Click the existing-sheet pill. The sourcing sheet opens — Analyst D's avatar and timestamp at the top, basic facts filled in (round, team, public news), but no firm-memory cross-refs and no verdict.

> "This is the basics. What it doesn't have is *my* take, or anybody else at the firm's take. Let's get there."

**0:45** — Close. Back to YC page.

### Act 2 · Personalized thesis + verdict (75s)

**0:45** — Two new pills:
```
[ write investment thesis → ]
[ generate personalized deal verdict → ]
```

**0:50** — Click `write investment thesis`. Thesis card slides in (~2s). Three short paragraphs in your voice — **bullish**:
- *why now* on dev-infra context layer
- *why Arlan specifically* — Cobra→Nia 4-year obsession, shipped Cobra at Stanford, prior 20k-user startup at 15
- *why the obvious objections don't stop me* — solo + age + hot round are noise; conviction lineage is signal

> "Read that — that sounds like me. I back young technical founders who ship. Shadow knows that."

**1:30** — Click `generate personalized deal verdict`. Verdict card slides in:
- recommendation: **INVEST**
- conviction: high
- suggested check: $2M
- top reasons FOR in your voice (Cobra lineage, ship signal, category timing)
- risks acknowledged but framed as monitorable, not blockers
- artifact-chip linking **Analyst D's sourcing sheet** rendered directly on the card

> "I'm in. That's my verdict. But I'm one partner — let's see what the rest of the firm thinks."

**1:50** — At the bottom of the verdict card: `[ submit to firm shadows for vote ]`. Click it.

→ Sets up Act 3.

### Act 3 · Firm shadow vote (60s)

**2:00** — Vote panel slides in. 5 teammate avatars animate, each flips to FOR/AGAINST one by one over ~3 seconds.

Final tally: **3 AGAINST · 2 FOR**

> "I said yes. Three of my partners' shadows said no. In two seconds. That's the IC meeting that didn't have to happen."

**2:15** — Click into the AGAINST column. Three one-line reasons surface:
- Partner A (operator-first): "no GTM signal yet"
- Partner C (founder-pattern): "solo, 18, no prior infra ship"
- Partner D (price-sensitive): "round is hot, we'd be buying hype"

**2:30** — Click Partner D's avatar — strongest dissent. Open D's shadow chat.
> Type: "what valuation would change your mind?"

Pre-canned reply in D's voice: *"$30M post or below, with a technical co-founder added. Above that we're paying for PG and Wolf, not for the company."*

**2:50** — Step back to the vote view. Surface a "firm consensus" line: **INVESTIGATE — pursue if co-founder added or terms come in.**

> "That's five partners' worth of judgment. On every deal. Forever. The meeting we just skipped would have been ninety minutes."

**3:00** — End.

---

## Files that need to change to make this play deterministically

You said hardcoded-for-now is fine, so the cheapest path:

- `web/src/mock/data.ts` — add a `nozomio` deal containing:
  - Analyst D's existing sourcing sheet (basics-only, attributed to D)
  - investment thesis artifact (3 paragraphs, your voice)
  - personalized deal verdict artifact (with Analyst D's sheet auto-attached as a "pulled from" chip)
  - 5 teammate-shadow profiles (A/B/C/D/E) with vote + one-line reasoning + canned chat replies
  - 2 Slack threads (kept, but secondary now)
- All artifacts reuse existing components — `ArtifactCard.tsx`, `Avatars.tsx`, `VerdictPill.tsx`, `SourceChips.tsx`. **No new components required.**
- Auto-link rule for the artifacts list: when the verdict is generated, it must show Analyst D's sourcing sheet as a linked artifact-chip on the card itself, not just in a "pulled from" footer. Same for the IC memo / thesis if regenerated later.
- `web/src/mock/data.ts` — add 3 teammate-shadow profiles (A/B/C) with distinct tendencies + canned chat replies for the two prompts in Act 3
- `web/src/components/firm/` — confirm there's a chat-with-teammate-shadow surface; if not, smallest-possible addition (single component reading from the canned reply map)
- `src/renderer/renderer.js` (Electron HUD) — a "demo mode" timeline: trigger memory writes and pill appearances on a timer the moment you press a hotkey. Keep it dumb: an array of `{atMs, action}` events.
- `src/main.js` — wire a global hotkey (e.g. ⌘⇧D) that starts the demo timeline. Lets you kick it off from stage without touching the laptop visibly.

Avoid: building real screen capture / vision / mic for stage. The demo is about behavior, not plumbing — fake signal stream is fine.

---

## Verification before stage

1. Run Electron app + web app side-by-side on the demo laptop.
2. Hit the demo hotkey with the YC Nozomio page already open in the browser.
3. Walk the full 3-minute script end-to-end **twice** with a stopwatch. The 90-second analyst-work act is the one most likely to overrun.
4. Test with the laptop unplugged from external display once — projector reflows can break the HUD position; pin the HUD to fixed pixel coords for stage resolution.
5. Have a fallback: if the HUD glitches, you can still walk the firm-brain tab in the web app alone — Act 3 stands on its own.

---

## Open questions before building

- Real teammate names/avatars for Partners A–E, or made-up?
- I'll write all the canned copy (thesis, verdict, 5 vote reasonings, Partner D chat reply) directly into mock data on the worktree.

---

## TL;DR — the demo in 6 lines

1. Open Arlan's YC page. Shadow recognizes him + the company.
2. A pill surfaces an **existing sourcing sheet by Analyst D**. Click → real public Nozomio facts already pulled.
3. Click `write investment thesis` → 3 paragraphs in your voice, **bullish on Arlan** (Cobra→Nia lineage, ship signal, you back young technical founders).
4. Click `generate personalized deal verdict` → **INVEST**, $2M, conviction high. Analyst D's sheet auto-linked as an artifact-chip on the card.
5. Submit to firm shadows. 5 avatars vote in 2s: **3 AGAINST · 2 FOR.** Each dissent shows a one-liner in that partner's voice (solo founder / GTM gap / valuation too hot / pattern mismatch).
6. Click into Partner D (price-sensitive) — or **any** of the 5 avatars — to open a chat window with that partner's shadow. Each has canned replies in their own voice. Close: *"that's the IC meeting we just skipped."*

---

## Build target

Create a git worktree off `main`, do all demo work there. Reuse existing components only. New mock data + a global hotkey to play the timeline. No new artifact components. Chat-with-any-shadow surface is wired into every avatar in the firm vote view.
