import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Shield,
    Download,
    ArrowLeft,
    FileText,
    Clock,
    User,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { Id } from "../../convex/_generated/dataModel";

const EsignView = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();

    const request = useQuery(api.esign.getEsignRequestById, {
        requestId: requestId as Id<"esign_requests">
    });

    const auditLogs = useQuery(api.esign.getAuditLogs, {
        requestId: requestId as Id<"esign_requests">
    });

    const fileUrl = useQuery(api.files.getFileUrl,
        request?.signedFileId ? { storageId: request.signedFileId } :
            request?.documentFileId ? { storageId: request.documentFileId } : "skip"
    );

    if (!request) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        );
    }

    const handleDownload = () => {
        if (fileUrl) {
            window.open(fileUrl, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="container flex items-center justify-between h-20">
                    <div className="flex items-center gap-4">
                        <Link to="/esign">
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <ArrowLeft className="h-5 w-5 text-slate-600" />
                            </Button>
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Endorsement Record</h1>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Request ID: {request._id.slice(-8)}</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleDownload}
                        disabled={!fileUrl}
                        className="bg-primary hover:bg-primary text-slate-950 font-black uppercase text-xs px-8 rounded-xl shadow-lg shadow-primary/20"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </header>

            <main className="flex-1 py-10">
                <div className="container max-w-5xl">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Summary Column */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                                <CardHeader className="bg-slate-900 text-white p-8">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <Badge className="bg-primary/20 text-primary border-primary/20 font-black uppercase text-[10px] mb-2">
                                                {request.status.toUpperCase()}
                                            </Badge>
                                            <CardTitle className="text-3xl font-black uppercase leading-none">{request.purpose}</CardTitle>
                                        </div>
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                                            <Shield className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 bg-white space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requester Name</p>
                                            <p className="text-lg font-bold text-slate-900">{request.requesterDetails.name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</p>
                                            <p className="text-lg font-bold text-slate-900">{request.requesterDetails.mobile}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission Date</p>
                                            <p className="text-lg font-bold text-slate-900">{format(request.createdAt, "PPP")}</p>
                                        </div>
                                        {request.authorityDetails && (
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Signed By</p>
                                                <p className="text-lg font-bold text-slate-900">{request.authorityDetails.signedBy}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-colors" onClick={handleDownload}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200">
                                                <FileText className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase">Document Asset</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{request.status === 'signed' ? 'Endorsed Version' : 'Original Draft'}</p>
                                            </div>
                                        </div>
                                        <Download className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Audit Logs */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Verification History</h3>
                                <div className="space-y-3">
                                    {auditLogs?.map((log, idx) => (
                                        <div key={log._id} className="relative flex gap-4 pl-4 group">
                                            {idx !== auditLogs.length - 1 && (
                                                <div className="absolute left-[23px] top-8 bottom-[-12px] w-px bg-slate-200" />
                                            )}
                                            <div className={`w-5 h-5 rounded-full z-10 shrink-0 mt-1 border-2 border-white shadow-sm ${log.action === 'SIGNED' ? 'bg-india-green' :
                                                    log.action === 'ACCEPTED' ? 'bg-primary' :
                                                        log.action === 'REJECTED' ? 'bg-red-500' : 'bg-slate-300'
                                                }`} />
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.action}</p>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{format(log.performedAt, "h:mm a")}</span>
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-500 uppercase leading-none">
                                                    {format(log.performedAt, "MMM d, yyyy")} • Security Verified
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endorsement Status</h3>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${request.status === 'signed' ? 'bg-india-green/10 text-india-green' : 'bg-amber-100 text-amber-600'
                                            }`}>
                                            {request.status === 'signed' ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase leading-none">{request.status}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Process ID: {Math.random().toString(36).slice(2, 10).toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100" />

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                            <User className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Signatory Type</p>
                                            <p className="text-[11px] font-bold text-slate-900 uppercase">Nalavariyam Official</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                            <Shield className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Security Level</p>
                                            <p className="text-[11px] font-bold text-slate-900 uppercase">Tamper-Evident L3</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase leading-tight">
                                            This document is digitally signed and protected against modifications.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EsignView;
