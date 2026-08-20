# Capture Full Page

A complete Google Chrome extension that captures and downloads a screenshot of an entire webpage, including the non-visible scrolling area.

## Features

- **Full-Page Capture**: Scrolls through the entire page automatically to stitch together a complete screenshot.
- **Offscreen Processing**: Uses Chrome's Manifest V3 Offscreen API to safely stitch images together using a Canvas element, keeping the service worker light.
- **Smart Element Handling**: Temporarily hides fixed and sticky elements during capture to prevent them from appearing repeatedly in the final screenshot.
- **DPI-Aware**: Properly handles High-DPI screens (Retina displays) to output crisp, high-resolution images.
- **Format Options**: Export as PNG (lossless) or JPEG (smaller file size).
- **Internationalization**: English and Lao language support in the UI.

## Project Structure

```
├── manifest.json       # Extension configuration (Manifest V3)
├── popup.html          # Clean, modern extension popup UI
├── popup.css           # Blue-and-white visual theme for the popup
├── popup.js            # Popup interaction and progress tracking
├── background.js       # Service worker coordinating the capture process
├── content.js          # Injected script to measure, scroll, and prepare the page
├── offscreen.html      # Hidden document for image processing
├── offscreen.js        # Canvas logic to stitch overlapping image sections
├── icon.svg            # SVG icon
└── README.md           # Documentation
```

## How the Capture Process Works

1. **Trigger**: User clicks "Capture Full Page" in the popup.
2. **Setup**: The background script injects `content.js` and creates `offscreen.html`.
3. **Measure & Prepare**: The content script calculates the full page height, hides scrollbars, hides fixed/sticky elements, and saves the original scroll position.
4. **Scroll & Capture**: 
   - The page is scrolled vertically in viewport-sized increments.
   - After each scroll, it waits 600ms (to allow lazy-loaded content to render and respect Chrome's capture rate limit).
   - `chrome.tabs.captureVisibleTab` takes a screenshot of the visible area.
5. **Stitching**: Each section is sent to `offscreen.js`, which draws it onto an offscreen HTML5 `<canvas>` at the correct vertical offset, automatically overwriting overlapping areas at the bottom of the page.
6. **Export**: The offscreen canvas is converted to a Data URL (PNG or JPEG) and downloaded automatically using `chrome.downloads.download()`.
7. **Restore**: The content script restores the user's original scroll position and unhides the fixed/sticky elements.

## Permissions

- `activeTab`: Required to interact with the current tab and inject the content script.
- `scripting`: Required to inject `content.js` dynamically.
- `downloads`: Required to automatically save the final image to the user's Downloads folder without a prompt.
- `offscreen`: Required to create an offscreen document for Canvas-based image stitching, as Manifest V3 service workers do not support DOM APIs.

## How to Install (Developer Mode)

1. Open Google Chrome.
2. Navigate to `chrome://extensions/` in the URL bar.
3. Toggle the **Developer mode** switch in the top right corner.
4. Click the **Load unpacked** button.
5. Select the directory containing this project's files.
6. The extension will appear in your Chrome toolbar (puzzle piece icon).

## How to Test

1. Navigate to a long webpage (e.g., a Wikipedia article or a blog post).
2. Click the extension icon to open the popup.
3. Select your desired image format.
4. Click **Capture Full Page**.
5. Do not interact with the page while the capture is in progress.
6. Check your Downloads folder for the final image.

## Known Browser Limitations

- **Cross-Origin Restrictions**: The extension cannot capture `chrome://` pages, the Chrome Web Store, or other restricted URLs due to browser security policies.
- **Maximum Canvas Size**: Browsers limit the maximum dimensions of a `<canvas>` element (usually around 16,384px to 32,767px in height/width depending on the device). Capturing extremely long pages (e.g., infinite scrolling pages) might result in a blank image or an error if the limit is exceeded.
- **Memory Limits**: High-DPI screens on very long pages can consume significant RAM during the stitching process.

## Submitting to the Chrome Web Store

Before packaging for the Chrome Web Store:
1. **Convert Icons**: The Chrome Web Store requires PNG icons. Convert `icon.svg` to PNG format at exactly 16x16, 48x48, and 128x128 pixels, and update the filenames in `manifest.json`.
2. **ZIP the Files**: Select all project files and compress them into a `.zip` archive.
3. **Developer Dashboard**: Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole) and upload your `.zip` file.
4. **Privacy Policy**: Ensure you have a privacy policy explaining why you need the requested permissions.
