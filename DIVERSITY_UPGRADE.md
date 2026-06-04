# v5.2 Diversity Upgrade

This version fixes repetitive colors and repetitive frequency patterns.

## Color diversity

Each preset now has 6 normal color variants, plus rare mutations:

- Chromatic Resonance
- Aurora Field
- Prism Bloom

New metadata traits:

- Colorway
- Color Variant
- Color Mutation

## Pattern diversity

The batch generator now varies:

- primary mode N/M
- secondary mode N/M
- pattern family
- rotation
- stretch/warp
- radial layer
- diagonal layer
- harmonic interference layer
- threshold density

New metadata traits:

- Pattern Family
- Secondary Mode

## Run fresh

```bash
rm -rf output
npm run generate:100
npm run analyze:colorways
```

For rare rainbow modes, test with:

```bash
npm run generate:1000
npm run analyze:colorways
```
