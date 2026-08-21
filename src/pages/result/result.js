document.addEventListener('DOMContentLoaded', async () => {
  const imgElement = document.getElementById('previewImage');
  const loadingElement = document.getElementById('loading');
  const downloadPngBtn = document.getElementById('downloadPngBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const cropBtn = document.getElementById('cropBtn');
  const applyCropBtn = document.getElementById('applyCropBtn');
  const cancelCropBtn = document.getElementById('cancelCropBtn');
  
  let imageDataUrl = null;
  let cropper = null;

  try {
    const data = await chrome.storage.local.get('capturedImage');
    if (data.capturedImage) {
      imageDataUrl = data.capturedImage;
      imgElement.src = imageDataUrl;
      imgElement.style.display = 'block';
      loadingElement.style.display = 'none';
      cropBtn.style.display = 'inline-flex';
      
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

  cropBtn.addEventListener('click', () => {
    if (!imageDataUrl) return;
    
    cropBtn.style.display = 'none';
    applyCropBtn.style.display = 'inline-flex';
    cancelCropBtn.style.display = 'inline-flex';
    
    // Hide download buttons during crop
    const aside = document.querySelector('.floating-action-bar');
    if (aside) aside.style.display = 'none';
    
    cropper = new Cropper(imgElement, {
      viewMode: 1,
      dragMode: 'crop',
      autoCropArea: 0.8,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    });
  });

  applyCropBtn.addEventListener('click', () => {
    if (!cropper) return;
    
    // Get cropped canvas
    const canvas = cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });
    
    // Update image data url
    imageDataUrl = canvas.toDataURL('image/png');
    
    // Cleanup cropper
    cropper.destroy();
    cropper = null;
    
    // Update image src
    imgElement.src = imageDataUrl;
    
    // Reset buttons
    cropBtn.style.display = 'inline-flex';
    applyCropBtn.style.display = 'none';
    cancelCropBtn.style.display = 'none';
    
    const aside = document.querySelector('.floating-action-bar');
    if (aside) aside.style.display = 'flex';
  });

  cancelCropBtn.addEventListener('click', () => {
    if (!cropper) return;
    
    // Cleanup cropper
    cropper.destroy();
    cropper = null;
    
    // Restore original image data url if it was replaced by cropper
    // Not needed since we didn't change imageDataUrl on cancel, 
    // just need to ensure src is correct
    imgElement.src = imageDataUrl;
    
    // Reset buttons
    cropBtn.style.display = 'inline-flex';
    applyCropBtn.style.display = 'none';
    cancelCropBtn.style.display = 'none';
    
    const aside = document.querySelector('.floating-action-bar');
    if (aside) aside.style.display = 'flex';
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
