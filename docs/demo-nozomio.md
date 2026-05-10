# Demo Script v2 — Shadow sourcing Nozomio (3 min)

## What this demo shows, in one sentence

Shadow watches you research a real founder live, surfaces thoughts + pulls together a source sheet with no clicks, then once you open his pitch deck offers to draft an investment memo and intro email *in your voice* — and finally, on the memo, lets you instantly poll the rest of the firm's shadows and chat with any of them in their own voice.

Real case: **Nozomio (YC S25), founder Arlan Rakhmetzhanov**.

---

## Real-world facts to anchor on

Public + verifiable — use verbatim:

- **Company**: Nozomio · YC S25 · SF · ~3 employees · founded 2025
- **Product**: Nia — search/index API giving AI coding agents live context (docs, papers, datasets, private repos)
- **Round**: $6.2M seed · CRV led · BoxGroup, LocalGlobe, + angels incl. Paul Graham, Thomas Wolf (HuggingFace)
- **Founder**: Arlan Rakhmetzhanov · 18 · solo founder · Kazakhstan immigrant · dropped out 11th grade · prior Stanford research (Caltech prof) on *Cobra* (static-analysis tool) · Forbes 30u30 · prior startup at 15 hit 20k users
- **Sourceable signals**: GitHub `arlanrakh`, arlanrakh.com, recent YouTube interview, press in startupsunion / digitrendz / Yahoo Finance pitch-deck roundup

---

## How the demo is triggered (no hotkeys, no fakery)

The HUD has live screen capture. Once we **skip the LLM classifier** in `src/suggest/vision-signal.js` and use raw substring matching on the OCR'd caption text, detection is deterministic.

**Trigger keywords (all OR'd, case-insensitive substring on caption text):**

`arlan` · `linkedin` · `nozomio` · `rakhmetzhanov` · `deck` · `.pdf` · `slide`

State machine, two stages — same trigger list, different acts based on which stage we're in:

- **Stage 1 (initial)**: any keyword match → fire Act 1 timeline once, advance state
- **Stage 2 (post-Act-1)**: any keyword match → fire Act 2 timeline once

Hotkey fallback (e.g. ⌘⇧D) injects the same scripted timeline directly, in case stage lighting / OCR misses everything.

Pacing: ~2–4s pause between detection and first thought (so it feels like Shadow is reading, not magic). Thoughts pulse out every 3–5s, not in one burst.

**Memo links + artifact links inside the HUD point to `http://localhost:<webPort>`** (the local web app) — so the firm-brain handoff opens our running app, not anything external.

---

## Pre-seeded data

All in `web/src/mock/data.ts` (extend the existing nozomio shape) + a new `src/renderer/demo-nozomio-timeline.js` for the HUD scripted thought stream.

### A. Behavioral prior on "you"

- conviction-led technical investor; backs young, obsessed founders
- strong technical-founder bias; rewards shipping history
- likes dev-tools / infra / AI-infra
- tolerates solo founders if they're shipping
- always asks "why now" on infra timing
- checks whether the founder personally shipped vs. managed
- comms style: lowercase, direct, anti-formality (apply this to every artifact written "in your voice")

### B. Past comps in your "history" (so the memo can cite them)

Default: **Pinecone (March visit)** + **Modal (Feb visit)**. Both context-layer / dev-infra plays; both pattern-match Nozomio's wedge. Swap names if you want.

### C. Two people in your network who know Arlan

- **Sarah Chen** — overlapped with Arlan at Stanford AI lab, can warm-intro
- **Marcus Liu** — angel in Cobra, knows Arlan's technical chops firsthand

### D. The five firm shadows (reuse existing teammates)

Mapping to `teammates` already in `web/src/mock/data.ts`:

| Shadow | Behavioral tendency | Vote | One-liner |
|---|---|---|---|
| **Sarah K.** (operator-first) | weights GTM execution, distrusts research-y founders | AGAINST | "academic origins worry me, no enterprise GTM signal yet" |
| **Jin P.** (thesis-driven, infra) | bullish on dev-tools infra | FOR | "this is the wedge — research moat + bottom-up dev distribution" |
| **Marcus T.** (founder-pattern matcher) | weights repeat-founder track record | AGAINST | "solo, 18, no prior infra ship — doesn't match our winners" |
| **Linda R.** (price-sensitive) | hates entry valuations >$50M post for unproven GTM | AGAINST | "round is hot. PG + Wolf-driven. we'd be buying the hype, not the company" |
| **Henry C.** (contrarian, early-bet) | rewards conviction in young founders | FOR | "Cobra→Nia is real conviction. ignore the round noise." |

**Final tally: 3 AGAINST · 2 FOR.**

Each shadow has a canned chat reply for ~2 prompts each, in their voice. Linda R.'s key line (most-likely click target): *"$30M post or below, with a technical co-founder added. above that we're paying for PG and Wolf, not for the company."*

### E. Artifacts to pre-seed (rendered on demand from canned content)

1. **Source sheet — Nozomio** (created in Act 1 off the LinkedIn page). Contents:
   - Public news links: TechCrunch Nia launch, Yahoo Finance pitch-deck roundup, startupsunion, digitrendz
   - X activity: recent posts, follower spike post-launch
   - GitHub `arlanrakh`: repo list, commit cadence, top languages
   - Cobra Stanford research paper + Caltech advisor
   - Prior 20k-user startup at age 15
   - Forbes 30u30, YC S25, $6.2M seed, CRV / PG / Wolf
   - "people you know who know him": Sarah Chen, Marcus Liu (with how they know him)
   - Comp note: *"reads like Pinecone (march visit) — same context-layer wedge, earlier stage"*

2. **Investment memo — Nozomio** (created in Act 2 from the deck). In your voice (lowercase, direct):
   - **comp paragraph**: explicit references to Pinecone (March) and Modal (Feb) — same context-layer thesis, earlier stage, more technical founder
   - **what i like** — pulled straight from your behavioral profile: technical founder who ships (Cobra→Nia lineage), conviction signal, young-founder bias, dev-infra wedge timing
   - **what gives me pause** — also from your profile: solo founder (i usually tolerate), hot round (i usually avoid), no GTM yet
   - **verdict**: invest · conviction high · suggested check $2M
   - footer: `[ get shadows' opinions → ]` button

3. **Intro email to Arlan** (created in Act 2). In your voice — short, lowercase, no formalities, no "Dear Arlan / Best regards". Two sharp questions:
   - one on Cobra→Nia technical lineage
   - one on CRV's terms / what's still open in the round

Both artifacts auto-append to the **Related Artifacts** list on the deal — so the panel visibly grows from 1 (source sheet) → 2 (+memo) → 3 (+email) over the demo.

---

## The 3-minute script

Format: `[time] — [what's on screen] / "what you say"`.

### Beat 0 · Open (5s)

> "i'm pretending to be a vc. i'm about to look at a real yc founder — arlan, nozomio — and shadow is going to watch me work. nothing on screen is faked except the speed."

(HUD visible bottom-right, idle. Browser open to a neutral tab.)

### Act 1 · LinkedIn → source sheet (60s)

**0:05** — open `linkedin.com/in/arlanrakh` (or the closest real URL). HUD detects "linkedin" + "arlan" → fires Stage 1 timeline.

**0:08** — first thought:
```
💭 you seem to be looking at a new founder
📝 Arlan Rakhmetzhanov · profile viewed
```

**0:13** —
```
💭 want me to put together a founder profile? i'll pull github, x, news, the cobra paper, his prior startup
📝 cross-ref: similar to Pinecone, Modal lookups from last month
```

**0:18** — quick targeting questions (text in stream, not buttons — they auto-resolve in ~3s for stage):
```
💭 actually — 2 quick things first so this matches your read:
   → angle: technical depth or market timing?
   → comp set: dev-tools infra (pinecone / modal / replit)?
```

**0:24** — answers register, generation starts:
```
📝 angle: technical depth · comp set: dev-tools infra
💭 pulling sources… give me a sec
```

**0:28** — source sheet card slides in inline. All sections populated (see §E.1). Related Artifacts panel updates: **1 artifact**.

> "no clicks. it watched me, asked me how to frame it, and pulled together what an analyst would have spent two hours on."

**0:50** — final thought before you move on:
```
💭 also — 2 people in your network know arlan. surfaced in the sheet.
📝 source sheet · Nozomio · saved
```

### Act 2 · Pitch deck → memo + intro email (75s)

**1:05** — open `Nozomio_deck.pdf` (any PDF named to match — keyword `.pdf` + `nozomio` triggers Stage 2).

**1:08** — HUD:
```
💭 you opened a deck — looks like you're getting ready for an ic meeting on this one
💭 here's what i can put together for you:
   📋 investment memo — your voice, references your past comps + your likes/dislikes
   ✉️  intro email to arlan — your voice, 2 sharp questions
```

(Both surface as text in the thought stream and as artifact-create chips. Click each one.)

**1:20** — click `📋 investment memo`. Memo card slides in (~2s) with full content (see §E.2). Lowercase, direct, references Pinecone + Modal explicitly. Footer: `[ get shadows' opinions → ]`. Related Artifacts: **2 artifacts**.

> "read it. that sounds like me — lowercase, no fluff, names the comps i actually saw, calls out what i actually care about and what i actually shrug off."

**1:50** — click `✉️ intro email`. Email card slides in. Same voice. Two sharp technical questions, no formalities. Related Artifacts: **3 artifacts**.

> "and that's the email i'd actually send. not 'dear arlan, hope this finds you well.'"

**2:10** — back on the memo card. Click `[ get shadows' opinions → ]`.

→ Sets up Act 3.

### Act 3 · Firm shadow vote + chat (50s)

**2:15** — `get shadows' opinions` button is replaced by a link/chip that opens the local web app (`http://localhost:<port>/firm/nozomio`) to the deal page. Memo is there with all 5 shadows attached as reviewers.

**2:18** — 5 avatars animate in, each flips to FOR/AGAINST one by one over ~3s.

Final tally: **3 AGAINST · 2 FOR**.

> "i said yes. three of my partners' shadows said no. in two seconds. that's the ic meeting that didn't have to happen."

**2:30** — click into the AGAINST column. Three one-liners surface (see §D).

**2:40** — click **Linda R.** (price-sensitive — strongest dissent). Chat panel opens.
> Type: "what valuation would change your mind?"

Pre-canned reply in Linda's voice: *"$30m post or below, with a technical co-founder added. above that we're paying for PG and Wolf, not for the company."*

**2:55** — step back. Surface a "firm consensus" line: **INVESTIGATE — pursue if co-founder added or terms come in.**

> "five partners' worth of judgment. on every deal. forever. the meeting we just skipped would have been ninety minutes."

**3:00** — end.

---

## Files that need to change

- `src/suggest/vision-signal.js` — add a "demo keyword shortcut" path: if caption text contains any of the trigger keywords (substring, case-insensitive), bypass the LLM classifier and emit a deterministic signal. Wire a feature flag or env var so this can be toggled for stage.
- `src/renderer/renderer.js` — add a `demo-nozomio-timeline.js` module: an array of `{atMs, action}` events for both stages. Subscribe to vision signals, advance the state machine, fire timeline.
- `src/main.js` — wire a hotkey (⌘⇧D) that force-fires the next stage of the timeline (fallback if vision misses).
- `web/src/mock/data.ts` — add the `nozomio` deal: source-sheet content, memo content, intro-email content, 5 shadow profiles with vote + one-liner + canned chat replies.
- `web/src/components/firm/DealDetail.tsx` — confirm the deal page renders the memo with attached shadows + vote tally + clickable avatars opening a chat panel. Add the chat-with-shadow surface if it's not there.
- `web/src/components/MyArtifacts.tsx` (or whichever renders Related Artifacts) — make it reactive so newly-created artifacts append visibly during the demo.

Reuse existing components everywhere possible. No new artifact types.

---

## Verification before stage

1. Run Electron app + web app side-by-side on the demo laptop.
2. Open `linkedin.com/in/arlanrakh` (or fallback URL). Confirm HUD picks up "linkedin" / "arlan" within 5s.
3. Open `Nozomio_deck.pdf` (any PDF named that way). Confirm Stage 2 fires.
4. Walk the full 3-minute script end-to-end **twice** with a stopwatch. Act 2 (75s) is the most likely overrun — practice the click-and-talk pacing.
5. Test once with the laptop unplugged from external display — projector reflows can break HUD position; pin to fixed pixel coords for stage resolution.
6. Confirm the `get shadows' opinions` button's link resolves to the local web app port that's actually running on stage (`localhost:<port>`), not a hardcoded dev port.
7. Fallback: hotkey ⌘⇧D force-fires whichever stage is next. If vision misses entirely, you can drive the whole demo from the keyboard and nobody knows.

---

## TL;DR — the demo in 6 lines

1. Open Arlan's LinkedIn. HUD detects, surfaces thoughts (no clicks), asks 2 framing questions, pulls together a source sheet with news / X / GitHub / network intros / comp note. Related Artifacts: 1.
2. Open Arlan's pitch deck PDF. HUD: *"looks like you're getting ready for an IC meeting"* + 2 artifact suggestions: investment memo + intro email.
3. Click memo → renders in your voice (lowercase, blunt), explicitly references Pinecone + Modal as past comps, lists what you like / what gives you pause from your behavioral profile, verdict INVEST $2M. Footer: `[ get shadows' opinions ]`.
4. Click intro email → renders in your voice (lowercase, no formalities, 2 sharp questions). Related Artifacts: 3.
5. Click `get shadows' opinions` on the memo → button becomes a link to the local web app deal page. 5 shadows vote in 2s: **3 AGAINST · 2 FOR**.
6. Click any avatar → chat with that shadow in their own voice. Close on Linda R.: *"that's the ic meeting we just skipped."*
