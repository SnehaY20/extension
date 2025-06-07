# PDF to Image Converter Chrome Extension

A Chrome extension that allows you to convert PDF files to PNG, JPEG, or JPG images directly in your browser.

## 🚀 Features

- **PDF to Image Conversion**: Convert PDF files to PNG, JPEG, or JPG formats
- **Side Panel Interface**: Easy-to-use side panel for file conversion
- **Multiple Format Support**: Choose between PNG, JPEG, or JPG output
- **Modern UI**: Clean and intuitive interface
- **Local Processing**: Files are processed locally in your browser

## 📁 Project Structure

```
extension/
├── manifest.json          # Extension configuration
├── sidepanel.html        # Side panel interface
├── sidepanel.js          # Side panel logic
├── sidepanel.css         # Side panel styling
├── background.js         # Service worker for background tasks
├── lib/                  # PDF processing library
├── utils/               # Utility functions
├── icons/               # Extension icons
└── README.md            # This file
```

## 🛠️ Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Download/Clone the repository**

   ```bash
   git clone <repository-url>
   cd extension
   ```

2. **Open Chrome Extensions Page**

   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**

   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**

   - Click "Load unpacked" button
   - Select the `extension` folder containing `manifest.json`
   - The extension should now appear in your extensions list

5. **Pin the Extension (Optional)**
   - Click the puzzle piece icon in Chrome toolbar
   - Find your extension and click the pin icon

### Method 2: Package and Install

1. **Package the Extension**

   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Pack extension"
   - Select the extension folder
   - This creates a `.crx` file

2. **Install the Package**
   - Drag the `.crx` file to the extensions page
   - Confirm installation

## 🎯 Usage

### Using the Side Panel

1. **Open the Extension**

   - Click the extension icon in Chrome toolbar
   - The side panel will open on the right side of your browser

2. **Select PDF File**

   - Click "Choose PDF" button
   - Select a PDF file from your computer
   - The file will be loaded into the converter

3. **Choose Output Format**

   - Select your desired output format (PNG, JPEG, or JPG)
   - Adjust any conversion settings if needed

4. **Convert and Download**

   - Click "Convert" button
   - Wait for the conversion to complete
   - Download the converted image file

## 🔒 Permissions Explained

- **sidePanel**: Enables the side panel interface
- **web_accessible_resources**: Allows access to PDF processing library

