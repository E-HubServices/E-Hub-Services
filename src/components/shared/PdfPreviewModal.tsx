import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

interface PdfPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string | null;
    title: string;
    fileName?: string;
}

const PdfPreviewModal = ({ isOpen, onClose, url, title, fileName }: PdfPreviewModalProps) => {
    const [isLoading, setIsLoading] = useState(true);

    if (!url) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-4 border-b bg-white flex flex-row items-center justify-between shrink-0 space-y-0">
                    <div className="flex flex-col">
                        <DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            {title}
                        </DialogTitle>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                            Secure Document Preview
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold"
                            onClick={() => window.open(url, "_blank")}
                        >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-slate-100 relative overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10 transition-opacity">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-xs font-black uppercase text-slate-400 tracking-tighter">Preparing Preview...</p>
                            </div>
                        </div>
                    )}
                    <iframe
                        src={`${url}#toolbar=0&navpanes=0`}
                        className="w-full h-full border-none"
                        onLoad={() => setIsLoading(false)}
                        title={title}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PdfPreviewModal;
