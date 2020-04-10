// ==UserScript==
// @name         Desnivel issuu PDF
// @namespace    http://laaksonen.eu/
// @version      0.1
// @description  try to take over the world!
// @author       telaak
// @match        https://www.desnivel.com/revista-grandes-espacios-263/
// @grant        none
// @require https://github.com/foliojs/pdfkit/releases/download/v0.10.0/pdfkit.standalone.js
// @require https://github.com/devongovett/blob-stream/releases/download/v0.1.3/blob-stream.js

// ==/UserScript==

const getJson = () => {
  const issuuIframe = document.querySelectorAll('iframe')[0];
  const urlSearchParams = new URLSearchParams(issuuIframe.src.slice(issuuIframe.src.indexOf('?')));
  const jsonUrl = `https://reader3.isu.pub/${urlSearchParams.get('u')}/${urlSearchParams.get('d')}/reader3_4.json`;
  return fetch(jsonUrl).then(res => res.json());
};

const fetchImage = imageUrl => {
  return fetch(`https://${imageUrl}`).then(res => res.arrayBuffer());
};

const addImages = (images, doc) => {
  for (let i = 0; i < images.length; i++) {
    if (i === 0 || i === images.length - 1) {
      const img = doc.openImage(images[i]);
      doc.addPage({ size: [img.width, img.height] });
      doc.image(img, 0, 0);
    } else {
      const img = doc.openImage(images[i]);
      const nextImg = doc.openImage(images[i + 1]);
      doc.addPage({ size: [img.width + nextImg.width, img.height] });
      doc.image(img, 0, 0);
      doc.image(nextImg, img.width, 0);
      i++;
    }
  }
};

getJson().then(async json => {
  const imageUrls = json.document.pages.map(page => page.imageUri);
  let doc = new PDFDocument({ autoFirstPage: false });
  doc.info.Title = document.title;
  let stream = doc.pipe(blobStream());
  const images = await Promise.all(imageUrls.map(fetchImage));
  addImages(images, doc);
  doc.end();
  stream.on('finish', function() {
    const pdfFrame = document.createElement('iframe');
    pdfFrame.style = `width: 100%; height: 1080px`;
    pdfFrame.src = stream.toBlobURL('application/pdf');
    pdfFrame.setAttribute('download', document.title)
    document.body.appendChild(pdfFrame);
  });
});
