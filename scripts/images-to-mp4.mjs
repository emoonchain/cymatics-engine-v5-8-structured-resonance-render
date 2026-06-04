#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

function parseArgs() {
  const args = process.argv.slice(2);

  const options = {
    inputDir: "output_classic_collection/classic-collection/png",
    outputFile: "output_classic/classic-collection/chladni-teaser.mp4",
    tempDir: ".tmp-mp4-frames",
    limit: 50,
    duration: 0.25,
    width: 1080,
    height: 1080,
    fps: 24,
    fit: "cover",
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === "--input" || arg === "-i") {
      options.inputDir = next;
      i += 1;
    } else if (arg === "--output" || arg === "-o") {
      options.outputFile = next;
      i += 1;
    } else if (arg === "--limit") {
      options.limit = Number(next);
      i += 1;
    } else if (arg === "--duration") {
      options.duration = Number(next);
      i += 1;
    } else if (arg === "--width") {
      options.width = Number(next);
      i += 1;
    } else if (arg === "--height") {
      options.height = Number(next);
      i += 1;
    } else if (arg === "--fps") {
      options.fps = Number(next);
      i += 1;
    } else if (arg === "--fit") {
      options.fit = next;
      i += 1;
    }
  }

  return options;
}

function sortImages(files) {
  return files.sort((a, b) => {
    const aNum = Number.parseInt(path.basename(a, path.extname(a)), 10);
    const bNum = Number.parseInt(path.basename(b, path.extname(b)), 10);

    if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
      return aNum - bNum;
    }

    return a.localeCompare(b);
  });
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    throw new Error(`${command} failed: ${result.error.message}`);
  }

  if (result.signal) {
    throw new Error(`${command} killed by signal ${result.signal}`);
  }

  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}`);
  }
}

async function main() {
  const options = parseArgs();

  const inputDir = path.resolve(process.cwd(), options.inputDir);
  const outputFile = path.resolve(process.cwd(), options.outputFile);
  const tempDir = path.resolve(process.cwd(), options.tempDir);

  if (!fs.existsSync(inputDir)) {
    console.error(`Input folder not found: ${inputDir}`);
    process.exit(1);
  }

  const supported = new Set([".png", ".jpg", ".jpeg", ".webp"]);

  const files = sortImages(
    fs.readdirSync(inputDir).filter((file) => supported.has(path.extname(file).toLowerCase()))
  ).slice(0, options.limit);

  if (files.length === 0) {
    console.error(`No images found in: ${inputDir}`);
    process.exit(1);
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });

  console.log(`Preparing ${files.length} MP4 frames...`);

  const repeatCount = Math.max(1, Math.round(options.duration * options.fps));
  let frameIndex = 1;

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const inputPath = path.join(inputDir, file);

    const buffer = await sharp(inputPath)
      .resize(options.width, options.height, {
        fit: options.fit,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    for (let repeat = 0; repeat < repeatCount; repeat += 1) {
      const framePath = path.join(tempDir, `frame_${String(frameIndex).padStart(6, "0")}.png`);
      fs.writeFileSync(framePath, buffer);
      frameIndex += 1;
    }

    console.log(`Frame source ${index + 1}/${files.length}: ${file}`);
  }

  console.log("Rendering MP4...");

  run("ffmpeg", [
    "-y",
    "-framerate",
    String(options.fps),
    "-i",
    path.join(tempDir, "frame_%06d.png"),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-crf",
    "20",
    "-preset",
    "medium",
    outputFile,
  ]);

  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log("Done.");
  console.log(`MP4 created: ${path.relative(process.cwd(), outputFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});