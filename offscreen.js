let canvas;
let ctx;
let targetWidth = 0;
let targetHeight = 0;
let dpr = 1;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'INIT_CANVAS') {
    targetWidth = message.width;
    targetHeight = message.height;
    dpr = message.devicePixelRatio;

    canvas = document.getElementById('canvas');
    // Scale canvas logically by DPR
    canvas.width = targetWidth * dpr;
    canvas.height = targetHeight * dpr;
    ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

async function stitchImage({ dataUrl, x, y, width, height, devicePixelRatio }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Draw image onto canvas at the correct offset
      // Coordinates need to be scaled by devicePixelRatio
      const sourceY = y * devicePixelRatio;
      
      // If this is the last piece, it might overlap the previous piece.
      // E.g., page height 1500, viewport 1000. 
      // First shot at y=0. Second shot at y=500.
      // We just draw it at y=500. It overrides the bottom half of the first shot, which is correct!
      ctx.drawImage(img, 0, sourceY);
      resolve();
    };
    img.onerror = () => reject(new Error('Failed to load image section'));
    img.src = dataUrl;
  });
}
