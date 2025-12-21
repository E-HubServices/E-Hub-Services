import { useState, useRef, useEffect } from "react";
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
    Maximize2,
    Move,
    Info
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
    const [scale, setScale] = useState<number>(0.6);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [signatures, setSignatures] = useState<SignaturePlacement[]>([]);

    // Tracking active interaction
    const [activeId, setActiveId] = useState<string | null>(null);
    const [interactionMode, setInteractionMode] = useState<'drag' | 'resize' | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeBase, setResizeBase] = useState({ x: 0, y: 0, w: 0, h: 0 });

    const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

    const signatureCanvasRef = useRef<SignatureCanvas>(null);
    const pageWrapperRef = useRef<HTMLDivElement>(null);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const onPageLoadSuccess = (page: any) => {
        const viewport = page.getViewport({ scale: 1 });
        setPageDimensions({ width: viewport.width, height: viewport.height });
    };

    const handleClearCanvas = () => {
        signatureCanvasRef.current?.clear();
    };

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
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r > 240 && g > 240 && b > 240) {
                data[i + 3] = 0;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return processCanvas.toDataURL('image/png');
    };

    const handleSaveSignature = () => {
        const dataUrl = createTransparentSignature();
        if (!dataUrl) return;

        const newSignature: SignaturePlacement = {
            id: `sig-${Date.now()}`,
            dataUrl,
            // Center placement in points
            x: pageDimensions.width > 0 ? (pageDimensions.width / 2) - 75 : 50,
            y: pageDimensions.height > 0 ? (pageDimensions.height / 2) - 40 : 50,
            width: 150,
            height: 80,
            pageNumber: currentPage
        };

        setSignatures(prev => [...prev, newSignature]);
        handleClearCanvas();
        setIsDrawerOpen(false);
    };

    const startDragging = (e: React.MouseEvent | React.TouchEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

        setInteractionMode('drag');
        setActiveId(id);
        setDragOffset({ x: clientX - rect.left, y: clientY - rect.top });
    };

    const startResizing = (e: React.MouseEvent | React.TouchEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const signature = signatures.find(s => s.id === id);
        if (!signature) return;

        setInteractionMode('resize');
        setActiveId(id);
        setResizeBase({ x: clientX, y: clientY, w: signature.width, h: signature.height });
    };

    const handleGlobalMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!activeId || !interactionMode || !pageWrapperRef.current) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const containerRect = pageWrapperRef.current.getBoundingClientRect();

        if (interactionMode === 'drag') {
            const pixelX = clientX - containerRect.left - dragOffset.x;
            const pixelY = clientY - containerRect.top - dragOffset.y;

            setSignatures(prev => prev.map(sig =>
                sig.id === activeId
                    ? { ...sig, x: pixelX / scale, y: pixelY / scale }
                    : sig
            ));
        } else if (interactionMode === 'resize') {
            const deltaX = (clientX - resizeBase.x) / scale;
            const deltaY = (clientY - resizeBase.y) / scale;

            setSignatures(prev => prev.map(sig =>
                sig.id === activeId
                    ? { ...sig, width: Math.max(40, resizeBase.w + deltaX), height: Math.max(20, resizeBase.h + deltaY) }
                    : sig
            ));
        }
    };

    const handleGlobalUp = () => {
        setActiveId(null);
        setInteractionMode(null);
    };

    const handleDelete = (id: string) => {
        setSignatures(prev => prev.filter(s => s.id !== id));
    };

    const handleSubmit = () => {
        if (signatures.length > 0) onSignComplete(signatures);
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[100vw] w-full h-[100vh] max-h-[100vh] overflow-hidden flex flex-col p-0 m-0 rounded-none lg:max-w-[95vw] lg:max-h-[95vh] lg:rounded-lg lg:m-4">
                <DialogHeader className="px-4 py-3 border-b shrink-0 bg-white">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Sign Document</DialogTitle>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}><X className="h-5 w-5" /></Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
                    {/* Toolbar / Viewer Area */}
                    <div className="flex-1 flex flex-col bg-slate-100 min-h-0 border-r">
                        <div className="p-2 bg-white border-b flex items-center justify-between gap-4 shrink-0 shadow-sm z-10">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                                <span className="text-sm font-bold">{currentPage} / {numPages}</span>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))} disabled={currentPage >= numPages}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
                                <span className="text-xs font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
                                <Button variant="outline" size="icon" onClick={() => setScale(s => Math.min(2.5, s + 0.1))} className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
                            </div>
                        </div>

                        {/* Instructional Banner */}
                        <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 flex items-center gap-2 shrink-0">
                            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tighter">
                                Drag signature to position &bull; use blue handle to resize
                            </p>
                        </div>

                        {/* PDF Rendering Area */}
                        <div
                            className="flex-1 overflow-auto p-4 sm:p-12 flex flex-col items-center relative touch-none select-none"
                            onMouseMove={handleGlobalMove}
                            onTouchMove={handleGlobalMove}
                            onMouseUp={handleGlobalUp}
                            onTouchEnd={handleGlobalUp}
                            onMouseLeave={handleGlobalUp}
                        >
                            <div className="relative shadow-2xl bg-white leading-[0] w-fit mx-auto ring-1 ring-slate-200">
                                <Document
                                    file={pdfUrl}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    loading={<div className="p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
                                >
                                    <div ref={pageWrapperRef} className="relative">
                                        <Page
                                            pageNumber={currentPage}
                                            scale={scale}
                                            onLoadSuccess={onPageLoadSuccess}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                        />

                                        {/* Overlays */}
                                        {signatures.filter(s => s.pageNumber === currentPage).map(sig => (
                                            <div
                                                key={sig.id}
                                                className={cn(
                                                    "absolute border-2 border-dashed border-primary cursor-move group transition-shadow",
                                                    activeId === sig.id && "border-solid shadow-xl ring-4 ring-primary/20 z-50"
                                                )}
                                                style={{
                                                    left: sig.x * scale,
                                                    top: sig.y * scale,
                                                    width: sig.width * scale,
                                                    height: sig.height * scale,
                                                }}
                                                onMouseDown={(e) => startDragging(e, sig.id)}
                                                onTouchStart={(e) => startDragging(e, sig.id)}
                                            >
                                                <img src={sig.dataUrl} className="w-full h-full object-contain pointer-events-none" alt="Signature" />

                                                {/* Controls */}
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-3 -right-3 h-6 w-6 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(sig.id); }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                                <div className="absolute -top-3 -left-3 h-6 w-6 bg-slate-900 text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                                    <Move className="h-3 w-3" />
                                                </div>
                                                <div
                                                    className="absolute -bottom-3 -right-3 h-7 w-7 bg-primary text-white rounded-full flex items-center justify-center cursor-nwse-resize border-2 border-white shadow-lg touch-none"
                                                    onMouseDown={(e) => startResizing(e, sig.id)}
                                                    onTouchStart={(e) => startResizing(e, sig.id)}
                                                >
                                                    <Maximize2 className="h-4 w-4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Document>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar / Side Panel */}
                    <div className={cn(
                        "bg-white flex flex-col transition-all border-l",
                        isMobile ? "p-4 border-t" : "w-80"
                    )}>
                        <div className="p-6 space-y-4 flex-1">
                            {!isMobile && <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Toolbar</h3>}

                            <Button
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-slate-950 font-bold shadow-lg"
                                onClick={() => setIsDrawerOpen(true)}
                            >
                                <PenTool className="h-4 w-4 mr-2" />
                                New Signature
                            </Button>

                            {!isMobile && signatures.length > 0 && (
                                <div className="pt-4 space-y-2">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Recent Layers</p>
                                    <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                                        {signatures.map(sig => (
                                            <div key={sig.id} className="flex items-center justify-between p-2 bg-slate-50 border rounded-lg">
                                                <img src={sig.dataUrl} className="h-6 w-12 object-contain" alt="Sig" />
                                                <span className="text-[10px] font-bold">Page {sig.pageNumber}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(sig.id)}>
                                                    <Trash2 className="h-3 w-3 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t space-y-3">
                            <Button
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black"
                                onClick={handleSubmit}
                                disabled={signatures.length === 0 || isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "SUBMIT & SIGN"}
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Cancel</Button>
                        </div>
                    </div>
                </div>

                {/* Signature Drawing Modal */}
                {isDrawerOpen && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end lg:items-center lg:justify-center" onClick={() => setIsDrawerOpen(false)}>
                        <div className="bg-white w-full lg:w-[500px] rounded-t-2xl lg:rounded-2xl shadow-2xl p-6 space-y-6" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                                <h4 className="font-black uppercase tracking-tight">Draw Signature</h4>
                                <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)}><X className="h-5 w-5" /></Button>
                            </div>
                            <div className="border-4 border-slate-100 rounded-2xl overflow-hidden bg-white shadow-inner">
                                <SignatureCanvas
                                    ref={signatureCanvasRef}
                                    canvasProps={{
                                        width: isMobile ? window.innerWidth - 64 : 450,
                                        height: 250,
                                        className: "signature-canvas"
                                    }}
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 h-12 font-bold" onClick={handleClearCanvas}><RotateCcw className="h-4 w-4 mr-2" />Reset</Button>
                                <Button className="flex-1 h-12 bg-india-green hover:bg-india-green/90 text-white font-bold" onClick={handleSaveSignature}><Check className="h-4 w-4 mr-2" />Apply</Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PdfSignatureEditor;
