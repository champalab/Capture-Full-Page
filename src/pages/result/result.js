document.addEventListener('DOMContentLoaded', async () => {
  const imgElement = document.getElementById('previewImage');
  const loadingElement = document.getElementById('loading');
  const downloadPngBtn = document.getElementById('downloadPngBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  
  let imageDataUrl = null;

  try {
    const data = await chrome.storage.local.get('capturedImage');
    if (data.capturedImage) {
      imageDataUrl = data.capturedImage;
      imgElement.src = imageDataUrl;
      imgElement.style.display = 'block';
      loadingElement.style.display = 'none';
      
      // We can clear storage if we don't need it persistent, 
      // but let's keep it until they close the tab or capture a new one
    } else {
      loadingElement.textContent = 'No image found. Please try capturing again.';
    }
  } catch (error) {
    console.error('Error loading image from storage:', error);
    loadingElement.textContent = 'Error loading image.';
  }

  downloadPngBtn.addEventListener('click', () => {
    if (!imageDataUrl) return;
    
    const timestamp = getTimestamp();
    const filename = `capture-full-page-${timestamp}.png`;
    
    // We use a temporary anchor tag to download from the current page context
    const a = document.createElement('a');
    a.href = imageDataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  downloadPdfBtn.addEventListener('click', () => {
    if (!imageDataUrl) return;
    
    // Show loading state on button
    const originalText = downloadPdfBtn.textContent;
    downloadPdfBtn.textContent = 'Generating PDF...';
    downloadPdfBtn.disabled = true;

    // Use setTimeout to allow UI to update before heavy canvas operation
    setTimeout(() => {
      try {
        // Convert the current PNG to JPEG for the PDF
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        ctx.drawImage(imgElement, 0, 0);
        
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const timestamp = getTimestamp();
        const filename = `capture-full-page-${timestamp}.pdf`;
        
        // Use our custom zero-dependency PDF generator
        window.generatePdfFromJpeg(jpegDataUrl, canvas.width, canvas.height, filename);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF.');
      } finally {
        downloadPdfBtn.textContent = originalText;
        downloadPdfBtn.disabled = false;
      }
    }, 50);
  });
});

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
