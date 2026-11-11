# @tech_blogcorner Reel renderer

Renders the daily faceless Reels (1080x1920, 30 fps, H.264 + AAC) in the house look.

- `base.css`, `engine.js`: brand look and timeline helpers shared by every day.
- `days/day-XX.html`: one animated scene per day. Defines `DURATION`, `CUES` (sound cues) and `render(t)`.
- `content/`: the example ChatGPT output used on screen, and the ready-to-paste caption.
- `sfx/`: the house sound kit, rebuilt with `./make-sfx.sh`. Same sounds in every video.
- Build: `node reels/render.js day-06` writes `exports/day-06.mp4`.

The voice track is left empty; add your voiceover in your editor.
