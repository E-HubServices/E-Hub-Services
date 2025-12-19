import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Document, Page, pdfjs } from "react-pdf";
import Draggable from "react-draggable";
import {
    Shield,
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowLeft,
    Download,
    AlertCircle,
    User,
    MousePointer2,
    ChevronLeft,
    ChevronRight,
    Move
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import ChatBox from "@/components/chat/ChatBox";
import { cn } from "@/lib/utils";
import { X, MessageSquare } from "lucide-react";

// Set worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const EsignEditor = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();

    const request = useQuery(api.esign.getEsignRequestById, {
        requestId: requestId as Id<"esign_requests">
    });
    const updateStatus = useMutation(api.esign.updateEsignStatus);
    const applySignAndSeal = useAction(api.esign_actions.applyEsignAndSeal);
    const getFileUrl = useQuery(api.files.getFileUrl,
        request?.documentFileId ? { storageId: request.documentFileId } : "skip"
    );

    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    // Editor State - Using controlled position
    const [signaturePos, setSignaturePos] = useState({ x: 50, y: 50 });
    const [sealPos, setSealPos] = useState({ x: 200, y: 50 });

    const containerRef = useRef<HTMLDivElement>(null);
    const signatureRef = useRef<HTMLDivElement>(null);
    const sealRef = useRef<HTMLDivElement>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const user = useQuery(api.users.getProfile);
    const unreadCount = useQuery(api.messages.getRequestUnreadCount,
        requestId ? { esignRequestId: requestId as Id<"esign_requests"> } : "skip"
    );

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const handleApprove = async () => {
        if (!request) return;
        try {
            await updateStatus({
                requestId: request._id,
                status: "accepted"
            });
            toast.success("Request accepted! Endorsement tools unlocked.");
        } catch (error) {
            toast.error("Failed to accept request");
        }
    };

    const handleReject = async () => {
        if (!request) return;
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        try {
            await updateStatus({
                requestId: request._id,
                status: "rejected",
                rejectionReason: reason
            });
            toast.error("Request rejected");
            navigate("/esign");
        } catch (error) {
            toast.error("Failed to reject request");
        }
    };

    const toBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error(`Fetch failed for ${url}`);
                    return response.blob();
                })
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64String = reader.result as string;
                        resolve(base64String.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
                .catch(reject);
        });
    };

    const handleApplyFinal = async () => {
        if (!request || !containerRef.current) return;
        setIsProcessing(true);

        try {
            const pageElement = containerRef.current.querySelector('.react-pdf__Page');
            const renderWidth = pageElement?.clientWidth || 700;
            const renderHeight = pageElement?.clientHeight || 990;

            const signatureData = request.requireSignature ? await toBase64('/signature.png') : undefined;
            const sealData = request.requireSeal ? await toBase64('/seal.png') : undefined;

            await applySignAndSeal({
                requestId: request._id,
                pageNumber: pageNumber - 1,
                renderDimensions: { width: renderWidth, height: renderHeight },
                signatureData,
                sealData,
                signaturePlacement: request.requireSignature ? {
                    x: signaturePos.x,
                    y: signaturePos.y,
                    width: 120,
                    height: 60,
                } : undefined,
                sealPlacement: request.requireSeal ? {
                    x: sealPos.x,
                    y: sealPos.y,
                    width: 100,
                    height: 100,
                } : undefined,
            });

            toast.success("e-Sign applied successfully!");
            navigate(`/esign/view/${request._id}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to apply endorsement");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!request) return null;

    return (
        <div className="h-screen bg-slate-900 flex flex-col overflow-hidden text-slate-100">
            <header className="h-20 bg-slate-950 border-b border-white/5 px-8 flex items-center justify-between z-10 shadow-2xl">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-white/5"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-400" />
                    </Button>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-sm font-black uppercase tracking-widest text-white">Endorsement Editor</h1>
                            <Badge className="bg-primary hover:bg-primary text-slate-950 text-[10px] font-black uppercase px-2 py-0 border-none">ID: {request._id.slice(-8)}</Badge>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Nalavariyam Private Authorization System</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {request.status === "pending" && (
                        <>
                            <Button onClick={handleReject} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10 font-black uppercase text-xs">
                                <XCircle className="h-4 w-4 mr-2" /> Reject
                            </Button>
                            <Button onClick={handleApprove} className="bg-primary hover:bg-primary text-slate-950 font-black uppercase text-xs px-8 rounded-xl shadow-lg shadow-primary/20">
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Accept Request
                            </Button>
                        </>
                    )}
                    {request.status === "accepted" && (
                        <Button
                            onClick={handleApplyFinal}
                            disabled={isProcessing}
                            className="bg-india-green hover:bg-india-green text-white shadow-xl shadow-green-500/20 font-black uppercase text-xs px-8 rounded-xl h-10 active:scale-95 transition-all"
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                            Confirm & Apply Endorsement
                        </Button>
                    )}
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* PDF Canvas Area */}
                <div className="flex-1 overflow-auto bg-slate-900/50 p-12 flex justify-center scrollbar-hide">
                    <div
                        ref={containerRef}
                        className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-white rounded-sm"
                        style={{ width: '700px', minHeight: '990px', height: 'fit-content' }}
                    >
                        {getFileUrl && (
                            <Document
                                file={getFileUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={<div className="p-20 text-slate-400 font-black text-center uppercase tracking-widest">Initialising PDF Engine...</div>}
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    width={700}
                                />
                            </Document>
                        )}

                        {/* Draggable Layers - These must be rendered on top of the PDF */}
                        {request.status === "accepted" && (
                            <>
                                {request.requireSignature && (
                                    <Draggable
                                        nodeRef={signatureRef}
                                        position={{ x: signaturePos.x, y: signaturePos.y }}
                                        onDrag={(e, data) => setSignaturePos({ x: data.x, y: data.y })}
                                    >
                                        <div
                                            ref={signatureRef}
                                            className="absolute top-0 left-0 z-[1000] cursor-move select-none touch-none"
                                            style={{ width: '150px' }}
                                        >
                                            <div className="bg-primary/40 border-4 border-primary rounded-xl p-3 shadow-[0_10px_50px_rgba(255,128,0,0.5)] backdrop-blur-xl flex flex-col items-center gap-2 border-solid group ring-4 ring-primary/20">
                                                <div className="w-full h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden border-2 border-primary/30">
                                                    <img src="/signature.png" alt="Signature" className="max-h-full pointer-events-none" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Move className="h-4 w-4 text-slate-950 animate-bounce" />
                                                    <span className="text-[11px] font-black text-slate-950 uppercase tracking-tighter">DRAG SIGNATURE</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Draggable>
                                )}

                                {request.requireSeal && (
                                    <Draggable
                                        nodeRef={sealRef}
                                        position={{ x: sealPos.x, y: sealPos.y }}
                                        onDrag={(e, data) => setSealPos({ x: data.x, y: data.y })}
                                    >
                                        <div
                                            ref={sealRef}
                                            className="absolute top-0 left-0 z-[1001] cursor-move select-none touch-none"
                                            style={{ width: '140px' }}
                                        >
                                            <div className="bg-blue-600/40 border-4 border-blue-500 rounded-full p-4 shadow-[0_10px_50px_rgba(59,130,246,0.5)] backdrop-blur-xl flex flex-col items-center gap-1 border-solid ring-4 ring-blue-500/20">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-blue-500/30">
                                                    <img src="/seal.png" alt="Seal" className="max-h-full p-2 pointer-events-none" />
                                                </div>
                                                <span className="text-[9px] font-black text-white uppercase tracking-tighter">DRAG SEAL</span>
                                            </div>
                                        </div>
                                    </Draggable>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Sidebar Controls */}
                <aside className="w-80 bg-slate-950 border-l border-white/5 p-6 flex flex-col gap-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Endorsement Tools</h3>
                            <Badge className={`border-none text-[9px] font-black uppercase tracking-tighter ${request.status === "accepted" ? "bg-india-green/20 text-india-green" : "bg-orange-500/20 text-orange-400"}`}>
                                {request.status === "accepted" ? "ACTIVE" : "LOCKED"}
                            </Badge>
                        </div>

                        {request.status === "pending" ? (
                            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl space-y-3">
                                <div className="flex items-center gap-2 text-orange-400">
                                    <AlertCircle className="h-4 w-4" />
                                    <p className="text-[10px] font-black uppercase">Action Required</p>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 leading-tight mb-2 uppercase">
                                    Review the content carefully. You must manually accept this request to unlock the placement tools.
                                </p>
                                <Button onClick={handleApprove} className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 font-black uppercase text-[10px] h-9 rounded-xl shadow-lg shadow-orange-500/20">
                                    Unlock Editor Session
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-3 bg-india-green/5 border border-india-green/20 rounded-xl flex items-center gap-3">
                                    <CheckCircle2 className="h-4 w-4 text-india-green" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Drag tools are now active</p>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    {request.requireSignature && (
                                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <MousePointer2 className="h-4 w-4 text-primary" />
                                                <span className="text-[10px] font-black text-white uppercase">Signature</span>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setSignaturePos({ x: 50, y: 50 })} className="h-7 border-white/10 text-[9px] font-black text-slate-400 uppercase hover:text-white">Reset Pos</Button>
                                        </div>
                                    )}
                                    {request.requireSeal && (
                                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Shield className="h-4 w-4 text-blue-400" />
                                                <span className="text-[10px] font-black text-white uppercase">Official Seal</span>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setSealPos({ x: 200, y: 50 })} className="h-7 border-white/10 text-[9px] font-black text-slate-400 uppercase hover:text-white">Reset Pos</Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Document Controls</h3>
                            <Badge variant="outline" className="border-white/10 text-slate-500 text-[9px] font-black uppercase">Page {pageNumber}/{numPages || '?'}</Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 bg-white/5 border-white/10 text-white h-9 rounded-xl hover:bg-white/10"
                                onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                                disabled={pageNumber === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" /> Prev
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 bg-white/5 border-white/10 text-white h-9 rounded-xl hover:bg-white/10"
                                onClick={() => setPageNumber(prev => Math.min(numPages || 1, prev + 1))}
                                disabled={pageNumber === numPages}
                            >
                                Next <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Requester</h3>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4 shadow-inner">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-slate-500 uppercase leading-none">FullName</p>
                                    <p className="text-sm font-bold text-white uppercase truncate mt-1">{request.requesterDetails.name}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mobile</p>
                                    <p className="text-[11px] font-bold text-slate-300">{request.requesterDetails.mobile}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Verify ID</p>
                                    <p className="text-[11px] font-black text-primary uppercase">{request._id.slice(-6)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto space-y-3">
                        <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">DRAG COORDS</span>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${request.status === 'accepted' ? 'bg-india-green text-white' : 'bg-slate-700 text-slate-400'}`}>
                                    {request.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-[10px] font-bold text-slate-400">
                                    SIG: <span className="text-primary">{Math.round(signaturePos.x)}, {Math.round(signaturePos.y)}</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400">
                                    SEAL: <span className="text-blue-400">{Math.round(sealPos.x)}, {Math.round(sealPos.y)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 flex gap-3 shadow-inner">
                            <Shield className="h-5 w-5 text-india-green shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold text-slate-500 leading-tight uppercase tracking-tight">
                                Authorized endorsement session. All visual placements are final once confirmed.
                            </p>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Floating Chat UI */}
            {user && (
                <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4 text-slate-950">
                    {isChatOpen && (
                        <div className="w-[350px] shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                            <ChatBox
                                esignRequestId={request._id}
                                currentUserRole={user.role as "customer" | "shop_owner" | "authorized_signatory"}
                            />
                        </div>
                    )}

                    <Button
                        size="icon"
                        className={cn(
                            "h-14 w-14 rounded-full shadow-2xl transition-all active:scale-90 relative",
                            isChatOpen ? "bg-slate-950 hover:bg-slate-800" : "bg-primary hover:bg-primary/90"
                        )}
                        onClick={() => setIsChatOpen(!isChatOpen)}
                    >
                        {isChatOpen ? (
                            <X className="h-6 w-6 text-white" />
                        ) : (
                            <MessageSquare className="h-6 w-6 text-slate-950" />
                        )}

                        {/* Unread Dot */}
                        {!isChatOpen && unreadCount && unreadCount > 0 ? (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                                {unreadCount}
                            </span>
                        ) : null}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default EsignEditor;
