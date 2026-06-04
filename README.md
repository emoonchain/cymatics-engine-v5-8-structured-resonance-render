# Cymatics Engine

Production-oriented starter core for a Chladni / cymatics generative NFT engine.

## What it does

- Simulates a square vibrating plate in normalized coordinates `[-1, 1]`.
- Uses Chladni nodal lines: `f(x,y)=cos(nx)cos(my)-cos(mx)cos(ny)`.
- Adds modal standing wave approximation from the 2D wave equation.
- Moves deterministic particles toward nodal lines where `abs(f) ≈ 0`.
- Generates NFT-style metadata from seed, frequency, modes, density, symmetry, and complexity.
- Renders in React Three Fiber with instanced particles.

## Run

```bash
npm install
npm run dev
```

Then open the local Vite URL.

## Build

```bash
npm run build
```

## Important files

```txt
src/cymatics/CymaticsEngine.ts     Core simulation class
src/cymatics/math.ts               Field equations and seeded RNG
src/cymatics/metadata.ts           NFT metadata generation
src/cymatics/traits.ts             Trait and rarity mapping
src/components/CymaticsCanvas.tsx  React Three Fiber renderer
src/components/CymaticsControls.tsx UI controls and metadata panel
```

## Engine API

```ts
const engine = new CymaticsEngine(seed, particleCount);
engine.setFrequency(5284);
engine.update(delta);
const positions = engine.getParticlePositions();
const energy = engine.getEnergyField();
const nodes = engine.getNodeMap();
const metadata = engine.getMetadata();
```

## Next upgrades

1. Move particle update to GPU compute or transform feedback.
2. Add image export for NFT reveal snapshots.
3. Add animated MP4/WebM loop export.
4. Add contract metadata seed format.
5. Add IPFS upload pipeline.
6. Add rarity distribution lock before mint.

## NFT concept

Every token should store a deterministic seed and frequency. The renderer reconstructs the same resonance pattern forever from those values.

## Batch Collection Generator

Generate deterministic Cymatics artwork images and NFT metadata:

```bash
npm run generate:100
```

Custom collection size:

```bash
npm run generate:collection -- --count 3333 --seed cymatica-mainnet --image-base ipfs://IMAGE_CID
```

Output:

```txt
output/images/1.svg
output/images/2.svg
output/metadata/1.json
output/metadata/2.json
output/collection-summary.json
```

Notes:

- The batch generator uses a deterministic SVG node-map renderer.
- Same `--seed` and token ID always produce the same artwork and metadata.
- Replace `ipfs://IMAGE_CID` after uploading the `/output/images` folder to IPFS.
- For production, generate a small test set first and inspect rarity distribution in `collection-summary.json`.

## Updating metadata after Filebase upload

After generating the collection, upload `output/images` to Filebase first. Copy the folder CID, then update every metadata file automatically:

```bash
npm run metadata:update-cid -- --image-cid <IMAGE_FOLDER_CID> --image-ext svg
```

For PNG images:

```bash
npm run metadata:update-cid -- --image-cid <IMAGE_FOLDER_CID> --image-ext png
```

Preview without editing files:

```bash
npm run metadata:update-cid -- --image-cid <IMAGE_FOLDER_CID> --image-ext svg --dry-run
```

Then upload the updated `output/metadata` folder to Filebase. The metadata folder CID becomes your NFT contract base URI:

```txt
ipfs://<METADATA_FOLDER_CID>/
```

If your files are inside a subfolder on IPFS, use `--image-base` instead:

```bash
npm run metadata:update-cid -- --image-base ipfs://<CID>/images --image-ext png
```

## Animated NFT Loop (v5.4)

This version adds optional animated NFT loop support.

### Frontend preview

Run the app:

```bash
npm install
npm run dev
```

In the right panel you can now:

- enable `Animated NFT Loop`
- choose animation presets such as `Cinematic Fall`
- set `Start Hz`, `End Hz`, `Duration`, `Easing`, `Loop Type`
- toggle `Camera Breathing`, `Palette Shift`, and `Particle Pulse`
- record the preview loop as `.webm`

### Browser export flow

1. Enable animation.
2. Press `Play Loop`.
3. Press `Record WebM Loop`.

This saves a file like:

```txt
cymatica-<seed>-cinematic-fall.webm
```

### Convert to MP4 / GIF

If `ffmpeg` is installed:

```bash
npm run animation:encode -- --input preview.webm --mp4 preview.mp4
npm run animation:encode -- --input preview.webm --gif preview.gif
```

### Animation manifest for a generated collection

After batch generation, create a manifest of suggested animation loops:

```bash
npm run animation:manifest
```

Output:

```txt
output/animation-manifest.json
```

This file maps each token to an optional animation config and is useful for planning which NFTs should receive animated exports.

## Batch Animated NFT Renderer (v5.5)

This version adds a headless batch animation pipeline.

### Install notes

The project now includes `playwright` as a dev dependency. After `npm install`, run:

```bash
npx playwright install chromium
```

You also need `ffmpeg` available in your system PATH.

### 1) Generate collection metadata

```bash
npm run generate:100
```

### 2) Build an animation manifest

```bash
npm run animation:manifest
```

This creates:

```txt
output/animation-manifest.json
```

### 3) Render MP4 loops in batch

```bash
npm run animation:render:batch
```

Render only a few items first:

```bash
npm run animation:render:batch -- --limit 5
```

Render selected token IDs:

```bash
npm run animation:render:batch -- --token-ids 1,8,21
```

Render MP4 and GIF:

```bash
npm run animation:render:batch -- --limit 3 --gif
```

Outputs:

```txt
output/animations/mp4/1.mp4
output/animations/mp4/2.mp4
output/animations/gif/1.gif
```

### 4) Update metadata animation URLs

After uploading the animation folder to Filebase/IPFS:

```bash
npm run metadata:update-cid -- --animation-cid <ANIMATION_FOLDER_CID> --animation-ext mp4
```

If you already uploaded images too:

```bash
npm run metadata:update-cid -- --image-cid <IMAGE_FOLDER_CID> --image-ext svg --animation-cid <ANIMATION_FOLDER_CID> --animation-ext mp4
```

## Classic Chladni Plate Mode (v5.6)

This version adds a second visual branch focused on the classic scientific cymatics look.

### Included

- `src/cymatics/classicModes.ts`
- `scripts/classic-core.mjs`
- `scripts/generate-classic-gallery.mjs`
- `scripts/generate-classic-collection.mjs`

### Goals

- black plate background
- warm white / cream sand lines
- thicker nodal lines
- cleaner symmetry
- curated classic frequency table
- low distortion

### Generate the classic study gallery

```bash
npm run generate:classic
```

Output:

```txt
output/classic/images/345.svg
output/classic/images/1033.svg
output/classic/images/1820.svg
output/classic/gallery.svg
```

### Generate a classic NFT collection

```bash
npm run generate:classic-collection -- --count 100
```

Output:

```txt
output/classic-collection/images/1.svg
output/classic-collection/metadata/1.json
output/classic-collection/summary.json
```


## Detail Pattern Fix v5.7

Frequency is now detail-safe: `80-1200 Hz`, with readable internal modes `n=2-8` and `m=3-10`. This keeps patterns clear and detailed instead of becoming high-frequency particle noise.

Run:

```bash
rm -rf output
npm run generate:100
npm run analyze:colorways
```

## Structured Resonance Render (v5.8)

This upgrade pushes the NFT image renderer closer to bold readable cymatics snapshots while keeping the core engine style.

### What changed

- structured layered render:
  - **dust layer**
  - **band layer**
  - **hotspot layer**
- 10 unique gradient colorways with richer stops
- stronger glow separation between dust, bands, and hotspots
- preset frequencies corrected to readable ranges
- front-end color sampling now uses more of the gradient span

### Color direction

Ten core gradient families are available:

- Solaris Bloom
- Aurora Forge
- Prism Tide
- Ember Orchid
- Neon Glacier
- Emerald Voltage
- Crimson Halo
- Ocean Signal
- Violet Flux
- Gold Lotus
