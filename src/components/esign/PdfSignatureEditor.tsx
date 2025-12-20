import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
    PenTool,
    Trash2,
    Download,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Check,
    X,
    Move,
    Loader2
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
    const [scale, setScale] = useState<number>(1.0);
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

    const handleSaveSignature = () => {
        if (signatureCanvasRef.current?.isEmpty()) {
            return;
        }

        const dataUrl = signatureCanvasRef.current.toDataURL("image/png");

        // Add signature to center of current page
        const newSignature: SignaturePlacement = {
            id: `sig-${Date.now()}`,
            dataUrl,
            x: 200, // Default position
            y: 200,
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
            <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                        Sign Document
                    </DialogTitle>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Draw your signature and place it on the document. You can add multiple signatures.
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex">
                    {/* Left Panel - PDF Viewer */}
                    <div className="flex-1 flex flex-col bg-slate-50 border-r">
                        {/* PDF Controls */}
                        <div className="p-4 bg-white border-b flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm font-bold px-3">
                                    Page {currentPage} of {numPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                                    disabled={currentPage === numPages}
                                >
                                    Next
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                                >
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-bold px-2">{Math.round(scale * 100)}%</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setScale(Math.min(2, scale + 0.1))}
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* PDF Display */}
                        <div
                            ref={pdfContainerRef}
                            className="flex-1 overflow-auto p-8 flex items-start justify-center relative"
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <div className="relative shadow-2xl">
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
                                    />
                                </Document>

                                {/* Signature Overlays */}
                                {currentPageSignatures.map((sig) => (
                                    <div
                                        key={sig.id}
                                        className={cn(
                                            "absolute border-2 border-dashed border-primary bg-primary/5 cursor-move group",
                                            draggedSignature === sig.id && "border-solid shadow-lg"
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
                                            className="absolute -top-3 -right-3 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteSignature(sig.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                        <div className="absolute -bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs font-bold text-primary bg-white px-2 py-1 rounded shadow-sm">
                                                <Move className="h-3 w-3 inline mr-1" />
                                                Drag to move
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Signature Pad */}
                    <div className="w-96 flex flex-col bg-white">
                        <div className="p-6 space-y-4 flex-1 overflow-auto">
                            <div>
                                <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-3">
                                    {isDrawing ? "Draw Your Signature" : "Signature Tools"}
                                </h3>

                                {!isDrawing ? (
                                    <div className="space-y-3">
                                        <Button
                                            onClick={() => setIsDrawing(true)}
                                            className="w-full bg-primary hover:bg-primary/90 text-slate-950 font-bold"
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
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white">
                                            <SignatureCanvas
                                                ref={signatureCanvasRef}
                                                canvasProps={{
                                                    width: 336,
                                                    height: 200,
                                                    className: "signature-canvas"
                                                }}
                                                backgroundColor="rgb(255, 255, 255)"
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={handleClearCanvas}
                                                className="flex-1"
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Clear
                                            </Button>
                                            <Button
                                                onClick={handleSaveSignature}
                                                className="flex-1 bg-india-green hover:bg-india-green/90 text-white"
                                            >
                                                <Check className="h-4 w-4 mr-2" />
                                                Add to Document
                                            </Button>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            onClick={() => setIsDrawing(false)}
                                            className="w-full text-slate-500"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Action Buttons */}
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
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PdfSignatureEditor;
