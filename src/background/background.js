const OFFSCREEN_DOCUMENT_PATH = 'src/offscreen/offscreen.html';

let isCapturing = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START_CAPTURE') {
    if (isCapturing) {
      chrome.runtime.sendMessage({ action: 'CAPTURE_ERROR', error: 'Capture already in progress.' });
      return;
    }
    
    isCapturing = true;
    startCapture(message.tabId).catch(error => {
      console.error('Capture failed:', error);
      chrome.runtime.sendMessage({ action: 'CAPTURE_ERROR', error: error.message || 'Unknown error occurred.' });
      isCapturing = false;
    });
  }
});

async function startCapture(tabId) {
  try {
    // 1. Ensure offscreen document is ready
    await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

    // 2. Inject content script if not already present
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['src/content/content.js']
    });

    // 3. Get page dimensions from content script
    const pageInfo = await sendMessageToTab(tabId, { action: 'GET_DIMENSIONS' });
    if (!pageInfo) throw new Error('Could not retrieve page dimensions.');

    // 4. Initialize offscreen canvas
    await chrome.runtime.sendMessage({
      action: 'INIT_CANVAS',
      width: pageInfo.fullWidth,
      height: pageInfo.fullHeight
    });

    // 5. Start scrolling and capturing
    const { viewWidth, viewHeight, fullHeight } = pageInfo;
    let currentY = 0;
    let captureCount = 0;
    const totalCaptures = Math.ceil(fullHeight / viewHeight);

    // Prepare page for capture (hide scrollbars, fixed elements, save scroll)
    await sendMessageToTab(tabId, { action: 'PREPARE_PAGE' });

    while (currentY < fullHeight) {
      // Scroll to currentY
      await sendMessageToTab(tabId, { action: 'SCROLL_TO', y: currentY });

      // Wait 600ms for rendering & Chrome rate limits
      await new Promise(resolve => setTimeout(resolve, 600));

      // Capture visible tab
      const dataUrl = await chrome.tabs.captureVisibleTab(tabId.windowId, { format: 'png' }); // Always capture as PNG to prevent quality loss during stitching

      // Calculate how much we actually scrolled (might be less at the bottom)
      const actualY = await sendMessageToTab(tabId, { action: 'GET_SCROLL_Y' });

      // Send to offscreen document to stitch
      await chrome.runtime.sendMessage({
        action: 'STITCH_SECTION',
        dataUrl: dataUrl,
        x: 0,
        y: actualY,
        width: viewWidth,
        height: viewHeight
      });

      captureCount++;
      chrome.runtime.sendMessage({ action: 'CAPTURE_PROGRESS', current: captureCount, total: totalCaptures });

      currentY += viewHeight;
    }

    // Restore page state
    await sendMessageToTab(tabId, { action: 'RESTORE_PAGE' });

    // 6. Generate final image from offscreen
    const finalDataUrl = await chrome.runtime.sendMessage({
      action: 'GET_FINAL_IMAGE',
      format: 'png'
    });

    if (!finalDataUrl) throw new Error('Failed to generate final image.');

    // 7. Store the image and open result page
    await chrome.storage.local.set({ capturedImage: finalDataUrl });

    await chrome.tabs.create({
      url: chrome.runtime.getURL('src/result/result.html')
    });

    // 8. Cleanup
    await chrome.runtime.sendMessage({ action: 'CLEANUP' });
    chrome.runtime.sendMessage({ action: 'CAPTURE_COMPLETE' });

  } catch (error) {
    throw error;
  } finally {
    isCapturing = false;
  }
}

async function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// Ensure exactly one offscreen document exists
async function setupOffscreenDocument(path) {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(path)]
  });

  if (existingContexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: path,
    reasons: ['DOM_PARSER', 'BLOBS'],
    justification: 'Stitch images using canvas'
  });
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const HH = pad(now.getHours());
  const MM = pad(now.getMinutes());
  const SS = pad(now.getSeconds());

  return `${yyyy}-${mm}-${dd}-${HH}${MM}${SS}`;
}
