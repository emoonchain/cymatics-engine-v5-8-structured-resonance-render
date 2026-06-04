import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

function parseArgs() {
  const args = process.argv.slice(2);

  const options = {
    inputDir: "output/images",
    outputDir: "output/png",
    width: 1600,
    height: 1600,
    timeoutMs: 60000,
    limit: 0,
  };

  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    const next = args[i + 1];

    if (current === "--input" || current === "-i") {
      options.inputDir = next;
      i += 1;
    }

    if (current === "--output" || current === "-o") {
      options.outputDir = next;
      i += 1;
    }

    if (current === "--width" || current === "-w") {
      options.width = Number(next);
      i += 1;
    }

    if (current === "--height" || current === "-h") {
      options.height = Number(next);
      i += 1;
    }

    if (current === "--timeout") {
      options.timeoutMs = Number(next);
      i += 1;
    }

    if (current === "--limit") {
      options.limit = Number(next);
      i += 1;
    }
  }

  return options;
}

function sortFiles(files) {
  return files.sort((a, b) => {
    const numA = Number.parseInt(path.basename(a, ".svg"), 10);
    const numB = Number.parseInt(path.basename(b, ".svg"), 10);

    if (Number.isFinite(numA) && Number.isFinite(numB)) {
      return numA - numB;
    }

    return a.localeCompare(b);
  });
}

async function main() {
  const options = parseArgs();

  const inputDir = path.resolve(process.cwd(), options.inputDir);
  const outputDir = path.resolve(process.cwd(), options.outputDir);

  if (!fs.existsSync(inputDir)) {
    console.error(`Input folder not found: ${inputDir}`);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  let files = sortFiles(
    fs.readdirSync(inputDir).filter((file) => file.toLowerCase().endsWith(".svg"))
  );

  if (options.limit > 0) {
    files = files.slice(0, options.limit);
  }

  if (files.length === 0) {
    console.log(`No SVG found in ${inputDir}`);
    return;
  }

  console.log(`Converting ${files.length} SVG files...`);
  console.log(`Input : ${inputDir}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Size  : ${options.width}x${options.height}`);

  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage({
    viewport: {
      width: options.width,
      height: options.height,
    },
    deviceScaleFactor: 1,
  });

  page.setDefaultTimeout(options.timeoutMs);

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const inputPath = path.join(inputDir, file);
    const outputName = `${path.basename(file, ".svg")}.png`;
    const outputPath = path.join(outputDir, outputName);

    if (fs.existsSync(outputPath)) {
      console.log(`SKIP ${index + 1}/${files.length}: ${outputName}`);
      continue;
    }

    try {
      console.log(`START ${index + 1}/${files.length}: ${file}`);

      const fileUrl = pathToFileURL(inputPath).href;

      await page.goto(fileUrl, {
        waitUntil: "domcontentloaded",
        timeout: options.timeoutMs,
      });

      await page.waitForSelector("svg", {
        timeout: options.timeoutMs,
      });

      await page.evaluate(() => {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.documentElement.style.background = "#000";
        document.body.style.background = "#000";

        const svg = document.querySelector("svg");
        if (svg) {
          svg.style.width = "100vw";
          svg.style.height = "100vh";
          svg.style.display = "block";
        }
      });

      await page.screenshot({
        path: outputPath,
        fullPage: false,
        type: "png",
      });

      console.log(`DONE  ${index + 1}/${files.length}: ${outputName}`);
    } catch (error) {
      console.error(`FAIL  ${index + 1}/${files.length}: ${file}`);
      console.error(error instanceof Error ? error.message : error);
    }
  }

  await browser.close();

  console.log("Finished converting SVG to PNG.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});