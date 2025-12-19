import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { PDFDocument } from "pdf-lib";

export const applyEsignAndSeal = action({
    args: {
        requestId: v.id("esign_requests"),
        signaturePlacement: v.optional(v.object({
            x: v.number(),
            y: v.number(),
            width: v.number(),
            height: v.number(),
        })),
        sealPlacement: v.optional(v.object({
            x: v.number(),
            y: v.number(),
            width: v.number(),
            height: v.number(),
        })),
        renderDimensions: v.optional(v.object({
            width: v.number(),
            height: v.number(),
        })),
        pageNumber: v.optional(v.number()),
        signatureData: v.optional(v.string()), // Base64 data
        sealData: v.optional(v.string()), // Base64 data
        signatureStorageId: v.optional(v.id("_storage")),
        sealStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        console.log(`[Action] Starting endorsement for request: ${args.requestId}`);

        // 1. Get request details using the internal bypass query
        const request = await ctx.runQuery(api.esign.getRequestInternal, { requestId: args.requestId });
        if (!request) throw new Error("Request not found");

        // 2. Load original PDF
        const pdfBlob = await ctx.storage.get(request.documentFileId);
        if (!pdfBlob) throw new Error("PDF file not found in storage");
        const pdfBytes = await pdfBlob.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);

        const pages = pdfDoc.getPages();
        const targetPageIndex = (args.pageNumber || 1) - 1;
        const page = pages[targetPageIndex] || pages[0];
        const { width: pdfWidth, height: pdfHeight } = page.getSize();

        console.log(`[Action] PDF Page Size: ${pdfWidth}x${pdfHeight}`);

        const decodeBase64 = (base64: string) => {
            const base64Data = base64.split(',')[1] || base64;
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        };

        const embedImage = async (data: Uint8Array) => {
            // Magic numbers for PNG: 89 50 4E 47
            const isPng = data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47;
            console.log(`[Action] Embedding image. Is PNG header detected? ${isPng}`);

            try {
                if (isPng) {
                    return await pdfDoc.embedPng(data);
                } else {
                    // Try JPG as fallback
                    return await pdfDoc.embedJpg(data);
                }
            } catch (e) {
                console.error(`[Action] Preferred embed failed, trying fallback. Error: ${e}`);
                try {
                    // Force try the other one
                    if (isPng) return await pdfDoc.embedJpg(data);
                    return await pdfDoc.embedPng(data);
                } catch (e2) {
                    throw new Error(`Failed to embed image: Both PNG and JPG embedding failed. Format might be unsupported.`);
                }
            }
        };

        // Calculate scaling if dimensions provided
        const scaleX = args.renderDimensions ? pdfWidth / args.renderDimensions.width : 1;
        const scaleY = args.renderDimensions ? pdfHeight / args.renderDimensions.height : 1;

        // 3. Embed signature
        if (args.signaturePlacement) {
            let sigBytes;
            if (args.signatureStorageId) {
                const blob = await ctx.storage.get(args.signatureStorageId);
                if (blob) sigBytes = new Uint8Array(await blob.arrayBuffer());
            } else if (args.signatureData) {
                sigBytes = decodeBase64(args.signatureData);
            }

            if (sigBytes) {
                const sigEmbed = await embedImage(sigBytes);

                // Flip Y coordinate for pdf-lib (starts from bottom)
                const finalX = args.signaturePlacement.x * scaleX;
                // PDF-Lib uses bottom-left origin. 
                // signaturePlacement.y is from TOP of render area.
                const finalY = pdfHeight - ((args.signaturePlacement.y + args.signaturePlacement.height) * scaleY);

                page.drawImage(sigEmbed, {
                    x: finalX,
                    y: finalY,
                    width: args.signaturePlacement.width * scaleX,
                    height: args.signaturePlacement.height * scaleY,
                });
            }
        }

        // 4. Embed seal
        if (args.sealPlacement) {
            let sealBytes;
            if (args.sealStorageId) {
                const blob = await ctx.storage.get(args.sealStorageId);
                if (blob) sealBytes = new Uint8Array(await blob.arrayBuffer());
            } else if (args.sealData) {
                sealBytes = decodeBase64(args.sealData);
            }

            if (sealBytes) {
                const sealEmbed = await embedImage(sealBytes);

                const finalX = args.sealPlacement.x * scaleX;
                const finalY = pdfHeight - ((args.sealPlacement.y + args.sealPlacement.height) * scaleY);

                page.drawImage(sealEmbed, {
                    x: finalX,
                    y: finalY,
                    width: args.sealPlacement.width * scaleX,
                    height: args.sealPlacement.height * scaleY,
                });
            }
        }

        // 5. Save and Store
        const finalPdf = await pdfDoc.save();
        const signedFileId = await ctx.storage.store(new Blob([finalPdf as any], { type: 'application/pdf' }));

        // 6. Update Request Status
        await ctx.runMutation(api.esign.internalCompleteSign, {
            requestId: args.requestId,
            signedFileId,
        });

        console.log(`[Action] Endorsement complete! New File ID: ${signedFileId}`);
        return signedFileId;
    },
});
