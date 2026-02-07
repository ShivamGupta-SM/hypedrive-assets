import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LOGOS_DIR = join(ROOT, "logos");

// Source SVGs
const logoIconSvg = readFileSync(join(LOGOS_DIR, "logo-icon.svg"), "utf8");
const logoFullSvg = readFileSync(join(LOGOS_DIR, "logo-full.svg"), "utf8");

// Updated source SVGs from encore (use as canonical if available)
const ENCORE_PUBLIC = "C:/Projects/hypedrive-encore/public";
let encoreIconSvg, encoreFullSvg;
try {
  encoreIconSvg = readFileSync(join(ENCORE_PUBLIC, "logo-icon.svg"), "utf8");
  encoreFullSvg = readFileSync(join(ENCORE_PUBLIC, "logo-full.svg"), "utf8");
  console.log("Using updated SVGs from hypedrive-encore/public");
} catch {
  encoreIconSvg = logoIconSvg;
  encoreFullSvg = logoFullSvg;
  console.log("Using SVGs from hypedrive-assets/logos");
}

function renderSvgToPng(svgString, width, height, opts = {}) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: "width", value: width },
    background: opts.background || undefined,
    font: { loadSystemFonts: false },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

/**
 * Create an SVG that centers the icon inside a square canvas with padding.
 * Used for app icons that need the logo centered on a background.
 */
function createCenteredIconSvg(iconSvg, canvasSize, iconSize, bgColor) {
  // Extract viewBox from icon SVG
  const viewBoxMatch = iconSvg.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 112 116";
  const [, , vbW, vbH] = viewBox.split(" ").map(Number);

  // Calculate scale to fit icon within iconSize while maintaining aspect ratio
  const scale = Math.min(iconSize / vbW, iconSize / vbH);
  const scaledW = vbW * scale;
  const scaledH = vbH * scale;
  const offsetX = (canvasSize - scaledW) / 2;
  const offsetY = (canvasSize - scaledH) / 2;

  // Extract paths from the icon SVG
  const pathMatches = iconSvg.match(/<path[^>]*\/>/g) || [];
  const paths = pathMatches.join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}">
  ${bgColor ? `<rect width="${canvasSize}" height="${canvasSize}" fill="${bgColor}" rx="0"/>` : ""}
  <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
    ${paths}
  </g>
</svg>`;
}

/**
 * Create splash SVG with icon centered
 */
function createSplashIconSvg(iconSvg, canvasSize, iconSize) {
  return createCenteredIconSvg(iconSvg, canvasSize, iconSize, null);
}

// --- Generate assets for hypedrive-assets/logos ---

console.log("\n--- Generating hypedrive-assets/logos PNGs ---");

// logo-icon.png (512x512, transparent bg)
const iconPng = renderSvgToPng(encoreIconSvg, 512, 512);
writeFileSync(join(LOGOS_DIR, "logo-icon.png"), iconPng);
console.log("  logo-icon.png (512x512)");

// logo-full.png (2048xAuto, transparent bg)
const fullPng = renderSvgToPng(encoreFullSvg, 2048, 0);
writeFileSync(join(LOGOS_DIR, "logo-full.png"), fullPng);
console.log("  logo-full.png (2048w)");

// Also update the SVGs in assets repo from the latest encore versions
writeFileSync(join(LOGOS_DIR, "logo-icon.svg"), encoreIconSvg);
writeFileSync(join(LOGOS_DIR, "logo-full.svg"), encoreFullSvg);
console.log("  Updated SVGs from encore source");

// --- Generate Expo native app assets ---

const NATIVE_ASSETS = "C:/Projects/hypedrive-shopper-native/assets";
mkdirSync(NATIVE_ASSETS, { recursive: true });

console.log("\n--- Generating Expo native app assets ---");

// icon.png (1024x1024) — centered icon on white bg
const iconSvgCentered = createCenteredIconSvg(encoreIconSvg, 1024, 640, "#FFFFFF");
const appIconPng = renderSvgToPng(iconSvgCentered, 1024, 1024);
writeFileSync(join(NATIVE_ASSETS, "icon.png"), appIconPng);
console.log("  icon.png (1024x1024, white bg)");

// adaptive-icon.png (1024x1024) — centered icon on transparent bg (Android adaptive)
// Adaptive icons need ~66% safe zone, so icon is smaller
const adaptiveSvg = createCenteredIconSvg(encoreIconSvg, 1024, 500, null);
const adaptivePng = renderSvgToPng(adaptiveSvg, 1024, 1024);
writeFileSync(join(NATIVE_ASSETS, "adaptive-icon.png"), adaptivePng);
console.log("  adaptive-icon.png (1024x1024, transparent)");

// splash-icon.png (288x288) — small icon for splash screen
const splashSvg = createSplashIconSvg(encoreIconSvg, 288, 200);
const splashPng = renderSvgToPng(splashSvg, 288, 288);
writeFileSync(join(NATIVE_ASSETS, "splash-icon.png"), splashPng);
console.log("  splash-icon.png (288x288)");

// favicon.png (48x48) — web favicon
const faviconSvg = createCenteredIconSvg(encoreIconSvg, 48, 36, null);
const faviconPng = renderSvgToPng(faviconSvg, 48, 48);
writeFileSync(join(NATIVE_ASSETS, "favicon.png"), faviconPng);
console.log("  favicon.png (48x48)");

console.log("\nAll assets generated successfully!");
