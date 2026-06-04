# v5.5 Batch Animation Renderer

Included:

- headless batch animation rendering with Playwright
- automatic MP4 encoding with ffmpeg
- optional GIF encoding
- animation manifest upgraded with `presetId`, `rarityTier`, and `frequency`
- metadata mass-update for `animation_url` continues to use `scripts/update-metadata-cid.mjs`

## Install

```bash
npm install
npx playwright install chromium
```

Also install ffmpeg in your OS.

## Workflow

```bash
npm run generate:100
npm run animation:manifest
npm run animation:render:batch -- --limit 5
npm run metadata:update-cid -- --animation-cid <CID> --animation-ext mp4
```
