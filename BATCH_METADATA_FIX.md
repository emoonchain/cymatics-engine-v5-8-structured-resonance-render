# v5.1 Batch Metadata Colorway Fix

This fixes the previous `Unknown` output from `npm run analyze:colorways`.

The batch generator now writes these top-level fields to every metadata file:

- `presetId`
- `presetName`
- `palette`
- `colorMutation`
- `rarityTier`

It also writes matching OpenSea attributes:

- `Preset`
- `Colorway`
- `Color Mutation`
- `Rarity Tier`

Run fresh generation after installing this version:

```bash
rm -rf output
npm run generate:100
npm run analyze:colorways
```

Do not analyze old metadata unless you regenerate it first.
