import { PDFDocument } from 'pdf-lib';

/**
 * Embeds a signature image into the last page of a PDF document.
 * @param pdfUrl URL of the original PDF
 * @param signatureDataUrl Base64 data URL of the signature image (PNG)
 * @returns Blob of the signed PDF
 */
export async function embedSignatureInPdf(pdfUrl: string, signatureDataUrl: string): Promise<Blob> {
    // 1. Fetch the existing PDF
    const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());

    // 2. Load a PDFDocument from the existing PDF bytes
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // 3. Embed the PNG signature image
    const signatureImage = await pdfDoc.embedPng(signatureDataUrl);

    // 4. Get the last page of the document
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    // Get page dimensions
    const { width, height } = lastPage.getSize();

    // 5. Draw the signature image
    // Adjust position and size as needed. Here putting it at bottom right.
    const sigWidth = 150;
    const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;

    lastPage.drawImage(signatureImage, {
        x: width - sigWidth - 50, // 50px from right
        y: 50,                    // 50px from bottom
        width: sigWidth,
        height: sigHeight,
    });

    // 6. Add timestamp text
    lastPage.drawText(`Digitally Signed: ${new Date().toISOString()}`, {
        x: width - sigWidth - 50,
        y: 40,
        size: 8,
    });

    // 7. Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // 8. Return as Blob
    return new Blob([pdfBytes], { type: 'application/pdf' });
}
