const fs = require("fs");
const path = require("path");

// Create the build directory structure
const buildDir = "extension-build";
const outDir = "out";

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copy manifest.json
fs.copyFileSync("manifest.json", path.join(buildDir, "manifest.json"));

// Create popup.html for the extension
const popupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF to Image Converter</title>
    <style>
        body {
            width: 400px;
            height: 600px;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
    </style>
</head>
<body>
    <div id="__next"></div>
    <script>window.__NEXT_DATA__ = {"props":{"pageProps":{}},"page":"/popup","query":{},"buildId":"development","nextExport":true,"autoExport":true,"isFallback":false,"scriptLoader":[]};</script>
    <script src="_next/static/chunks/webpack.js"></script>
    <script src="_next/static/chunks/main.js"></script>
    <script src="_next/static/chunks/pages/_app.js"></script>
    <script src="_next/static/chunks/pages/popup.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(buildDir, "popup.html"), popupHtml);

// Copy the entire out directory
if (fs.existsSync(outDir)) {
  const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);

    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);

      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDir(outDir, buildDir);
}

// Create icons directory and placeholder icons
const iconsDir = path.join(buildDir, "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create simple SVG icons as placeholders
const createIcon = (
  size
) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3B82F6"/>
  <path d="M${size / 4} ${size / 3}h${size / 2}v${size / 3}h-${
  size / 2
}z" fill="white"/>
  <circle cx="${size / 2}" cy="${size * 0.75}" r="${size / 8}" fill="white"/>
</svg>`;

// Generate PNG icons from SVG (simplified - you might want to use a proper converter)
const sizes = [16, 32, 48, 128];
sizes.forEach((size) => {
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), createIcon(size));
});

console.log("Extension build completed in:", buildDir);
console.log(
  "To install: Load unpacked extension from the",
  buildDir,
  "directory in Chrome"
);
