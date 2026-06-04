# v5.3 Advanced Traits Upgrade

Added new collection traits:

- Wave Distortion
- Symmetry Type
- Node Architecture
- Harmonic Layer Count

These now appear in:
- live metadata preview (`src/cymatics/metadata.ts`)
- batch-generated metadata (`scripts/generate-collection.mjs`)
- analyzer summary (`scripts/analyze-colorways.mjs`)

## New analyzer output sections

- `waveDistortions`
- `symmetryTypes`
- `nodeArchitectures`
- `harmonicLayerCounts`

## Run

```bash
rm -rf output
npm run generate:100
npm run analyze:colorways
```
