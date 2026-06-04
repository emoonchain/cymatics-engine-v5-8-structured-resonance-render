# v5.6 Classic Chladni Plate Mode

This upgrade adds a classic scientific cymatics renderer beside the more generative NFT renderer.

## Added files

- `src/cymatics/classicModes.ts`
- `scripts/classic-core.mjs`
- `scripts/generate-classic-gallery.mjs`
- `scripts/generate-classic-collection.mjs`

## Commands

```bash
npm run generate:classic
npm run generate:classic-collection -- --count 100
```

## Outputs

### Classic gallery

- `output/classic/images/*.svg`
- `output/classic/metadata/*.json`
- `output/classic/gallery.svg`

### Classic collection

- `output/classic-collection/images/*.svg`
- `output/classic-collection/metadata/*.json`
- `output/classic-collection/summary.json`
