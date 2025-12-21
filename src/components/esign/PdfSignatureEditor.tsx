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
    Loader2,
    ChevronLeft,
    ChevronRight,
    Maximize2
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
    const [scale, setScale] = useState<number>(0.5); // Default 50%
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [signatures, setSignatures] = useState<SignaturePlacement[]>([]);
    const [draggedSignature, setDraggedSignature] = useState<string | null>(null);
    const [resizingSignature, setResizingSignature] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

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

        const processCanvas = document.createElement('canvas');
        processCanvas.width = canvas.width;
        processCanvas.height = canvas.height;
        const ctx = processCanvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(canvas, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r > 250 && g > 250 && b > 250) {
                data[i + 3] = 0;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return processCanvas.toDataURL('image/png');
    };

    const handleSaveSignature = () => {
        if (signatureCanvasRef.current?.isEmpty()) {
            return;
        }

        const dataUrl = createTransparentSignature();
        if (!dataUrl) return;

        const newSignature: SignaturePlacement = {
            id: `sig-${Date.now()}`,
            dataUrl,
            x: 100,
            y: 100,
            width: 200,
            height: 100,
            pageNumber: currentPage
        };

        setSignatures([...signatures, newSignature]);
        handleClearCanvas();
        setIsDrawerOpen(false); // Close drawer after adding signature
    };

    const handleDeleteSignature = (id: string) => {
        setSignatures(signatures.filter(sig => sig.id !== id));
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, signatureId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const signature = signatures.find(s => s.id === signatureId);
        if (!signature) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const rect = (e.target as HTMLElement).getBoundingClientRect();

        setDragOffset({
            x: clientX - rect.left,
            y: clientY - rect.top
        });
        setDraggedSignature(signatureId);
    };

    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, signatureId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const signature = signatures.find(s => s.id === signatureId);
        if (!signature) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        setResizingSignature(signatureId);
        setResizeStart({
            x: clientX,
            y: clientY,
            width: signature.width,
            height: signature.height
        });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!pdfContainerRef.current) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const containerRect = pdfContainerRef.current.getBoundingClientRect();

        if (draggedSignature) {
            const newX = clientX - containerRect.left - dragOffset.x;
            const newY = clientY - containerRect.top - dragOffset.y;

            setSignatures(signatures.map(sig =>
                sig.id === draggedSignature
                    ? { ...sig, x: Math.max(0, newX), y: Math.max(0, newY) }
                    : sig
            ));
        }

        if (resizingSignature) {
            const deltaX = clientX - resizeStart.x;
            const deltaY = clientY - resizeStart.y;

            setSignatures(signatures.map(sig => {
                if (sig.id === resizingSignature) {
                    const newWidth = Math.max(80, resizeStart.width + deltaX);
                    const newHeight = Math.max(50, resizeStart.height + deltaY);
                    return { ...sig, width: newWidth, height: newHeight };
                }
                return sig;
            }));
        }
    };

    const handleMouseUp = () => {
        setDraggedSignature(null);
        setResizingSignature(null);
    };

    const handleSubmit = () => {
        if (signatures.length === 0) {
            return;
        }
        onSignComplete(signatures);
    };

    const currentPageSignatures = signatures.filter(sig => sig.pageNumber === currentPage);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[100vw] w-full h-[100vh] max-h-[100vh] overflow-hidden flex flex-col p-0 m-0 rounded-none lg:max-w-[95vw] lg:max-h-[95vh] lg:rounded-lg lg:m-4">
                <DialogHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4 border-b shrink-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-base sm:text-2xl font-black uppercase tracking-tight">
                            Sign Document
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                        Place your signature on the document
                    </p>
                </DialogHeader>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0 relative">
                    {/* PDF Viewer - Full Screen */}
                    <div className="flex-1 flex flex-col bg-slate-50 lg:border-r min-h-0">
                        {/* PDF Controls */}
                        <div className="p-2 sm:p-3 bg-white border-b flex items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 px-2 sm:px-3"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-1">Prev</span>
                                </Button>
                                <span className="text-xs sm:text-sm font-bold px-1 sm:px-2">
                                    {currentPage}/{numPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                                    disabled={currentPage === numPages}
                                    className="h-8 px-2 sm:px-3"
                                >
                                    <span className="hidden sm:inline mr-1">Next</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setScale(Math.max(0.3, scale - 0.1))}
                                    className="h-8 w-8"
                                >
                                    <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <span className="text-xs sm:text-sm font-bold px-1 min-w-[45px] text-center">
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

                        {/* SCROLLABLE PDF Container */}
                        <div
                            ref={pdfContainerRef}
                            className="flex-1 overflow-auto p-2 sm:p-4 lg:p-8 flex items-start justify-center relative touch-none bg-slate-100"
                            onMouseMove={handleMouseMove}
                            onTouchMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onTouchEnd={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <div className="relative shadow-xl">
                                <Document
                                    file={pdfUrl}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    loading={
                                        <div className="flex items-center justify-center p-20">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
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

                                {/* Signature Overlays - Always Draggable */}
                                {currentPageSignatures.map((sig) => (
                                    <div
                                        key={sig.id}
                                        className={cn(
                                            "absolute border-2 border-dashed border-primary cursor-move group touch-none",
                                            (draggedSignature === sig.id || resizingSignature === sig.id) && "border-solid shadow-2xl ring-4 ring-primary/30 z-50"
                                        )}
                                        style={{
                                            left: `${sig.x}px`,
                                            top: `${sig.y}px`,
                                            width: `${sig.width}px`,
                                            height: `${sig.height}px`,
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, sig.id)}
                                        onTouchStart={(e) => handleMouseDown(e, sig.id)}
                                    >
                                        <img
                                            src={sig.dataUrl}
                                            alt="Signature"
                                            className="w-full h-full object-contain pointer-events-none"
                                        />

                                        {/* Delete Button - Always Visible */}
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-3 -right-3 h-7 w-7 sm:h-6 sm:w-6 rounded-full shadow-lg z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSignature(sig.id);
                                            }}
                                        >
                                            <X className="h-4 w-4 sm:h-3 sm:w-3" />
                                        </Button>

                                        {/* Resize Handle - Always Visible */}
                                        <div
                                            className="absolute -bottom-3 -right-3 h-8 w-8 sm:h-7 sm:w-7 bg-primary rounded-full cursor-nwse-resize shadow-lg z-10 flex items-center justify-center touch-none border-2 border-white"
                                            onMouseDown={(e) => handleResizeStart(e, sig.id)}
                                            onTouchStart={(e) => handleResizeStart(e, sig.id)}
                                        >
                                            <Maximize2 className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Desktop: Side Panel */}
                    {!isMobile && (
                        <div className="w-96 flex flex-col bg-white">
                            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                                <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">
                                    Signature Tools
                                </h3>

                                <Button
                                    onClick={() => setIsDrawerOpen(true)}
                                    className="w-full bg-primary hover:bg-primary/90 text-slate-950 font-bold h-12"
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
                                            <div className="max-h-48 overflow-y-auto space-y-2">
                                                {signatures.map((sig) => (
                                                    <div
                                                        key={sig.id}
                                                        className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border"
                                                    >
                                                        <img
                                                            src={sig.dataUrl}
                                                            alt="Signature"
                                                            className="h-8 w-16 object-contain bg-white border rounded"
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

                            <Separator />

                            <div className="p-6 space-y-3 bg-slate-50">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={signatures.length === 0 || isSubmitting}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12"
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
                                    className="w-full"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Mobile: Bottom Action Bar */}
                    {isMobile && (
                        <div className="p-3 bg-white border-t space-y-2 shrink-0 z-10">
                            {signatures.length > 0 && (
                                <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                                    <span className="font-bold">{signatures.length} signature(s) placed</span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setIsDrawerOpen(true)}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-slate-950 font-bold h-12"
                                >
                                    <PenTool className="h-4 w-4 mr-2" />
                                    {signatures.length > 0 ? "Add More" : "Draw Signature"}
                                </Button>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={signatures.length === 0 || isSubmitting}
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold h-12"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Submit
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Signature Drawing Drawer (Mobile & Desktop) */}
                    {isDrawerOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center"
                            onClick={() => setIsDrawerOpen(false)}
                        >
                            <div
                                className="bg-white w-full lg:w-[500px] rounded-t-2xl lg:rounded-2xl shadow-2xl animate-in slide-in-from-bottom lg:slide-in-from-bottom-0 duration-300"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-4 sm:p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black uppercase">Draw Your Signature</h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setIsDrawerOpen(false)}
                                            className="h-8 w-8"
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner">
                                        <SignatureCanvas
                                            ref={signatureCanvasRef}
                                            canvasProps={{
                                                width: isMobile ? Math.min(window.innerWidth - 64, 450) : 450,
                                                height: 220,
                                                className: "signature-canvas touch-action-none"
                                            }}
                                            backgroundColor="rgb(255, 255, 255)"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleClearCanvas}
                                            className="flex-1 h-12"
                                        >
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Clear
                                        </Button>
                                        <Button
                                            onClick={handleSaveSignature}
                                            className="flex-1 bg-india-green hover:bg-india-green/90 text-white h-12 font-bold"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Add to Document
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PdfSignatureEditor;
