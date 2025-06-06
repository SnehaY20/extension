const fs = require("fs");
const path = require("path");

// Define source and destination directories
const sourceDir = "extension";
const destDir = "extension-build";

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Function to copy a file
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${src} -> ${dest}`);
}

// Function to copy a directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// Copy main extension files
const filesToCopy = [
  "manifest.json",
  "popup.html",
  "popup.js",
  "styles.css",
  "background.js",
  "content.js",
];

filesToCopy.forEach((file) => {
  const srcPath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  if (fs.existsSync(srcPath)) {
    copyFile(srcPath, destPath);
  }
});

// Copy icons directory
const iconsSrc = path.join(sourceDir, "icons");
const iconsDest = path.join(destDir, "icons");
if (fs.existsSync(iconsSrc)) {
  copyDir(iconsSrc, iconsDest);
}

console.log("Extension assets copied successfully!");
