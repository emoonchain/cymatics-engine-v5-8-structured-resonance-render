# v5.4 Animated NFT Loop

Included in this package:

- `src/cymatics/animationPresets.ts`
- live animated preview in the frontend
- frequency morph loop settings:
  - start frequency
  - end frequency
  - duration
  - fps
  - easing
  - loop type
- preview toggles:
  - camera breathing
  - palette shift
  - particle pulse
- browser recording to `.webm`
- ffmpeg conversion helper script:
  - `.webm` -> `.mp4`
  - `.webm` -> `.gif`
- animation manifest generator for batch collections

## Quick start

```bash
npm install
npm run dev
```

## Record a preview loop

1. Enable animation
2. Choose a preset, for example `Cinematic Fall`
3. Press `Play Loop`
4. Press `Record WebM Loop`

## Convert after recording

```bash
npm run animation:encode -- --input preview.webm --mp4 preview.mp4
npm run animation:encode -- --input preview.webm --gif preview.gif
```

## Generate collection animation plan

```bash
npm run generate:100
npm run animation:manifest
```
