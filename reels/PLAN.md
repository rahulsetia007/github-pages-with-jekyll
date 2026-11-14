# @tech_blogcorner Reels plan (Days 6–12)

Account focus: fixing Google and Meta ads with simple AI shortcuts.

Look: follow `_brand/STYLE_GUIDE.md` exactly. This file covers story, hooks and pacing.

## How every Reel is built (for how Instagram ranks Reels)
Instagram first shows a Reel to a small test group. Its main signals are watch time,
likes, and sends (shares in DMs), and sends matter most for reaching people who don't follow you.
So every video:
1. **Opening slide (the cover) holds 1–1.5 s only** (`HOOK_HOLD=1.4`), then a text scene ("thesis")
   finishes the opening line: the question small on top, the statement big, the serif line under it,
   timed to the voice. Best example: `bonus-shopify-google-ads` (approved hook).
2. **Frame 1 names the world and shows a gap the viewer feels.** Put the tools in the first frame
   (logos on the cover), and show a contradiction they recognise from their own account: orders piling
   up in Shopify while Google Ads sits at 0. A vague promise ("60 seconds") is not a hook.
   The anticipation element (counter or meter) must be part of that gap, landing on the key word.
3. **Hook in second 1 = the viewer's problem**, said out loud and on screen. Like
   "Your Reels are stuck at 200 views?" No intros, no "hey guys".
4. **One idea per scene, 3–6 s each.** Never more than one new thing to read at once.
   Leave a short breath between lines. 30–45 s total is fine when it holds attention.
5. **Open loop early**: the hook pills preview the steps, so people stay for the payoff.
6. **Show the fix working** (before/after, a number moving, a check appearing).
7. **Give real value**: the actual prompt and real example output, all of it in the caption.
8. **End with a send**: "Send this to a [person] who [has the problem]", then Follow.
9. Captions for all three platforms in CAPTION.md (first line repeats the problem, then the prompt, the output, a send line):
   - **Instagram**: under 2,200 characters, save + send line, 3–5 specific hashtags (only as many as fit the topic).
   - **TikTok**: search keywords written into the text (e.g. "ChatGPT prompt for…"), 3–5 hashtags.
   - **YouTube Shorts**: title under 100 characters with the main search phrase, a description with the
     prompt and output, "subscribe" instead of "follow", and 2–3 hashtags (only the first 3 show above the title).

## Audience (updated from the doc, 12 Nov)
Marketers, creators and small business owners who want to fix their **Google and Meta ads** with simple AI shortcuts.
Source of truth for each day's topic, facts, example data and voiceover lines: the doc
"Reel Scripts for Claude Code: Days 6 to 12" (https://claude.ai/artifact/8Bxbf3729j6M5HEk2uwx4X).
Use its story beats, example rows, settings names and voiceover lines, but build them in the house style
(`_brand/STYLE_GUIDE.md`) with the flow and pacing rules above. The doc's master brief look
(Anton, #22C55E, terminal style, 13–15 s) is replaced by the style guide and this plan.
Keep the doc's call to action as written (send line, or "Comment PMAX / AUDIT").
Keyword calls to action per platform (the DM texts live in `_dm/`, sent by ManyChat on Instagram):
- **Instagram**: "Comment PMAX" in the video and caption.
- **TikTok**: "DM me PMAX" in the caption (TikTok has no comment-to-DM; set a keyword auto-reply in DMs).
- **YouTube Shorts**: "Checklist in the description", with the full `_dm/` text pasted into the description.
Never show real Google or Meta interfaces: draw simple original cards marked "Example".
Tool logos are fine (the style guide asks for them): put them on white rounded tiles. Logo SVGs come from
Simple Icons (CC0, `npm pack simple-icons`) recolored to the brand color; see `bonus-shopify-google-ads/source/logos/`.
Blur or leave out account IDs and client names.

## Days
| Day | Topic (from the doc) | Hook (problem first) | Call to action |
|---|---|---|---|
| 6 | Google Ads paying for junk searches | Your Google Ads are paying for this. | Save this |
| 7 ✅ posted | 1 video → 5 posts | Posting every day and still burnt out? | a creator out of ideas |
| 8 ✅ | Google Ads showing outside your city | Your Google Ads are showing outside your city. | Send this to a local business owner |
| 9 ✅ | 7 Google Ads settings burning your budget | 7 settings are burning your budget. | Save this and audit your account |
| 10 | Google Ads says 40 leads, inbox says 12 | Google Ads says 40 leads. Your inbox says 12. | Send this to someone running Google Ads |
| 11 | Performance Max paying for your brand name | You paid for this click. | Comment PMAX for the checklist |
| 12 | Find wasted spend in 5 minutes with AI | Stop checking your search terms by hand. | Comment AUDIT for the prompt |

The earlier Day 6 build (`day-06-30-reel-hooks`, "Stuck at 200 views?") stays in the repo as a bonus video.
The new Day 6 (junk searches) gets its own folder when it's built.

Flow template (owner's script structure, see CLAUDE.md and `_brand/script-structure.jpg`):
**Pain** (cover 1.4 s + hook scene: the gap, counter lands on the key word) →
**Poke** (what it costs them right now) →
**Fix** (steps, one scene each) →
**Payoff** (the result working, the high point) →
**Recap** (one scene: all steps tick through as a checklist) →
**CTA** (send / save / comment KEYWORD) + Follow.
Label every voiceover line in vo.txt with its beat, e.g. `pain|…`, `poke|…`, `fix1|…`, `payoff|…`, `recap|…`, `cta|…`.