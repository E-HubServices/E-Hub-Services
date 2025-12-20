import { useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
    PenTool,
    Trash2,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Check,
    X,
    Move,
    Loader2,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SignaturePlacement {
    id: string;
    dataUrl: string;
    x: number;
    y: number;
    width: number;
    height: number;
    pageNumber: number;
}

interface PdfSignatureEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pdfUrl: string;
    onSignComplete: (signatures: SignaturePlacement[]) => void;
    isSubmitting?: boolean;
}

const PdfSignatureEditor = ({
    open,
    onOpenChange,
    pdfUrl,
    onSignComplete,
    isSubmitting = false
}: PdfSignatureEditorProps) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [scale, setScale] = useState<number>(0.8);
    const [isDrawing, setIsDrawing] = useState(false);
    const [signatures, setSignatures] = useState<SignaturePlacement[]>([]);
    const [draggedSignature, setDraggedSignature] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const signatureCanvasRef = useRef<SignatureCanvas>(null);
    const pdfContainerRef = useRef<HTMLDivElement>(null);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const handleClearCanvas = () => {
        signatureCanvasRef.current?.clear();
    };

    // Process canvas to create transparent PNG
    const createTransparentSignature = (): string | null => {
        const canvas = signatureCanvasRef.current?.getCanvas();
        if (!canvas) return null;

        // Create a new canvas for processing
        const processCanvas = document.createElement('canvas');
        processCanvas.width = canvas.width;
        processCanvas.height = canvas.height;
        const ctx = processCanvas.getContext('2d');
        if (!ctx) return null;

        // Draw original signature
        ctx.drawImage(canvas, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Make white pixels transparent
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // If pixel is close to white, make it transparent
            if (r > 250 && g > 250 && b > 250) {
                data[i + 3] = 0; // Set alpha to 0
            }
        }

        // Put processed image back
        ctx.putImageData(imageData, 0, 0);

        // Return as PNG data URL
        return processCanvas.toDataURL('image/png');
    };

    const handleSaveSignature = () => {
        if (signatureCanvasRef.current?.isEmpty()) {
            return;
        }

        const dataUrl = createTransparentSignature();
        if (!dataUrl) return;

        // Add signature to center of current page
        const newSignature: SignaturePlacement = {
            id: `sig-${Date.now()}`,
            dataUrl,
            x: 150,
            y: 150,
            width: 200,
            height: 100,
            pageNumber: currentPage
        };

        setSignatures([...signatures, newSignature]);
        handleClearCanvas();
        setIsDrawing(false);
    };

    const handleDeleteSignature = (id: string) => {
        setSignatures(signatures.filter(sig => sig.id !== id));
    };

    const handleMouseDown = (e: React.MouseEvent, signatureId: string) => {
        e.preventDefault();
        const signature = signatures.find(s => s.id === signatureId);
        if (!signature) return;

        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setDraggedSignature(signatureId);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggedSignature || !pdfContainerRef.current) return;

        const containerRect = pdfContainerRef.current.getBoundingClientRect();
        const newX = e.clientX - containerRect.left - dragOffset.x;
        const newY = e.clientY - containerRect.top - dragOffset.y;

        setSignatures(signatures.map(sig =>
            sig.id === draggedSignature
                ? { ...sig, x: Math.max(0, newX), y: Math.max(0, newY) }
                : sig
        ));
    };

    const handleMouseUp = () => {
        setDraggedSignature(null);
    };

    const handleSubmit = () => {
        if (signatures.length === 0) {
            return;
        }
        onSignComplete(signatures);
    };

    const currentPageSignatures = signatures.filter(sig => sig.pageNumber === currentPage);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
                    <DialogTitle className="text-lg sm:text-2xl font-black uppercase tracking-tight">
                        Sign Document
                    </DialogTitle>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                        Draw your signature and place it on the document
                    </p>
                </DialogHeader>

                {/* Mobile-Responsive Layout: Vertical Stack */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* PDF Viewer Section */}
                    <div className="flex-1 flex flex-col bg-slate-50 lg:border-r">
                        {/* PDF Controls */}
                        <div className="p-2 sm:p-4 bg-white border-b flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 px-2 sm:px-3"
                                >
                                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Prev</span>
                                </Button>
                                <span className="text-xs sm:text-sm font-bold px-2">
                                    {currentPage}/{numPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                                    disabled={currentPage === numPages}
                                    className="h-8 px-2 sm:px-3"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                                    className="h-8 w-8"
                                >
                                    <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <span className="text-xs sm:text-sm font-bold px-1 sm:px-2 min-w-[50px] text-center">
                                    {Math.round(scale * 100)}%
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setScale(Math.min(2, scale + 0.1))}
                                    className="h-8 w-8"
                                >
                                    <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* PDF Display */}
                        <div
                            ref={pdfContainerRef}
                            className="flex-1 overflow-auto p-2 sm:p-4 lg:p-8 flex items-start justify-center relative touch-none"
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <div className="relative shadow-xl sm:shadow-2xl">
                                <Document
                                    file={pdfUrl}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    loading={
                                        <div className="flex items-center justify-center p-10 sm:p-20">
                                            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                                        </div>
                                    }
                                >
                                    <Page
                                        pageNumber={currentPage}
                                        scale={scale}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        className="max-w-full"
                                    />
                                </Document>

                                {/* Signature Overlays */}
                                {currentPageSignatures.map((sig) => (
                                    <div
                                        key={sig.id}
                                        className={cn(
                                            "absolute border-2 border-dashed border-primary cursor-move group",
                                            draggedSignature === sig.id && "border-solid shadow-lg ring-2 ring-primary/20"
                                        )}
                                        style={{
                                            left: `${sig.x}px`,
                                            top: `${sig.y}px`,
                                            width: `${sig.width}px`,
                                            height: `${sig.height}px`,
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, sig.id)}
                                    >
                                        <img
                                            src={sig.dataUrl}
                                            alt="Signature"
                                            className="w-full h-full object-contain pointer-events-none"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            onClick={() => handleDeleteSignature(sig.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                        <div className="absolute -bottom-7 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                                            <span className="text-xs font-bold text-primary bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap">
                                                <Move className="h-3 w-3 inline mr-1" />
                                                Drag to move
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Signature Tools Section - Vertical on Mobile */}
                    <div className="w-full lg:w-96 flex flex-col bg-white border-t lg:border-t-0">
                        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 overflow-auto">
                            <h3 className="text-xs sm:text-sm font-black uppercase text-slate-400 tracking-widest">
                                {isDrawing ? "Draw Your Signature" : "Signature Tools"}
                            </h3>

                            {!isDrawing ? (
                                <div className="space-y-3">
                                    <Button
                                        onClick={() => setIsDrawing(true)}
                                        className="w-full bg-primary hover:bg-primary/90 text-slate-950 font-bold h-10 sm:h-12"
                                    >
                                        <PenTool className="h-4 w-4 mr-2" />
                                        Draw New Signature
                                    </Button>

                                    {signatures.length > 0 && (
                                        <>
                                            <Separator />
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-slate-500">
                                                    Placed Signatures ({signatures.length})
                                                </p>
                                                <div className="max-h-32 overflow-y-auto space-y-2">
                                                    {signatures.map((sig) => (
                                                        <div
                                                            key={sig.id}
                                                            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border"
                                                        >
                                                            <img
                                                                src={sig.dataUrl}
                                                                alt="Signature"
                                                                className="h-6 w-12 sm:h-8 sm:w-16 object-contain bg-white border rounded"
                                                            />
                                                            <span className="text-xs flex-1">Page {sig.pageNumber}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => handleDeleteSignature(sig.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white">
                                        <SignatureCanvas
                                            ref={signatureCanvasRef}
                                            canvasProps={{
                                                width: window.innerWidth < 640 ? Math.min(window.innerWidth - 64, 336) : 336,
                                                height: 180,
                                                className: "signature-canvas touch-action-none"
                                            }}
                                            backgroundColor="rgb(255, 255, 255)"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleClearCanvas}
                                            className="flex-1 h-10"
                                        >
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Clear
                                        </Button>
                                        <Button
                                            onClick={handleSaveSignature}
                                            className="flex-1 bg-india-green hover:bg-india-green/90 text-white h-10"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Add
                                        </Button>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsDrawing(false)}
                                        className="w-full text-slate-500 h-9"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Action Buttons */}
                        <div className="p-4 sm:p-6 space-y-2 sm:space-y-3 bg-slate-50">
                            <Button
                                onClick={handleSubmit}
                                disabled={signatures.length === 0 || isSubmitting}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 sm:h-12"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Submit Signed Document
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                                className="w-full h-10"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PdfSignatureEditor;
