document.addEventListener('DOMContentLoaded', () => {
  const captureBtn = document.getElementById('captureBtn');
  const formatSelect = document.getElementById('formatSelect');
  const langToggle = document.getElementById('langToggle');
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const statusMessage = document.getElementById('statusMessage');
  
  let currentLang = 'en';

  // Language toggling
  langToggle.addEventListener('change', (e) => {
    currentLang = e.target.checked ? 'lo' : 'en';
    updateLanguage();
  });

  function updateLanguage() {
    document.querySelectorAll('[data-lang-en]').forEach(el => {
      el.textContent = el.getAttribute(`data-lang-${currentLang}`);
    });
  }

  // Handle capture click
  captureBtn.addEventListener('click', async () => {
    // Reset UI
    captureBtn.disabled = true;
    formatSelect.disabled = true;
    langToggle.disabled = true;
    progressContainer.classList.remove('hidden');
    statusMessage.classList.add('hidden');
    statusMessage.className = 'status-message hidden';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';

    try {
      const format = formatSelect.value;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found.');
      }

      // Start capture process in background script
      chrome.runtime.sendMessage({ 
        action: 'START_CAPTURE', 
        tabId: tab.id, 
        format: format 
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
    formatSelect.disabled = false;
    langToggle.disabled = false;
  }
});
