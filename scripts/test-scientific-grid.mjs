#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  scientificChladniModes,
  renderScientificChladniSvg,
  writeJson,
} from "./chladni-scientific-core.mjs";

const OUT = "output_scientific_test";
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (let i = 0; i < 12; i += 1) {
  const base = scientificChladniModes[i];

  const mode = {
    id: base.id,
    frequency: Math.round(20 + (i / 11) * 979),
    waveNumberK: base.k,
    n: base.n,
    m: base.m,
    family: base.family,
    patternName: `K${i + 1} ${base.family}`,
  };

  const svg = renderScientificChladniSvg({
    mode,
    seed: i + 1,
    width: 1024,
    height: 1024,
    showLabel: true,
    resolution: 480,
  });

  fs.writeFileSync(path.join(OUT, `${String(i + 1).padStart(2, "0")}.svg`), svg);
}

writeJson(path.join(OUT, "summary.json"), {
  total: 12,
  modes: scientificChladniModes.slice(0, 12),
});

console.log(`Scientific Chladni test generated: ${OUT}`);