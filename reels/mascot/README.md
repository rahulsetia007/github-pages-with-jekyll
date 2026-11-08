# Tech Blog Corner mascot

Original bearded tech-guy character in the green/black brand colors: glasses, black hoodie with
green drawstrings and a `</>` logo, green headphones around the neck, white sticker outline.

| File | Use |
|---|---|
| `TechGuy_Mascot_Demo.mp4` | 7s preview: waves, talks (lip-synced to voice), blinks, points |
| `TechGuy_Mascot_Talking_Transparent.webm` | Same animation with a transparent background, for overlaying in editors |
| `poses/TechGuy_idle.png` · `talk` · `wave` · `point` | Transparent PNG stills (800x900) |
| `source/character.html` | Vector source; `pose({mouth, blink, brow, tilt, lookX, pose:'wave'/'point'})` drives every frame |

Lip-sync is driven from the voiceover's loudness, so any new voiceover can be animated the same way (`source/demo.py`).
