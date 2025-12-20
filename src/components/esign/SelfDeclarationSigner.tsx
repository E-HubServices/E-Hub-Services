import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, PenLine, Eraser, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// Initialize PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SelfDeclarationSignerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pdfUrl: string;
    onSignComplete: (signatureDataUrl: string) => Promise<void>;
    isSubmitting: boolean;
}

const SelfDeclarationSigner = ({
    open,
    onOpenChange,
    pdfUrl,
    onSignComplete,
    isSubmitting
}: SelfDeclarationSignerProps) => {
    const sigRef = useRef<SignatureCanvas>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);

    // PDF Load Success Handler
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const handleClear = () => {
        sigRef.current?.clear();
    };

    const handleSubmit = async () => {
        if (!sigRef.current || sigRef.current.isEmpty()) {
            toast.error("Please draw your signature");
            return;
        }
        if (!isConfirmed) {
            toast.error("Please confirm the declaration");
            return;
        }

        // Get signature as PNG
        const signatureData = sigRef.current.getTrimmedCanvas().toDataURL("image/png");

        try {
            await onSignComplete(signatureData);
            handleClear();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 bg-slate-50 overflow-hidden">
                <DialogHeader className="p-6 bg-white border-b border-slate-200">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-900 uppercase">
                        <PenLine className="h-6 w-6 text-primary" />
                        Sign Self-Declaration
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* PDF Preview */}
                    <div className="flex-1 bg-slate-200/50 p-6 overflow-auto border-r border-slate-200 flex justify-center">
                        <div className="bg-white shadow-xl rounded-sm">
                            <Document
                                file={pdfUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={<div className="p-10 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}
                                error={<div className="p-10 text-red-500 font-bold">Failed to load PDF.</div>}
                            >
                                {Array.from(new Array(numPages), (el, index) => (
                                    <Page
                                        key={`page_${index + 1}`}
                                        pageNumber={index + 1}
                                        width={500}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        className="mb-4 shadow-sm"
                                    />
                                ))}
                            </Document>
                        </div>
                    </div>

                    {/* Signature Panel */}
                    <div className="w-full lg:w-96 bg-white flex flex-col shadow-xl z-10">
                        <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">1. Draw Signature</h3>
                                <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:border-primary/50 transition-colors relative">
                                    <SignatureCanvas
                                        ref={sigRef}
                                        penColor="black"
                                        canvasProps={{
                                            className: "w-full h-48 cursor-crosshair block",
                                        }}
                                        backgroundColor="rgba(255,255,255,0)"
                                    />
                                    <div className="absolute top-2 right-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleClear}
                                            className="h-8 px-2 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <Eraser className="h-3 w-3 mr-1" /> Clear
                                        </Button>
                                    </div>
                                    <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                                        <span className="text-[10px] font-bold text-slate-300 uppercase">Sign in the box above</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">2. Confirmation</h3>
                                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                                    <Checkbox
                                        id="confirm"
                                        checked={isConfirmed}
                                        onCheckedChange={(c) => setIsConfirmed(c as boolean)}
                                        className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:text-black border-slate-300"
                                    />
                                    <label htmlFor="confirm" className="text-xs font-medium text-slate-600 leading-relaxed cursor-pointer select-none">
                                        I hereby declare that the information provided in this document is true and accurate to the best of my knowledge. I understand that any false statement may result in rejection or legal action.
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !isConfirmed}
                                className="w-full h-12 bg-black hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl transition-all active:scale-95"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Signing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Sign & Submit
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SelfDeclarationSigner;
