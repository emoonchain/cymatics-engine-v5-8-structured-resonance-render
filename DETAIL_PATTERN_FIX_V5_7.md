# v5.7 Detail Pattern Fix

Goal: keep cymatics patterns readable and detailed instead of turning into fast particle noise.

## Added

- `src/cymatics/frequencyModes.ts`

## Fixed

- UI frequency range: `80-1200 Hz`
- internal mode range:
  - `n: 2-8`
  - `m: 3-10`
- curated frequency table maps frequency bands to readable visual modes
- stronger particle settling
- lower micro-vibration
- thicker node threshold in batch renderer
- denser sand accumulation for final NFT images
- lower-frequency animation presets

## Why

Very high frequency values generated very high `n/m` modes. The node spacing became too tight, so the output looked like noise instead of a clear cymatics pattern.

This version separates display frequency from readable visual mode.
