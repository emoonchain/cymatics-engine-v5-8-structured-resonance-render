import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

function parseArgs() {
  const args = process.argv.slice(2);

  const options = {
    inputDir: "output_scientific_collection_v2/chladni-nodes/images",
    outputDir: "output/png",
    width: 1600,
    height: 1600,
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
  }

  return options;
}

async function convertSvgToPng() {
  const options = parseArgs();

  const inputDir = path.resolve(process.cwd(), options.inputDir);
  const outputDir = path.resolve(process.cwd(), options.outputDir);

  if (!fs.existsSync(inputDir)) {
    console.error(`Input folder not found: ${inputDir}`);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs
    .readdirSync(inputDir)
    .filter((file) => file.toLowerCase().endsWith(".svg"))
    .sort((a, b) => {
      const numA = Number.parseInt(path.basename(a, ".svg"), 10);
      const numB = Number.parseInt(path.basename(b, ".svg"), 10);

      if (Number.isFinite(numA) && Number.isFinite(numB)) {
        return numA - numB;
      }

      return a.localeCompare(b);
    });

  if (files.length === 0) {
    console.log(`No SVG files found in: ${inputDir}`);
    return;
  }

  console.log(`Converting ${files.length} SVG files to PNG...`);
  console.log(`Input : ${inputDir}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Size  : ${options.width}x${options.height}`);

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputName = `${path.basename(file, ".svg")}.png`;
    const outputPath = path.join(outputDir, outputName);

    try {
      await sharp(inputPath, {
        density: 300,
        limitInputPixels: false,
      })
        .resize(options.width, options.height, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        })
        .png({
          quality: 100,
          compressionLevel: 9,
        })
        .toFile(outputPath);

      console.log(`✅ ${file} -> ${outputName}`);
    } catch (error) {
      console.error(`❌ Failed: ${file}`);
      console.error(error);
    }
  }

  console.log("Done.");
}

convertSvgToPng();