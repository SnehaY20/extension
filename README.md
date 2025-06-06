# File Upload Chrome Extension

A stable, vanilla JavaScript Chrome extension for file uploads that prevents popup closing issues commonly found with React/Next.js based extensions.

## 🚀 Features

- **Stable Popup**: No unexpected closing when uploading files
- **Drag & Drop Support**: Drop files directly on web pages
- **Upload History**: Track your recent uploads
- **Progress Tracking**: Visual progress indicators
- **Multiple File Support**: Upload multiple files at once
- **Modern UI**: Beautiful, responsive design with animations
- **Local Storage**: Secure local storage of upload history

## 📁 Project Structure

```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js             # Popup logic and file handling
├── styles.css           # Styling for the popup
├── background.js        # Service worker for background tasks
├── content.js          # Content script for web page interaction
└── README.md           # This file
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

### Using the Popup Interface

1. **Open the Extension**

   - Click the extension icon in Chrome toolbar
   - The popup window will open

2. **Select Files**

   - Click "Choose Files" button
   - Or drag and drop files onto the upload area
   - Selected files will appear in the list

3. **Upload Files**

   - Click "Upload Files" button
   - Watch the progress bar
   - Files will be processed and added to history

4. **View History**
   - Recent uploads appear in the "Recent Uploads" section
   - History is preserved between sessions

### Using Drag & Drop on Web Pages

1. **Drag Files to Any Web Page**

   - Drag files from your computer onto any web page
   - A drop zone overlay will appear
   - Release the files to upload

2. **In-Page Uploader**
   - The extension can inject a floating uploader on web pages
   - This feature can be activated through the content script

## 🔧 Key Features that Prevent Popup Closing

### 1. Event Prevention

```javascript
// Prevents form submissions that cause navigation
document.addEventListener("submit", function (e) {
  e.preventDefault();
  return false;
});
```

### 2. File Input Handling

```javascript
// Prevents propagation that might close popup
fileInput.addEventListener("click", function (e) {
  e.stopPropagation();
});
```

### 3. Stable State Management

- Uses vanilla JavaScript variables instead of React state
- No routing or navigation that could cause popup to close
- Proper event handling without framework interference

### 4. Memory-Based Storage

- No localStorage dependencies that might cause issues
- Uses Chrome extension storage API
- Maintains state without page refreshes

## 🐛 Troubleshooting

### Extension Not Loading

- Ensure all files are in the same directory
- Check that `manifest.json` is valid JSON
- Verify Chrome version supports Manifest V3

### Popup Closes Immediately

- This extension specifically fixes this issue
- If still occurring, check for JavaScript errors in DevTools
- Ensure no other extensions are interfering

### Files Not Uploading

- Check browser console for errors
- Verify file permissions
- Ensure files are not corrupted

### Upload History Not Saving

- Check if Chrome storage permissions are granted
- Clear extension data and try again
- Verify storage quota isn't exceeded

## 🔒 Permissions Explained

- **storage**: Save upload history locally
- **activeTab**: Interact with current web page for drag & drop

## 🚀 Development

### Making Changes

1. **Edit Files**

   - Modify any of the source files
   - Changes to `popup.html`, `popup.js`, `styles.css` affect the popup
   - Changes to `background.js` affect background processing
   - Changes to `content.js` affect web page interactions

2. **Reload Extension**

   - Go to `chrome://extensions/`
   - Find your extension
   - Click the reload icon
   - Or disable and re-enable the extension

3. **Debug**
   - Right-click extension icon → "Inspect popup" for popup debugging
   - Use Chrome DevTools for content script debugging
   - Check `chrome://extensions/` for error messages

### Adding Features

- **New Upload Destinations**: Modify `background.js` to handle different upload services
- **File Type Filtering**: Add validation in `popup.js`
- **UI Enhancements**: Update `styles.css` and `popup.html`
- **Additional Content Features**: Extend `content.js`

## 📝 Common Issues Fixed

1. **Popup Closing on File Selection** ✅ Fixed
2. **React/Next.js Routing Conflicts** ✅ Avoided by using vanilla JS
3. **localStorage Issues** ✅ Uses Chrome storage API
4. **Event Handling Problems** ✅ Proper event prevention
5. **State Management Issues** ✅ Simple variable-based state

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

---

**Note**: This extension is built with vanilla JavaScript to avoid the common popup closing issues that occur with React/Next.js based Chrome extensions. The stable architecture ensures reliable file upload functionality.
