#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

function parseArgs() {
  const args = process.argv.slice(2);

  const options = {
    inputDir: "reso/images",
    outputFile: "output_classic/classic-collection/chladni-preview.gif",
    tempDir: ".tmp-gif-frames",
    limit: 50,
    duration: 0.3,
    width: 1024,
    height: 1024,
    fit: "cover", // cover | contain
    fps: 12,
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
    } else if (arg === "--fit") {
      options.fit = next;
      i += 1;
    } else if (arg === "--fps") {
      options.fps = Number(next);
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
  });

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

  let files = sortImages(
    fs
      .readdirSync(inputDir)
      .filter((file) => supported.has(path.extname(file).toLowerCase()))
  );

  files = files.slice(0, options.limit);

  if (files.length === 0) {
    console.error(`No images found in: ${inputDir}`);
    process.exit(1);
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });

  console.log(`Preparing ${files.length} frames...`);
  console.log(`Input: ${inputDir}`);
  console.log(`Output: ${outputFile}`);
  console.log(`Duration per image: ${options.duration}s`);
  console.log(`Size: ${options.width}x${options.height}`);

  const framePaths = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const inputPath = path.join(inputDir, file);
    const frameName = `frame_${String(index + 1).padStart(5, "0")}.png`;
    const framePath = path.join(tempDir, frameName);

    await sharp(inputPath)
      .resize(options.width, options.height, {
        fit: options.fit,
        background: {
          r: 0,
          g: 0,
          b: 0,
          alpha: 1,
        },
      })
      .png({
        compressionLevel: 9,
      })
      .toFile(framePath);

    framePaths.push(framePath);

    console.log(`Frame ${index + 1}/${files.length}: ${file}`);
  }

  const concatFile = path.join(tempDir, "frames.txt");
  const paletteFile = path.join(tempDir, "palette.png");

  const concatLines = [];

  for (const framePath of framePaths) {
    concatLines.push(`file '${framePath.replaceAll("\\", "/")}'`);
    concatLines.push(`duration ${options.duration}`);
  }

  // FFmpeg concat demuxer needs the last file repeated.
  concatLines.push(`file '${framePaths[framePaths.length - 1].replaceAll("\\", "/")}'`);

  fs.writeFileSync(concatFile, concatLines.join("\n"));

  console.log("Generating GIF palette...");

  run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatFile,
    "-vf",
    `fps=${options.fps},scale=${options.width}:${options.height}:flags=lanczos,palettegen`,
    paletteFile,
  ]);

  console.log("Rendering GIF...");

  run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatFile,
    "-i",
    paletteFile,
    "-lavfi",
    `fps=${options.fps},scale=${options.width}:${options.height}:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`,
    "-loop",
    "0",
    outputFile,
  ]);

  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log("Done.");
  console.log(`GIF created: ${path.relative(process.cwd(), outputFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});