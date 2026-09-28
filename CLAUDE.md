# Dande — 2D motion video studio

## Where things are
- `nvda-reel/` — finished reels (HTML canvas renders), voiceovers, music, scripts.
- `mc-studio/` — Motion Canvas project (preferred for new videos). Skill: `.claude/skills/motion-canvas/`.
- Render: `cd mc-studio && npm install && ./render.sh out.mp4 [voice.wav]` (headless: vite + Playwright clicks RENDER, ffmpeg via `pip install imageio-ffmpeg`).
- Default format: vertical 1080x1920, 30 fps (set in `mc-studio/src/project.meta`).

## Visual style (user's reference: flat vector like The Infographics Show)
- Maps: **top-down** view (Natural Earth coastlines from raw.githubusercontent.com/nvkelso/natural-earth-vector).
- Story scenes after zooming in: **side view**, not top-down.
- Layered pastel hills (far = lighter/mint, near = olive/yellow-green), NO clouds, dark foreground bushes/big leaves for depth (no foreground grass).
- Characters waist-up and close to camera (lower body hidden by bushes/ground), IK arms holding props, rifle slung on back, no beards. Reference scene: mc-studio/src/scenes/holdouts2.tsx.
- Flat characters: no outlines on bodies, simple face (dot eyes, small mouth), expressive poses, warm muted palette.
- No subtitles burned in unless asked; deliver separate .srt for YouTube.
- Always also export a no-voice version.

## Charts
- Charts and counters must be smooth: interpolate with smooth curves (no random noise), ease every tween, camera follows with soft easing (no jumps).

## Timing
- Generate VO first (Kokoro EN voice `am_liam` (user's pick), model files from github.com/thewh1teagle/kokoro-onnx releases), record per-sentence start/end, and key every action to the exact phrase that mentions it.

## Content rules
- User wants hooks, calm narration for history, tense music for finance reels.
- Flag approximate data (prices, borders) honestly in the reply.
