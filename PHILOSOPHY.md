# Philosophy: the science does the work, not the user

> The user should have zero friction to start, and shouldn't have to be
> intentional or disciplined to get better results. We did the intentional
> part for them — it's baked into how the app is designed.

## The problem we're solving

Learning Chinese characters is scary to start and easy to quit. Most apps
fail people in one of two ways:

1. **Hard-work apps** (Anki and friends): scientifically excellent, but they
   hand the user the controls — configure your intervals, grade your own
   recall on a 4-point scale, build your own decks. The science only works
   if the user operates it correctly. Most people bounce off.
2. **Feel-good apps**: zero friction, lots of confetti, but the mechanics
   underneath are engagement-optimized, not memory-optimized.

This app is the third thing: **the rigor of the first, the feel of the
second.** Evidence-based mechanics, operated entirely by the app.

## Design principles

### 1. Zero friction to start
No account. No download. No setup quiz. No configuration. Opening the app
*is* starting: a card is already on screen. The atomic unit of value is one
recall (~5 seconds), so any visit length is a valid visit — one card in an
elevator or forty on the train. There is no session to start or finish;
closing the app is the end button.

### 2. The app is the discipline, so the user doesn't have to be
Every place where a study method normally demands user intentionality, the
app absorbs that work:

| The science says… | Hard-work apps make you… | We instead… |
|---|---|---|
| Space your reviews | Configure intervals, manage decks | Scheduler runs silently; "due" cards just appear |
| Test yourself | Decide how to self-grade (4+ options) | Two honest buttons: **Got it / Not yet** |
| Mix practice types | Pick modes, plan study variety | The deck rotates card fronts automatically |
| Target weaknesses | Notice your own weak spots | Engine measures 5 skills and tilts practice itself |
| Use mnemonics | Invent your own memory stories | Every character ships with one |
| Study consistently, briefly | Set schedules, resist cramming | Sessions are capped small; the app says when you're done |

### 3. Small bites, by design
New characters cap at 10 per day. The daily goal defaults low, and crossing
it triggers a "that's your daily bite" moment — keep tapping or leave, both
count. When nothing is worth reviewing, the app *tells you to leave* ("nap
time"). Stopping points are a feature: an app that never says "you're done"
is an app people feel behind on, and feeling behind is why people quit.

### 4. Warmth is load-bearing
The panda, the confetti, the "we'll get them next time" — these aren't
decoration. People don't abandon study methods because the methods fail;
they abandon them because the experience is cold and judgmental.
Consistency beats intensity, and warmth is what produces consistency.
Failure states are written with extra care: "Not yet" instead of "Wrong",
"wobbliest skill" instead of "weakness".

### 5. Show the science, never assign it
The "How you learn" panel explains what the app is doing on the user's
behalf — in plain English, one sentence at a time. It's transparency, not
homework. The user never receives an instruction like "you should review
more." If something should happen, the app makes it happen.

## The litmus test for new features

Before adding anything, ask:

1. Does it add a decision before the user can start learning? → redesign it.
2. Does it require the user to understand the science to benefit? → bury the
   science, keep the benefit.
3. Does it make the user feel behind, judged, or managed? → rewrite it.
4. Would it still work for someone with two spare minutes and zero
   motivation? → that's the target user on their worst day. Build for them.
