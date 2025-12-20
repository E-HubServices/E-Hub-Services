import { PDFDocument } from 'pdf-lib';

export interface SignaturePlacement {
    id: string;
    dataUrl: string;
    x: number;
    y: number;
    width: number;
    height: number;
    pageNumber: number;
}

/**
 * Embeds multiple signature images into a PDF document at specified positions.
 * @param pdfUrl URL of the original PDF
 * @param signatures Array of signature placements
 * @returns Blob of the signed PDF
 */
export async function embedSignaturesInPdf(
    pdfUrl: string,
    signatures: SignaturePlacement[]
): Promise<Blob> {
    // 1. Fetch the existing PDF
    const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());

    // 2. Load a PDFDocument from the existing PDF bytes
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // 3. Get all pages
    const pages = pdfDoc.getPages();

    // 4. Process each signature
    for (const signature of signatures) {
        // Embed the PNG signature image
        const signatureImage = await pdfDoc.embedPng(signature.dataUrl);

        // Get the target page (1-indexed to 0-indexed)
        const pageIndex = signature.pageNumber - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) {
            console.warn(`Invalid page number ${signature.pageNumber}, skipping signature`);
            continue;
        }

        const page = pages[pageIndex];
        const { height: pageHeight } = page.getSize();

        // Convert coordinates (PDF coordinates start from bottom-left)
        // Our UI coordinates start from top-left, so we need to flip Y
        const pdfY = pageHeight - signature.y - signature.height;

        // Draw the signature image
        page.drawImage(signatureImage, {
            x: signature.x,
            y: pdfY,
            width: signature.width,
            height: signature.height,
        });
    }

    // 5. Add timestamp on the last page
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    lastPage.drawText(`Digitally Signed: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, {
        x: 50,
        y: 30,
        size: 8,
    });

    // 6. Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();

    // 7. Return as Blob
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}

/**
 * Legacy function for single signature placement (backward compatibility)
 * @deprecated Use embedSignaturesInPdf instead
 */
export async function embedSignatureInPdf(pdfUrl: string, signatureDataUrl: string): Promise<Blob> {
    const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const signatureImage = await pdfDoc.embedPng(signatureDataUrl);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    const sigWidth = 150;
    const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;

    lastPage.drawImage(signatureImage, {
        x: width - sigWidth - 50,
        y: 50,
        width: sigWidth,
        height: sigHeight,
    });

    lastPage.drawText(`Digitally Signed: ${new Date().toISOString()}`, {
        x: width - sigWidth - 50,
        y: 40,
        size: 8,
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}
