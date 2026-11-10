# @tech_blogcorner Reels: Days 6 to 12

These are faceless Reels built from the scripts in the doc *Reel Scripts for Claude Code: Days 6 to 12*.

| Day | File | Length |
| --- | --- | --- |
| 6 | `exports/day-06.mp4`: 30 Reel hooks (list) | 14s |
| 7 | `exports/day-07.mp4`: 1 video → 5 posts | 13s |
| 8 | `exports/day-08.mp4`: Reply to a 1-star review | 14s |
| 9 | `exports/day-09.mp4`: 30 promo ideas (list) | 14s |
| 10 | `exports/day-10-PREVIEW.mp4`: Phone photo → studio shot (**needs your photos**) | 12s |
| 11 | `exports/day-11.mp4`: 7 prompts = 1 free marketing team | 15s |
| 12 | `exports/day-12.mp4`: Your headline is the problem | 14s |

All videos are 1080x1920, 30 fps, H.264, with AAC audio. The audio is sound effects only, with peaks at -6 dB. The voice track is left empty for your voiceover.

## What follows the master brief
- Frame 1 is already moving, and the hook (8 words or fewer) is on screen at 0:00 with a sound hit.
- A new visual appears every 1 to 2 seconds.
- Text stays out of the top 250 px, the bottom 420 px and the right 120 px.
- The last 0.4 s crossfades into frame 1 so the video loops.
- Colours are #050805, #22C55E, #1E9447, #7CFF5A and #F5F5F5.
- Headlines use Anton, uppercase, with a grey shadow. Lists and prompts use JetBrains Mono.

## What differs from the brief
- **There is no `/effects` folder.** The sounds (hit, whoosh, pop, tick, typing, reveal, rewind, scratch) are synthesised in `src/sfx.py`. Every video uses the same kit.
- **Caveat Brush isn't available**, so the accents use Permanent Marker.
- **I wrote the "ChatGPT output" inputs** (hooks, posts, reply, promos, headlines) in `inputs/`. Paste your own ChatGPT answers over them and re-render if you prefer.
- **Prompt screenshots are drawn as an original terminal card**, with no ChatGPT UI or logos.
- **Day 8 uses a shorter reply** (about 130 characters), so it finishes typing at about 20 characters per second inside the 3 to 9 s window.
- **Day 10 has dashed placeholders.** I can't use a real phone photo I don't have, and the script says to show only real images. Add these files and re-render:
  - `inputs/day-10-before.jpg`
  - `inputs/day-10-after.png`
  - `inputs/day-10-tool.png`

## Re-render
```bash
node src/render.mjs           # all days
node src/render.mjs 10        # one day
node src/render.mjs --stills 8 0,3,9   # check frames as JPGs
```
This needs Node with Playwright (Chromium), ffmpeg and Python 3 with numpy.

Fonts are in `fonts/`, all under open licences (OFL / Apache).
