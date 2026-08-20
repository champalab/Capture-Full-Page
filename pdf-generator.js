// A custom, zero-dependency minimal PDF generator for a single JPEG image.
window.generatePdfFromJpeg = async function(jpegDataUrl, width, height, filename) {
  const base64Data = jpegDataUrl.split(',')[1];
  const binaryString = atob(base64Data);
  const jpegBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    jpegBytes[i] = binaryString.charCodeAt(i);
  }

  // Convert pixels to PDF points (1 pt = 1/72 inch). 
  // Assuming 96 DPI for standard screens, ratio is 72/96 = 0.75
  let pdfWidth = width * 0.75; 
  let pdfHeight = height * 0.75;
  
  // PDF has a maximum dimension limit (14400 points).
  if (pdfHeight > 14400) {
    const ratio = 14400 / pdfHeight;
    pdfHeight = 14400;
    pdfWidth = pdfWidth * ratio;
  }

  const encoder = new TextEncoder();
  const parts = [];
  let offset = 0;
  const xref = [];

  function pushAscii(str) {
    const bytes = encoder.encode(str);
    parts.push(bytes);
    offset += bytes.length;
  }
  
  function addXref() {
    xref.push(offset);
  }

  pushAscii("%PDF-1.3\n%\xE2\xE3\xCF\xD3\n");
  
  // 1. Catalog
  addXref();
  pushAscii(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  
  // 2. Pages
  addXref();
  pushAscii(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);
  
  // 3. Page
  addXref();
  pushAscii(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth.toFixed(2)} ${pdfHeight.toFixed(2)}] /Resources << /XObject << /I1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  
  // 4. Image
  addXref();
  pushAscii(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  parts.push(jpegBytes);
  offset += jpegBytes.length;
  pushAscii(`\nendstream\nendobj\n`);
  
  // 5. Content stream
  const contentStr = `q\n${pdfWidth.toFixed(2)} 0 0 ${pdfHeight.toFixed(2)} 0 0 cm\n/I1 Do\nQ\n`;
  addXref();
  pushAscii(`5 0 obj\n<< /Length ${contentStr.length} >>\nstream\n${contentStr}endstream\nendobj\n`);
  
  // XREF Table
  const startXref = offset;
  pushAscii(`xref\n0 6\n0000000000 65535 f \n`);
  for (let i = 0; i < xref.length; i++) {
    pushAscii(xref[i].toString().padStart(10, '0') + ` 00000 n \n`);
  }
  
  // Trailer
  pushAscii(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`);

  // Build the Blob and trigger download
  const blob = new Blob(parts, { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
