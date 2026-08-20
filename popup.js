document.addEventListener('DOMContentLoaded', () => {
  const captureBtn = document.getElementById('captureBtn');
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const statusMessage = document.getElementById('statusMessage');
  
  let currentLang = 'en';

  // Handle capture click
  captureBtn.addEventListener('click', async () => {
    // Reset UI
    captureBtn.disabled = true;
    progressContainer.classList.remove('hidden');
    statusMessage.classList.add('hidden');
    statusMessage.className = 'status-message hidden';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found.');
      }

      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
        throw new Error(currentLang === 'en' ? 'Cannot capture restricted browser pages (chrome://).' : 'ບໍ່ສາມາດຖ່າຍຮູບໜ້າເວັບຂອງບຣາວເຊີ (chrome://) ໄດ້ເນື່ອງຈາກລະບົບຄວາມປອດໄພ.');
      }

      // Start capture process in background script
      chrome.runtime.sendMessage({ 
        action: 'START_CAPTURE', 
        tabId: tab.id
      });

    } catch (error) {
      showError(error.message);
    }
  });

  // Listen for progress and completion messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'CAPTURE_PROGRESS') {
      const percentage = Math.round((message.current / message.total) * 100);
      progressFill.style.width = `${percentage}%`;
      progressText.textContent = `${percentage}%`;
    } 
    else if (message.action === 'CAPTURE_COMPLETE') {
      progressFill.style.width = '100%';
      progressText.textContent = '100%';
      
      setTimeout(() => {
        showSuccess();
      }, 500);
    } 
    else if (message.action === 'CAPTURE_ERROR') {
      showError(message.error);
    }
  });

  function showSuccess() {
    progressContainer.classList.add('hidden');
    statusMessage.textContent = currentLang === 'en' ? 'Capture complete!' : 'ການຖ່າຍຮູບສຳເລັດ!';
    statusMessage.classList.remove('hidden');
    statusMessage.classList.add('success');
    resetButtons();
  }

  function showError(errorText) {
    progressContainer.classList.add('hidden');
    statusMessage.textContent = (currentLang === 'en' ? 'Error: ' : 'ຂໍ້ຜິດພາດ: ') + errorText;
    statusMessage.classList.remove('hidden');
    statusMessage.classList.add('error');
    resetButtons();
  }

  function resetButtons() {
    captureBtn.disabled = false;
  }
});
