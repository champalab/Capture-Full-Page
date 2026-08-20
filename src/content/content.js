let originalScrollX = 0;
let originalScrollY = 0;
let originalOverflow = '';
let hiddenElements = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_DIMENSIONS') {
    sendResponse({
      fullWidth: Math.max(
        document.documentElement.scrollWidth,
        document.body ? document.body.scrollWidth : 0
      ),
      fullHeight: Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
      ),
      viewWidth: window.innerWidth,
      viewHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    });
  } 
  else if (message.action === 'PREPARE_PAGE') {
    originalScrollX = window.scrollX;
    originalScrollY = window.scrollY;
    
    // Hide scrollbars
    originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    // Hide fixed/sticky elements to avoid duplication
    hiddenElements = [];
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'sticky') {
        hiddenElements.push({
          element: el,
          originalOpacity: el.style.opacity,
          originalTransition: el.style.transition
        });
        el.style.transition = 'none';
        el.style.opacity = '0';
      }
    }
    
    sendResponse({ success: true });
  } 
  else if (message.action === 'SCROLL_TO') {
    window.scrollTo(0, message.y);
    sendResponse({ success: true });
  } 
  else if (message.action === 'GET_SCROLL_Y') {
    sendResponse(window.scrollY);
  } 
  else if (message.action === 'RESTORE_PAGE') {
    // Restore scrollbars
    document.documentElement.style.overflow = originalOverflow;

    // Restore fixed/sticky elements
    for (let item of hiddenElements) {
      item.element.style.opacity = item.originalOpacity;
      // Small delay to prevent flashing transition
      setTimeout(() => {
        item.element.style.transition = item.originalTransition;
      }, 50);
    }
    hiddenElements = [];

    // Restore scroll position
    window.scrollTo(originalScrollX, originalScrollY);
    
    sendResponse({ success: true });
  }
  return true;
});
