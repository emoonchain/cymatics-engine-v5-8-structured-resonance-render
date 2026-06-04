# Cymatics Engine v4.1 Frame Fix

This version reduces the visual plate/frame size from the large v4 layout.

Changed in `src/components/CymaticsCanvas.tsx`:

```ts
const PLATE_SIZE = 4.45;
const PARTICLE_RENDER_SCALE = 2.0;
const CAMERA_EXTRA_DISTANCE = 0.55;
```

Changed in `src/style.css`:

- stage frame inset increased
- outer frame opacity reduced
- stage padding added
