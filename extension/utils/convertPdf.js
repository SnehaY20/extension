export async function convertPdfToImages(file, format = "png") {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL(
    "lib/pdf.worker.min.js"
  );
  const typedArray = new Uint8Array(await file.arrayBuffer());

  const pdf = await window.pdfjsLib.getDocument({ data: typedArray }).promise;

  const images = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    const dataUrl = canvas.toDataURL(`image/${format}`);
    images.push({ dataUrl, index: i });
  }

  return images;
}
