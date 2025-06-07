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

## 🚀 Development

### Making Changes

1. **Edit Files**

   - Modify any of the source files
   - Changes to `sidepanel.html`, `sidepanel.js`, `sidepanel.css` affect the interface
   - Changes to `background.js` affect background processing

2. **Reload Extension**

   - Go to `chrome://extensions/`
   - Find your extension
   - Click the reload icon
   - Or disable and re-enable the extension

3. **Debug**
   - Right-click extension icon → "Inspect popup" for side panel debugging
   - Use Chrome DevTools for debugging
   - Check `chrome://extensions/` for error messages

## 📝 Common Issues

1. **PDF Not Loading**

   - Ensure the PDF file is not corrupted
   - Check file permissions
   - Verify the file size is within limits

2. **Conversion Fails**

   - Check browser console for errors
   - Ensure sufficient memory is available
   - Try with a smaller PDF file

3. **Side Panel Not Opening**
   - Verify extension is properly installed
   - Check for JavaScript errors in DevTools
   - Try reloading the extension

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

---

**Note**: This extension processes PDF files locally in your browser, ensuring your files remain private and secure.
