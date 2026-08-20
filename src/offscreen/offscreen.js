let canvas;
let ctx;
let targetLogicalWidth = 0;
let targetLogicalHeight = 0;
let scale = 1;
let isCanvasInitialized = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'INIT_CANVAS') {
    targetLogicalWidth = message.width;
    targetLogicalHeight = message.height;
    isCanvasInitialized = false;
    
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    sendResponse({ success: true });
    return false;
  } 
  else if (message.action === 'STITCH_SECTION') {
    stitchImage(message).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      console.error(err);
      sendResponse({ success: false, error: err.toString() });
    });
    return true; // Keep channel open for async response
  } 
  else if (message.action === 'GET_FINAL_IMAGE') {
    try {
      const mimeType = message.format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const quality = message.format === 'jpeg' ? 0.95 : undefined;
      const dataUrl = canvas.toDataURL(mimeType, quality);
      sendResponse(dataUrl);
    } catch (e) {
      console.error(e);
      sendResponse(null);
    }
    return false;
  }
  else if (message.action === 'CLEANUP') {
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    sendResponse({ success: true });
    return false;
  }
});

async function stitchImage({ dataUrl, x, y, width, height }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (!isCanvasInitialized) {
        // Calculate exact scale based on the actual pixel width of the screenshot
        scale = img.width / width;
        canvas.width = Math.round(targetLogicalWidth * scale);
        canvas.height = Math.round(targetLogicalHeight * scale);
        
        // Prevent image smoothing when drawing (helps with crispness)
        ctx.imageSmoothingEnabled = false;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isCanvasInitialized = true;
      }
      
      // Round the Y coordinate to the nearest integer to prevent sub-pixel antialiasing (blur)
      const sourceY = Math.round(y * scale);
      
      // We must also round the source dimensions to prevent fractional stretching
      const sourceX = 0;
      const sourceWidth = Math.round(width * scale);
      const sourceHeight = Math.round(height * scale);
      
      // Use the 9-argument drawImage to ensure exact 1:1 pixel mapping
      ctx.drawImage(img, 
        0, 0, img.width, img.height, 
        sourceX, sourceY, img.width, img.height
      );
      
      resolve();
    };
    img.onerror = () => reject(new Error('Failed to load image section'));
    img.src = dataUrl;
  });
}
