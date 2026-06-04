# Cymatics Engine v5 Colorways Upgrade

Included:

- `src/cymatics/colorways.ts`
- rare color mutation system:
  - Chromatic Resonance: 1.75%
  - Aurora Field: 0.90%
  - Prism Bloom: 0.35%
- metadata traits:
  - Preset
  - Colorway
  - Color Mutation
- engine now tracks active preset id for metadata
- canvas now renders preset-specific palette stops
- v4.1 smaller frame fix preserved
- `npm run analyze:colorways` summarizes generated metadata color distribution

Run:

```bash
npm install
npm run dev
npm run generate:100
npm run analyze:colorways
```
