#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const out = {
    input: "",
    mp4: "",
    gif: "",
    fps: "15",
    width: "900",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--input") out.input = next, i++;
    else if (arg === "--mp4") out.mp4 = next, i++;
    else if (arg === "--gif") out.gif = next, i++;
    else if (arg === "--fps") out.fps = next, i++;
    else if (arg === "--width") out.width = next, i++;
    else if (arg === "--help" || arg === "-h") help(0);
    else {
      console.error(`Unknown argument: ${arg}`);
      help(1);
    }
  }

  if (!out.input) {
    console.error("Missing --input <file.webm>");
    help(1);
  }

  if (!out.mp4 && !out.gif) {
    console.error("Provide at least --mp4 <file.mp4> or --gif <file.gif>");
    help(1);
  }

  return out;
}

function help(code = 0) {
  console.log(`
Convert a recorded preview animation from .webm into .mp4 and/or .gif using ffmpeg.

Examples:
  npm run animation:encode -- --input preview.webm --mp4 preview.mp4
  npm run animation:encode -- --input preview.webm --gif preview.gif
  npm run animation:encode -- --input preview.webm --mp4 preview.mp4 --gif preview.gif

Options:
  --input <file.webm>   Input file from browser export
  --mp4 <file.mp4>      Output mp4 path
  --gif <file.gif>      Output gif path
  --fps <number>        GIF fps. Default: 15
  --width <number>      GIF width. Default: 900
`);
  process.exit(code);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const args = parseArgs(process.argv.slice(2));
const ffmpegCheck = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });

if (ffmpegCheck.status !== 0) {
  console.error("ffmpeg not found in PATH. Install ffmpeg first, then run this command again.");
  process.exit(1);
}

const input = path.resolve(process.cwd(), args.input);
if (!fs.existsSync(input)) {
  console.error(`Input file not found: ${input}`);
  process.exit(1);
}

if (args.mp4) {
  const outputMp4 = path.resolve(process.cwd(), args.mp4);
  run("ffmpeg", ["-y", "-i", input, "-c:v", "libx264", "-pix_fmt", "yuv420p", outputMp4]);
  console.log(`Saved MP4: ${outputMp4}`);
}

if (args.gif) {
  const outputGif = path.resolve(process.cwd(), args.gif);
  const palette = path.join(path.dirname(outputGif), ".palette-temp.png");

  run("ffmpeg", [
    "-y",
    "-i",
    input,
    "-vf",
    `fps=${args.fps},scale=${args.width}:-1:flags=lanczos,palettegen`,
    palette,
  ]);

  run("ffmpeg", [
    "-y",
    "-i",
    input,
    "-i",
    palette,
    "-lavfi",
    `fps=${args.fps},scale=${args.width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
    outputGif,
  ]);

  if (fs.existsSync(palette)) fs.unlinkSync(palette);
  console.log(`Saved GIF: ${outputGif}`);
}
