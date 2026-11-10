# @tech_blogcorner video style guide

**Every @tech_blogcorner video must copy the look of "7 Free AI Tools Every Student Needs"**
(`reels/7-free-ai-tools-students` on branch `claude/student-ai-tools-reel-hkz6fy`).
Do not invent a new look. If a brief asks for other colors, fonts or layout, follow this
guide and point out the conflict to the owner.

- Reference source: `reels/_brand/reference_reel.html` (start every new video from this file)
- Reference frames: `reels/_brand/reference_frames.png`

## Colors
| Token | Value | Use |
|---|---|---|
| Background | `#030403` (near-black) | page background |
| Accent green | `#22E06F` | key words, labels, pills, active caption word, wipe |
| Dark green | `#0E7A3C`, deep `#06331A` | glow blobs, tints, secondary bars |
| Text | `#F5F8F6` | headlines and body |
| Muted | `#8A938C` | small labels |

Do **not** use `#00FF66` or flat black.

## Background (every frame)
- 3 blurred glow blobs (blur 140px): dark green `#0E7A3C`, deep `#06331A`, accent `#22E06F` at ~18%.
- Faint 90px grid (`rgba(255,255,255,.08)`), radially masked to the center.
- Soft vignette at the edges.

## Fonts
- **Montserrat Black (900)** for titles: tool/topic names ~112–128px, tight letter-spacing (-.035em).
- **Space Mono Bold** for small labels in green: `TOOL 01 / 07`, `FOR STUDENTS · 100% FREE`, ~32–34px.
- **Instrument Serif Italic** for elegant subtitles: "every student needs", "AI tools that actually help".
- **Inter** for one-liners (~56px, weight 700, key words in green bold) and UI mockups.
- Font files: `/root/.claude/skills/effects/fonts/`.

## Layout (1080x1920)
- Progress bar: one segment per item, top 118px, left/right 90px, green fill with glow.
- Label (Space Mono, green) at y≈230 → logo + big name at y≈292 → `FREE` pill + mono category at y≈430 → one-liner at y≈540.
- Glass card at y≈760, 900x640, radius 44px, translucent white gradient, 1.5px light border, green tint glow in a corner. The demo/mockup animation goes inside the card.
- Real tool logos on white rounded tiles (letter tile if a logo file isn't available).

## Captions
- Bottom area, top ≈ 1500px, centered. Montserrat 900, ~66px, UPPERCASE.
- White text; the spoken word turns accent green and scales up to 1.08.
- Up to 3 words per chunk, broken at punctuation.

## Hook (and cover)
- Mono green tag on top → giant number (Montserrat 900, ~560px, white→green gradient, green glow)
  → big title (e.g. `FREE AI TOOLS`) → Instrument Serif italic subtitle → row of item pills with logos
  → green `SAVE THIS` pill with a bookmark icon.
- **Cover image = this hook frame** (same layout, colors and fonts). Don't make a separate design.

## Motion
- Scene transitions rotate between whip, zoom and a full-screen green wipe; light white overlay flash on cuts.
- Elements pop/rise in with a slight blur-to-sharp; typing for prompts.

## CTA ending
- Mono tag (e.g. `ALL 7 · ALL FREE`) → grid of item pills → "Follow for more" (Montserrat)
  + serif italic subline → `Follow` button that a cursor taps and flips to `Following ✓`.

## Voice & audio
- Kokoro TTS, voice **`am_michael`** (male), speed **1.06**, `en-us`, with the "AI" phoneme fix
  (`ˌeɪˈaɪ` → `ˈeɪ ˈaɪ`). See `tts.py` in any reel.
- Original synthesized music bed under the voice (ducked); loudness around -14 LUFS.

## Deliverables
- Video MP4 + `CAPTION.md` (post caption with hashtags) in the reel's folder, sources in `source/`.
