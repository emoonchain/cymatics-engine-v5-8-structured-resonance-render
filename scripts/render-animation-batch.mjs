#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import http from "node:http";
import https from "node:https";
import { chromium } from "playwright";

function readArgs(argv) {
  const args = {
    manifest: "output/animation-manifest.json",
    outputDir: "output/animations",
    width: 1024,
    height: 1024,
    keepFrames: false,
    gif: false,
    limit: 0,
    tokenIds: [],
    baseUrl: "",
    port: 4173,
    fpsOverride: 0,
    startServer: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--manifest") args.manifest = next, i++;
    else if (arg === "--output-dir") args.outputDir = next, i++;
    else if (arg === "--width") args.width = Number(next), i++;
    else if (arg === "--height") args.height = Number(next), i++;
    else if (arg === "--limit") args.limit = Number(next), i++;
    else if (arg === "--token-ids") args.tokenIds = String(next).split(",").map((item) => Number(item.trim())).filter(Number.isFinite), i++;
    else if (arg === "--base-url") args.baseUrl = String(next), args.startServer = false, i++;
    else if (arg === "--port") args.port = Number(next), i++;
    else if (arg === "--fps") args.fpsOverride = Number(next), i++;
    else if (arg === "--gif") args.gif = true;
    else if (arg === "--keep-frames") args.keepFrames = true;
    else if (arg === "--no-server") args.startServer = false;
    else if (arg === "--help" || arg === "-h") printHelpAndExit(0);
    else {
      console.error(`Unknown argument: ${arg}`);
      printHelpAndExit(1);
    }
  }

  return args;
}

function printHelpAndExit(code = 0) {
  console.log(`
Render animated NFT loops from output/animation-manifest.json.

Examples:
  npm run animation:render:batch
  npm run animation:render:batch -- --limit 5
  npm run animation:render:batch -- --token-ids 1,2,3 --gif
  npm run animation:render:batch -- --base-url http://127.0.0.1:5173

Options:
  --manifest <path>        Animation manifest path. Default: output/animation-manifest.json
  --output-dir <path>      Output directory. Default: output/animations
  --width <px>             Frame width. Default: 1024
  --height <px>            Frame height. Default: 1024
  --limit <n>              Render first n enabled items only
  --token-ids <list>       Render only selected token ids, comma separated
  --gif                    Also encode a GIF per token
  --keep-frames            Keep PNG frames after encoding
  --base-url <url>         Use existing dev server instead of starting one
  --port <n>               Port for auto-started Vite server. Default: 4173
                           Codespaces note: auto server binds to 0.0.0.0 for forwarded URL compatibility
  --fps <n>                Override manifest fps
`);
  process.exit(code);
}

function ensureFfmpeg() {
  const result = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (result.status !== 0) {
    console.error("ffmpeg not found in PATH. Install ffmpeg first.");
    process.exit(1);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pingUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
  });
}

async function waitForServer(url, timeoutMs = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await pingUrl(url)) return true;
    await wait(750);
  }
  return false;
}

function buildQuery(item, width, height, fpsOverride) {
  const params = new URLSearchParams();
  params.set("seed", String(item.seed));
  params.set("seedText", String(item.name ?? `Cymatica-${item.tokenId}`));
  params.set("preset", String(item.presetId));
  params.set("frequency", String(item.frequency));
  params.set("animationEnabled", item.animation.enabled ? "1" : "0");
  params.set("animationPreset", String(item.animation.presetId));
  params.set("animationPlaying", "1");
  params.set("fromFrequency", String(item.animation.fromFrequency));
  params.set("toFrequency", String(item.animation.toFrequency));
  params.set("durationSec", String(item.animation.durationSec));
  params.set("fps", String(fpsOverride || item.animation.fps));
  params.set("easing", String(item.animation.easing));
  params.set("loopType", String(item.animation.loopType));
  params.set("cameraBreathing", item.animation.cameraBreathing ? "1" : "0");
  params.set("paletteShift", item.animation.paletteShift ? "1" : "0");
  params.set("particlePulse", item.animation.particlePulse ? "1" : "0");
  params.set("exportFormat", "mp4");
  params.set("renderWidth", String(width));
  params.set("renderHeight", String(height));
  return params.toString();
}

async function main() {
  const args = readArgs(process.argv.slice(2));
  ensureFfmpeg();

  const manifestPath = path.resolve(process.cwd(), args.manifest);
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  let items = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  items = items.filter((item) => item.animation?.enabled);
  if (args.tokenIds.length > 0) items = items.filter((item) => args.tokenIds.includes(item.tokenId));
  if (args.limit > 0) items = items.slice(0, args.limit);

  if (items.length === 0) {
    console.error("No enabled animation items to render.");
    process.exit(1);
  }

  const outputDir = path.resolve(process.cwd(), args.outputDir);
  const framesRoot = path.join(outputDir, "frames");
  const mp4Root = path.join(outputDir, "mp4");
  const gifRoot = path.join(outputDir, "gif");
  fs.mkdirSync(framesRoot, { recursive: true });
  fs.mkdirSync(mp4Root, { recursive: true });
  if (args.gif) fs.mkdirSync(gifRoot, { recursive: true });

  let serverProcess = null;
  let baseUrl = args.baseUrl;

  if (args.startServer) {
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    serverProcess = spawn(npmCmd, ["run", "dev", "--", "--host", "0.0.0.0", "--port", String(args.port)], {
      cwd: process.cwd(),
      stdio: "inherit",
    });
    baseUrl = `http://127.0.0.1:${args.port}`;
    const ok = await waitForServer(baseUrl);
    if (!ok) {
      console.error(`Dev server did not become ready at ${baseUrl}`);
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
  }

  const browser = await chromium.launch({ headless: true });

  try {
    for (const item of items) {
      const fps = args.fpsOverride || item.animation.fps;
      const durationSec = Number(item.animation.durationSec);
      const totalFrames = Math.max(1, Math.round(durationSec * fps));
      const tokenFramesDir = path.join(framesRoot, String(item.tokenId));
      fs.mkdirSync(tokenFramesDir, { recursive: true });

      const page = await browser.newPage({ viewport: { width: args.width, height: args.height } });
      page.setDefaultTimeout(120_000);
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) console.log(`[browser:${message.type()}] ${message.text()}`);
      });
      page.on("pageerror", (error) => console.log(`[browser:pageerror] ${error.message}`));
      const url = `${baseUrl}/?${buildQuery(item, args.width, args.height, args.fpsOverride)}`;
      console.log(`
Rendering token #${item.tokenId} -> ${url}`);
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean((globalThis).__CYMATICS_RENDER_READY__));
      await page.waitForTimeout(1200);

      const canvas = page.locator("canvas");
      for (let index = 0; index < totalFrames; index += 1) {
        const playhead = index / fps;
        await page.evaluate((sec) => {
          (globalThis).__CYMATICS_EXPORT_PLAYHEAD__ = sec;
        }, playhead);
        await page.waitForTimeout(35);
        const framePath = path.join(tokenFramesDir, `frame_${String(index).padStart(4, "0")}.png`);
        await canvas.screenshot({ path: framePath });
      }

      await page.close();

      const mp4Path = path.join(mp4Root, `${item.tokenId}.mp4`);
      run("ffmpeg", [
        "-y",
        "-framerate", String(fps),
        "-i", path.join(tokenFramesDir, "frame_%04d.png"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        mp4Path,
      ]);
      console.log(`Saved MP4: ${mp4Path}`);

      if (args.gif) {
        const gifPath = path.join(gifRoot, `${item.tokenId}.gif`);
        const palettePath = path.join(tokenFramesDir, "palette.png");
        run("ffmpeg", [
          "-y",
          "-framerate", String(fps),
          "-i", path.join(tokenFramesDir, "frame_%04d.png"),
          "-vf", `fps=${Math.min(15, fps)},scale=900:-1:flags=lanczos,palettegen`,
          palettePath,
        ]);
        run("ffmpeg", [
          "-y",
          "-framerate", String(fps),
          "-i", path.join(tokenFramesDir, "frame_%04d.png"),
          "-i", palettePath,
          "-lavfi", `fps=${Math.min(15, fps)},scale=900:-1:flags=lanczos[x];[x][1:v]paletteuse`,
          gifPath,
        ]);
        if (fs.existsSync(palettePath)) fs.unlinkSync(palettePath);
        console.log(`Saved GIF: ${gifPath}`);
      }

      if (!args.keepFrames) {
        fs.rmSync(tokenFramesDir, { recursive: true, force: true });
      }
    }
  } finally {
    await browser.close();
    if (serverProcess) serverProcess.kill();
  }

  console.log("Batch animation render complete.");
  console.log(`MP4 output: ${mp4Root}`);
  if (args.gif) console.log(`GIF output: ${gifRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
